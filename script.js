/* RunCo Growth — minimal JS
   ----------------------------------------------------------------
   Meta Pixel event model:
     PageView         → automatic, on page load
     InitiateCheckout → Calendly modal opened (intent)
     Lead             → Calendly booking confirmed (real conversion)
     Contact          → email/whatsapp/phone, only after page focus loss
   ---------------------------------------------------------------- */

(function () {
  // --- CONFIG --------------------------------------------------
  const CALENDLY_URL = "https://calendly.com/abhay-runcogrowth/30min";

  // Safe wrapper — fbq only if Pixel has loaded.
  const fbqSafe = (...args) => {
    if (typeof window.fbq === "function") window.fbq(...args);
  };

  // --- NAV scroll state ---------------------------------------
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (window.scrollY > 8) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ============================================================
  // CUSTOM CALENDLY MODAL
  // ============================================================
  const modal = document.getElementById("cal-modal");
  const mount = document.getElementById("cal-mount");
  const skeleton = document.getElementById("cal-skeleton");

  let widgetMounted = false;
  let lastFocusedEl = null;

  const mountWidget = () => {
    if (widgetMounted) return;
    widgetMounted = true;

    // Build Calendly's iframe URL directly. Reliable and dependency-free.
    // hide_landing_page_details=1 + hide_event_type_details=1 keeps the calendar
    // visible immediately without an intro screen — no scroll needed inside the modal.
    const params = new URLSearchParams({
      embed_domain: location.hostname || "localhost",
      embed_type: "Inline",
      hide_event_type_details: "1",
      hide_landing_page_details: "1",
      hide_gdpr_banner: "1",
      primary_color: "0a0a0a",
      text_color: "0a0a0a",
      background_color: "ffffff",
    });

    const iframe = document.createElement("iframe");
    iframe.src = `${CALENDLY_URL}?${params.toString()}`;
    iframe.title = "Book a strategy call with RunCo Growth";
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allow", "fullscreen");
    iframe.setAttribute("loading", "eager");
    iframe.style.cssText = "width:100%;height:100%;border:0;display:block;";
    iframe.addEventListener("load", () => {
      setTimeout(() => skeleton.classList.add("is-hidden"), 200);
    });
    mount.appendChild(iframe);
  };

  // PRELOAD: mount the iframe in the background as soon as the browser is idle.
  // The modal itself stays hidden (visibility:hidden), so the iframe loads invisibly.
  // By the time the user clicks "Book a Call", Calendly is already painted.
  const preloadWidget = () => mountWidget();
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(preloadWidget, { timeout: 1500 });
  } else {
    setTimeout(preloadWidget, 800);
  }

  const openModal = (sourceLabel) => {
    lastFocusedEl = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("cal-locked");

    // Fire intent event the moment the modal opens (not on every click).
    fbqSafe("track", "InitiateCheckout", {
      content_name: sourceLabel || "Open Calendly Modal",
      content_category: "calendly",
    });

    // Mount widget if it hasn't preloaded yet (safety net).
    if (!widgetMounted) {
      requestAnimationFrame(() => requestAnimationFrame(mountWidget));
    }

    // Move focus into the modal for a11y.
    const closeBtn = modal.querySelector(".cal-modal__close");
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cal-locked");
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus({ preventScroll: true });
    }
  };

  // Wire all CTAs (#book + #calendly-link) to open the modal
  const bookingCtas = document.querySelectorAll('a[href="#book"], a#calendly-link');
  bookingCtas.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const label = a.textContent.trim().replace(/\s+/g, " ").slice(0, 80);
      openModal(label);
    });
  });

  // Close: click backdrop / X button / Escape key
  modal.querySelectorAll("[data-cal-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  // Listen for Calendly's official postMessage events.
  // calendly.event_scheduled fires ONLY when a booking is confirmed.
  window.addEventListener("message", (e) => {
    if (!e.data || typeof e.data !== "object") return;
    const event = e.data.event;
    if (typeof event !== "string" || event.indexOf("calendly") !== 0) return;

    if (event === "calendly.event_scheduled") {
      // Real conversion — what Meta should optimize against.
      fbqSafe("track", "Lead", {
        content_name: "Calendly Booking Confirmed",
        content_category: "calendly",
        value: 1,
        currency: "INR",
      });
      // Auto-close the modal a beat after success so they see the confirmation.
      setTimeout(closeModal, 4000);
    }
  });

  // ============================================================
  // CONTACT LINKS — focus-loss verification
  // ============================================================
  const contactLinks = document.querySelectorAll(
    'a[href^="mailto:"], a[href^="tel:"], a[href*="wa.me/"]'
  );
  contactLinks.forEach((a) => {
    a.addEventListener("click", () => {
      const href = a.getAttribute("href") || "";
      let category = "other";
      if (href.startsWith("mailto:")) category = "email";
      else if (href.startsWith("tel:")) category = "phone";
      else if (href.includes("wa.me/")) category = "whatsapp";

      const label = a.textContent.trim().replace(/\s+/g, " ").slice(0, 80);
      let fired = false;

      const handleBlur = () => {
        if (fired) return;
        fired = true;
        fbqSafe("track", "Contact", {
          content_name: label || category,
          content_category: category,
        });
        cleanup();
      };
      const handleVisibilityChange = () => {
        if (document.hidden) handleBlur();
      };
      const cleanup = () => {
        window.removeEventListener("blur", handleBlur);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };

      window.addEventListener("blur", handleBlur);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      setTimeout(() => { if (!fired) cleanup(); }, 2500);
    });
  });

  // --- Lazy enhance: gentle reveal on scroll ------------------
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document
      .querySelectorAll(".stat-card, .pain-card, .deliverable, .step, .contact-card, .case, .scarcity__card, .faq-item")
      .forEach((el) => {
        el.classList.add("reveal");
        observer.observe(el);
      });
  }
})();

/* ============================================================
   Andy Seely Portfolio — Global JavaScript
   Handles: dropdown nav, mobile menu, active link detection
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ── Dropdown navigation ── */
  const dropdownTriggers = document.querySelectorAll("[data-dropdown]");

  dropdownTriggers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const li = btn.closest("li");
      const isOpen = li.classList.contains("open");

      // Close all other dropdowns
      document
        .querySelectorAll("li.open")
        .forEach((el) => el.classList.remove("open"));

      if (!isOpen) li.classList.add("open");
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    document
      .querySelectorAll("li.open")
      .forEach((el) => el.classList.remove("open"));
  });

  /* ── Mobile menu toggle ── */
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.textContent = isOpen ? "✕" : "☰";
      toggle.setAttribute("aria-expanded", isOpen);
    });
  }

  /* ── Mark active link based on current URL ── */
  const currentPath = window.location.pathname;

  // Strip any hardcoded active classes first
  document
    .querySelectorAll(".navbar__nav a, .navbar__nav button, .sub-nav a")
    .forEach((el) => {
      el.classList.remove("active");
    });

  document.querySelectorAll(".navbar__nav a, .sub-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    const normalizedHref = href.replace("../", "").replace("./", "");

    // Special handling for "Home" link: only active at root index.html
    if (normalizedHref === "index.html") {
      // Check if this is the root index.html (no folder before it in the path)
      const isRootIndexPage =
        currentPath.endsWith("index.html") &&
        !currentPath.split("/").slice(-2, -1)[0];
      if (isRootIndexPage) {
        link.classList.add("active");
      }
      return;
    }

    // Use a stricter check: path must end with the full normalized href,
    // preceded by either the start of the string or a "/"
    const pattern = new RegExp(
      `(^|/)${normalizedHref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    );
    if (pattern.test(currentPath)) {
      link.classList.add("active");
      // If the link is inside a dropdown, also highlight the parent button
      const parentLi = link.closest(".navbar__nav > li");
      if (parentLi) {
        const trigger = parentLi.querySelector(
          ":scope > button[data-dropdown]",
        );
        if (trigger) trigger.classList.add("active");
      }
    }
  });

  // Highlight the parent dropdown button for any sub-page not directly listed
  // Maps folder names to their dropdown data-dropdown attribute value
  const sectionMap = {
    hillsborough: "schools",
    umgc: "schools",
    schiller: "schools",
    consulting: "consulting",
    ieee: "ieee",
    "ieee-cs": "ieee",
  };
  const folder = currentPath.split("/").filter(Boolean).slice(-2, -1)[0];
  if (folder && sectionMap[folder]) {
    const btn = document.querySelector(
      `.navbar__nav button[data-dropdown="${sectionMap[folder]}"]`,
    );
    if (btn) btn.classList.add("active");
  }

  /* ── Sub-nav smooth scroll to sections ── */
  document.querySelectorAll('.sub-nav a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        const offset = 64 + 48; // navbar + subnav height
        const top =
          target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  });

  /* ── Intersection observer for sub-nav active states ── */
  const sections = document.querySelectorAll("section[id]");
  const subLinks = document.querySelectorAll('.sub-nav a[href^="#"]');

  if (sections.length && subLinks.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            subLinks.forEach((l) => l.classList.remove("active"));
            const active = document.querySelector(
              `.sub-nav a[href="#${entry.target.id}"]`,
            );
            if (active) active.classList.add("active");
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );

    sections.forEach((s) => observer.observe(s));
  }

  /* ── Fade-in animation on scroll ── */
  const fadeEls = document.querySelectorAll(
    ".card, .timeline-item, .content-block",
  );
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";

          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  fadeEls.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    el.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    fadeObserver.observe(el);
  });

  /* ── Recommendation card modal ── */
  const recModal = document.getElementById("rec-modal");
  if (recModal) {
    const modalName = document.getElementById("rec-modal-name");
    const modalText = recModal.querySelector(".rec-modal__text");
    const modalClose = recModal.querySelector(".rec-modal__close");
    const modalBackdrop = recModal.querySelector(".rec-modal__backdrop");

    function openModal(name, text) {
      modalName.textContent = name;
      modalText.textContent = text;
      recModal.hidden = false;
      document.body.style.overflow = "hidden";
      modalClose.focus();
    }

    function closeModal() {
      recModal.hidden = true;
      document.body.style.overflow = "";
    }

    function bindCardsToModal(sectionId) {
      const section = document.getElementById(sectionId);
      if (!section) return;

      section.querySelectorAll(".card").forEach((card) => {
        const openCardModal = () => {
          const name = card.querySelector("h3")?.textContent.trim() ?? "";
          const text =
            card.dataset.recText ??
            card.querySelector("p:not(.card__label)")?.textContent.trim() ??
            "";
          openModal(name, text);
        };

        card.style.cursor = "pointer";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.addEventListener("click", openCardModal);
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openCardModal();
          }
        });
      });
    }

    bindCardsToModal("recommendations");
    bindCardsToModal("expertise");

    modalClose.addEventListener("click", closeModal);
    modalBackdrop.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !recModal.hidden) closeModal();
    });
  }

  /* ── Timeline collapsible toggle ── */
  const timelineToggle = document.getElementById("timeline-toggle");
  const timelineHidden = document.getElementById("timeline-hidden");

  if (timelineToggle && timelineHidden) {
    timelineToggle.addEventListener("click", () => {
      const isOpen = timelineHidden.classList.toggle("open");
      timelineToggle.classList.toggle("open", isOpen);
      timelineToggle.textContent = isOpen ? "Show Less" : "Show More";
      if (!isOpen) {
        document
          .getElementById("career-timeline")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  /* ── UMGC class pill modal ── */
  const classModal = document.getElementById("class-modal");
  if (classModal) {
    const className = document.getElementById("class-modal-name");
    const classText = classModal.querySelector(".class-modal__text");
    const classClose = classModal.querySelector(".rec-modal__close");
    const classBackdrop = classModal.querySelector(".rec-modal__backdrop");
    const classPills = document.querySelectorAll(".umgc-class-pills li");

    function openClassModal(title, description) {
      className.textContent = title;
      classText.textContent = description;
      classModal.hidden = false;
      document.body.style.overflow = "hidden";
      classClose.focus();
    }

    function closeClassModal() {
      classModal.hidden = true;
      document.body.style.overflow = "";
    }

    classPills.forEach((pill) => {
      const openPillModal = () => {
        const title =
          pill.dataset.classTitle ?? pill.textContent.trim() ?? "Class Details";
        const description =
          pill.dataset.classDescription ??
          "Course description is currently unavailable.";
        openClassModal(title, description);
      };

      pill.style.cursor = "pointer";
      pill.tabIndex = 0;
      pill.setAttribute("role", "button");

      pill.addEventListener("click", openPillModal);
      pill.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPillModal();
        }
      });
    });

    classClose.addEventListener("click", closeClassModal);
    classBackdrop.addEventListener("click", closeClassModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !classModal.hidden) closeClassModal();
    });
  }

  /* ── Consulting offering card modal ── */
  const offeringModal = document.getElementById("offering-modal");
  if (offeringModal) {
    const offeringName = document.getElementById("offering-modal-name");
    const offeringText = offeringModal.querySelector(".offering-modal__text");
    const offeringClose = offeringModal.querySelector(".rec-modal__close");
    const offeringBackdrop = offeringModal.querySelector(
      ".rec-modal__backdrop",
    );

    function openOfferingModal(title, description) {
      offeringName.textContent = title;
      offeringText.textContent = description;
      offeringModal.hidden = false;
      document.body.style.overflow = "hidden";
      offeringClose.focus();
    }

    function closeOfferingModal() {
      offeringModal.hidden = true;
      document.body.style.overflow = "";
    }

    document.querySelectorAll(".offering-card").forEach((card) => {
      const openModal = () => {
        const title =
          card.dataset.offeringTitle ??
          card.querySelector("h3")?.textContent.trim() ??
          "Service Details";
        const description =
          card.dataset.offeringDescription ?? "No details available.";
        openOfferingModal(title, description);
      };

      card.style.cursor = "pointer";
      card.tabIndex = 0;
      card.setAttribute("role", "button");

      card.addEventListener("click", openModal);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal();
        }
      });
    });

    offeringClose.addEventListener("click", closeOfferingModal);
    offeringBackdrop.addEventListener("click", closeOfferingModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !offeringModal.hidden) closeOfferingModal();
    });
  }

  /* ── Publication card modal ── */
  const pubModal = document.getElementById("pub-modal");
  if (pubModal) {
    const pubTitle = document.getElementById("pub-modal-title");
    const pubMeta = pubModal.querySelector(".pub-modal__meta");
    const pubDesc = pubModal.querySelector(".pub-modal__desc");
    const pubCitation = pubModal.querySelector(".pub-modal__citation");
    const pubLink = pubModal.querySelector(".pub-modal__link");
    const pubClose = pubModal.querySelector(".rec-modal__close");
    const pubBackdrop = pubModal.querySelector(".rec-modal__backdrop");

    function openPubModal(card) {
      const title = card.dataset.pubTitle ?? "";
      const date = card.dataset.pubDate ?? "";
      const source = card.dataset.pubSource ?? "";
      pubTitle.textContent = title;
      pubMeta.textContent = date + (source ? " · " + source : "");
      pubDesc.textContent = card.dataset.pubDesc ?? "";
      const citation = card.dataset.pubCitation ?? "";
      pubCitation.textContent = citation;
      pubCitation.hidden = !citation;
      const link = card.dataset.pubLink ?? "";
      if (!link) {
        pubLink.hidden = true;
      } else if (link === "#") {
        pubLink.hidden = false;
        pubLink.href = "#";
        pubLink.textContent = "Link coming soon";
        pubLink.style.opacity = "0.45";
        pubLink.style.pointerEvents = "none";
        pubLink.removeAttribute("target");
        pubLink.removeAttribute("rel");
      } else {
        pubLink.hidden = false;
        pubLink.href = link;
        pubLink.textContent = "View Publication ↗";
        pubLink.style.opacity = "";
        pubLink.style.pointerEvents = "";
        pubLink.target = "_blank";
        pubLink.rel = "noopener noreferrer";
      }
      pubModal.hidden = false;
      document.body.style.overflow = "hidden";
      pubClose.focus();
    }

    function closePubModal() {
      pubModal.hidden = true;
      document.body.style.overflow = "";
    }

    document.querySelectorAll(".pub-card").forEach((card) => {
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      const open = () => openPubModal(card);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });

    pubClose.addEventListener("click", closePubModal);
    pubBackdrop.addEventListener("click", closePubModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !pubModal.hidden) closePubModal();
    });
  }

  /* ── Publications Show More toggle ── */
  const pubToggle = document.getElementById("pub-toggle");
  const pubHidden = document.getElementById("pub-cards-hidden");
  if (pubToggle && pubHidden) {
    pubToggle.addEventListener("click", () => {
      const isOpen = pubHidden.classList.toggle("open");
      pubToggle.classList.toggle("open", isOpen);
      pubToggle.textContent = isOpen ? "Show Less" : "Show More";
      if (!isOpen) {
        document
          .getElementById("publications")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
});

/* ── Scroll-to-top button ── */
(function () {
  const btn = document.getElementById("scroll-top");
  if (!btn) return;
  const hero = document.querySelector(".hero");
  const threshold = hero ? hero.offsetHeight : 300;
  window.addEventListener(
    "scroll",
    () => {
      btn.classList.toggle("visible", window.scrollY > threshold);
    },
    { passive: true },
  );
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// Each role maps to one avatar color class and one badge class.
// To change a role's color, edit the avatarClass value here.
// Current avatar classes used by ROLE_CONFIGS: av-blue  av-coral  av-amber  av-green
// ===============================
// ROLE CONFIGS (PER CLUB)
// ===============================
const ROLE_CONFIGS = {
  ieee: {
    President: { avatarClass: "av-president", badgeClass: "b-president" },
    Officer: { avatarClass: "av-president", badgeClass: "b-officer" },
    Treasurer: { avatarClass: "av-treasurer", badgeClass: "b-treasurer" },
    Member: { avatarClass: "av-member", badgeClass: "b-member" },
    Assistant: { avatarClass: "av-assistant", badgeClass: "b-assistant" },
  },
  //  Hillsborough page
  codingClub: {
    Lead: { avatarClass: "av-lead", badgeClass: "b-lead" },
    Developer: { avatarClass: "av-dev", badgeClass: "b-dev" },
    Designer: { avatarClass: "av-designer", badgeClass: "b-designer" },
    President: { avatarClass: "av-president", badgeClass: "b-president" },
    Member: { avatarClass: "av-member", badgeClass: "b-member" },
  },

  umgcIEEE: {
    President: { avatarClass: "av-president", badgeClass: "b-president" },
    Treasurer: { avatarClass: "av-treasurer", badgeClass: "b-treasurer" },
    Member: { avatarClass: "av-member", badgeClass: "b-member" },
    Assistant: { avatarClass: "av-assistant", badgeClass: "b-assistant" },
  },
};

// ===============================
// ROSTER Roles DATA (EDIT HERE ONLY)
// ===============================
const ROSTERS = {
  "ieee-roles": {
    config: "ieee",
    members: [
      { name: "Andy Seely", role: "President" },
      { name: "Sam Lee", role: "Treasurer" },
      { name: "Jordan Smith", role: "Member" },
      { name: "Chad Blincoe", role: "Assistant" },
    ],
  },
  // hillsborough coding club
  "coding-roster": {
    config: "codingClub",
    members: [
      { name: "Alex Dev", role: "Lead" },
      { name: "Chris Code", role: "Developer" },
      { name: "Chad Blincoe", role: "Designer" },
      { name: "Andy Seely", role: "President" },
      { name: "Bob Smith", role: "Member" },
    ],
  },

  "umgc-ieee": {
    config: "umgcIEEE",
    members: [
      { name: "Andy Seely", role: "President" },
      { name: "Jordan Net", role: "Treasurer" },
      { name: "Casey Byte", role: "Member" },
    ],
  },
};

const DEFAULT_ROLE = { avatarClass: "av-member", badgeClass: "b-member" };

// ===============================
// INIT
// ===============================
document.querySelectorAll(".roster-container").forEach((container) => {
  const rosterId = container.dataset.rosterId;
  const roster = ROSTERS[rosterId];

  if (!roster) return;

  const ROLE_CONFIG = ROLE_CONFIGS[roster.config];
  const members = roster.members;

  const grid = container.querySelector(".card-grid");

  render(grid, members, ROLE_CONFIG);
});

// ===============================
// HELPERS
// ===============================
function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("");
}

function render(grid, members, ROLE_CONFIG) {
  if (!grid) return;

  if (!members.length) {
    grid.innerHTML = '<p class="empty">No members yet.</p>';
    return;
  }

  grid.innerHTML = members
    .map((m) => {
      const cfg = ROLE_CONFIG[m.role] || DEFAULT_ROLE;

      return `
      <div class="card">
        <div class="avatar ${cfg.avatarClass}">
          ${initials(m.name)}
        </div>
        <div>
          <div class="name">${m.name}</div>
          <div class="badge ${cfg.badgeClass}">
            ${m.role}
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

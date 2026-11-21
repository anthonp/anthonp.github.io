/* adversarypath - section scroll-spy and post chart tooltip.
   One IIFE, no modules, no storage. Degrades to the :has(:target) fallback. */
   (function () {
    "use strict";

    function initSpy() {
      var links = document.querySelectorAll('.side-nav a[href^="#"]');
      if (!links.length) return;

      var sections = document.querySelectorAll("main section[id]");
      if (!sections.length) return;
      if (!("IntersectionObserver" in window)) return;

      document.documentElement.classList.add("js-spy");

      var targets = {};
      Array.prototype.forEach.call(links, function (link) {
        var id = link.getAttribute("href").slice(1);
        if (id) targets[id] = link;
      });

      // A clicked anchor leaves its hash in the URL, and the :has(:target) rule
      // keeps that link lit. Drop the hash when the spy takes over so the click
      // highlight cannot sit beside the scroll highlight.
      function dropHash() {
        if (!window.location.hash) return;
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }

      function clearActive() {
        dropHash();
        Array.prototype.forEach.call(links, function (link) {
          link.removeAttribute("aria-current");
        });
      }

      function setActive(id) {
        clearActive();
        if (targets[id]) targets[id].setAttribute("aria-current", "true");
      }

      // Last section with a nav target: the page bottom belongs to it, even when
      // the activation band sits over the footer rather than the section.
      var lastId = "";
      for (var i = sections.length - 1; i >= 0; i--) {
        if (targets[sections[i].id]) {
          lastId = sections[i].id;
          break;
        }
      }

      var hero = document.querySelector("main .hero");
      var footer = document.querySelector(".site-footer");
      var heroVisible = false;
      var footerVisible = false;
      var ratios = {};

      function atBottom() {
        return window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 4;
      }

      var queued = false;
      function onScroll() {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
          queued = false;
          if (!lastId) return;
          if (atBottom()) {
            setActive(lastId);
          } else if (heroVisible && window.scrollY < window.innerHeight * 0.3) {
            clearActive();
          }
        });
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.target === hero) {
            heroVisible = entry.isIntersecting;
            return;
          }
          if (entry.target === footer) {
            footerVisible = entry.isIntersecting;
            return;
          }
          if (entry.isIntersecting) {
            ratios[entry.target.id] = entry.intersectionRatio;
          } else {
            delete ratios[entry.target.id];
          }
        });

        if (lastId && atBottom()) {
          setActive(lastId);
          return;
        }

        if (footerVisible && lastId) {
          setActive(lastId);
          return;
        }

        if (heroVisible) {
          clearActive();
          return;
        }

        var best = null;
        var bestTop = Infinity;
        Object.keys(ratios).forEach(function (id) {
          var el = document.getElementById(id);
          if (!el) return;
          var top = Math.abs(el.getBoundingClientRect().top);
          if (top < bestTop) {
            best = id;
            bestTop = top;
          }
        });

        if (best) setActive(best);
      }, {
        rootMargin: "-20% 0px -70% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1]
      });

      Array.prototype.forEach.call(sections, function (section) {
        if (!targets[section.id]) return;
        observer.observe(section);
      });

      if (hero) observer.observe(hero);
      if (footer) observer.observe(footer);

      window.addEventListener("hashchange", function () {
        var id = window.location.hash.slice(1);
        if (id && targets[id]) setActive(id);
      });
    }

    // Hero role rotator. Typing, dwelling, deleting, then a gap, forever. The
    // first phrase is already in the markup, so the count starts full rather than
    // retyping a word that is already on screen. Reduced motion opts out and
    // leaves the markup, first phrase included, as the final state.
    function initRotator() {
      var el = document.querySelector(".rotator, .hero__type");
      if (!el) return;

      // Marker for diagnosing which branch ran: "reduced" or "on".
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.documentElement.setAttribute("data-rotator", "reduced");
        return;
      }
      document.documentElement.setAttribute("data-rotator", "on");

      var phrases = ["penetration testing", "detection engineering", "incident response"];
      var TYPE = 75;
      var DWELL = 1800;
      var ERASE = 40;
      var GAP = 400;

      var index = 0;
      var count = phrases[0].length;
      var deleting = true;

      function tick() {
        if (deleting) {
          count -= 1;
          el.textContent = phrases[index].slice(0, count);
          if (!count) {
            deleting = false;
            index = (index + 1) % phrases.length;
            window.setTimeout(tick, GAP);
            return;
          }
          window.setTimeout(tick, ERASE);
          return;
        }

        count += 1;
        el.textContent = phrases[index].slice(0, count);
        if (count === phrases[index].length) {
          deleting = true;
          window.setTimeout(tick, DWELL);
          return;
        }
        window.setTimeout(tick, TYPE);
      }

      window.setTimeout(tick, DWELL);
    }

    // Tooltip for the inline SVG charts in published posts.
    function initCharts() {
      var charts = document.querySelectorAll(".chart");
      if (!charts.length) return;

      var openPositions = [];

      function reposition() {
        openPositions.forEach(function (fn) { fn(); });
      }

      Array.prototype.forEach.call(charts, function (chart) {
        var tip = chart.querySelector(".chart__tip");
        var points = chart.querySelectorAll(".chart-point");
        if (!tip || !points.length) return;

        var active = null;

        function position() {
          if (!active) return;
          var point = active.getBoundingClientRect();
          var box = tip.getBoundingClientRect();
          var left = point.left + point.width / 2 - box.width / 2;
          var top = point.top - box.height - 10;
          var limit = window.innerWidth - box.width - 8;
          if (left < 8) left = 8;
          if (left > limit) left = limit;
          if (top < 8) top = point.bottom + 10;
          tip.style.left = Math.round(left) + "px";
          tip.style.top = Math.round(top) + "px";
        }

        function show(point) {
          active = point;
          var series = point.getAttribute("data-series");
          var label = point.getAttribute("data-label");
          var value = point.getAttribute("data-value");
          tip.textContent = label + " — " + value + (series ? " · " + series : "");
          tip.hidden = false;
          position();
          if (openPositions.indexOf(position) === -1) openPositions.push(position);
        }

        function hide() {
          active = null;
          tip.hidden = true;
          var at = openPositions.indexOf(position);
          if (at !== -1) openPositions.splice(at, 1);
        }

        Array.prototype.forEach.call(points, function (point) {
          point.addEventListener("pointerenter", function () { show(point); });
          point.addEventListener("pointerdown", function () { show(point); });
          point.addEventListener("focus", function () { show(point); });
          point.addEventListener("pointerleave", function (event) {
            if (event.pointerType === "touch") return;
            hide();
          });
          point.addEventListener("blur", hide);
          point.addEventListener("keydown", function (event) {
            if (event.key === "Escape") hide();
          });
        });

        chart.addEventListener("pointerleave", function (event) {
          if (event.pointerType === "touch") hide();
        });
      });

      window.addEventListener("scroll", reposition, { passive: true });
      window.addEventListener("resize", reposition);
    }

    // Rotator first: it is independent of the spy and keeps running if the spy
    // fails on an older engine.
    initRotator();
    initSpy();
    initCharts();
  })();

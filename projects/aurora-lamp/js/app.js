/*!
 * Aurora Lamp — application (interaction state layer).
 * Copyright 2026 Shiplo HQ
 * SPDX-License-Identifier: Apache-2.0
 *
 * Renders data/product.json into the page (content state), wires the
 * anatomy scrub + toggle, the light-mode radio group, material swatches,
 * the spec sheet and closing CTAs. All motion goes through AuroraMotion
 * so prefers-reduced-motion collapses to readable final states.
 */
(function (global) {
  'use strict';

  var motion = global.AuroraMotion;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ================= 1 · Anatomy — exploded <-> assembled ================= */

  var anatomy = (function () {
    var stage = $('.anatomy__stage');
    if (!stage) return null;
    var svg = $('#anatomySvg');
    var wrappers = $$('.apw', svg);
    var callouts = $('#anatomyCallouts');
    var segAssembled = $('#segAssembled');
    var segExploded = $('#segExploded');
    var st = null;      // ScrollTrigger instance (desktop/tablet, motion on)
    var tween = null;   // button tween (no-scroll path)
    var head = $('#anatomyHead');

    /** amount: 1 = exploded (spread, labelled), 0 = assembled.
     *  Parts sit at data-ey in the markup (readable with JS off); GSAP's
     *  parsed y carries them to data-ay. The head column rotates home
     *  (14°) as the lamp closes, so the exploded axis stays vertical. */
    function apply(a) {
      wrappers.forEach(function (w) {
        var ey = parseFloat(w.getAttribute('data-ey'));
        var ay = parseFloat(w.getAttribute('data-ay'));
        if (isNaN(ey) || isNaN(ay)) return;
        motion.set(w, { y: ey + (ay - ey) * (1 - a) });
      });
      if (head) motion.set(head, { rotation: 14 * (1 - a), svgOrigin: '320 504' });
      if (callouts) motion.set(callouts, { opacity: Math.max(0.06, 0.96 * a) });
    }

    function pressed(isExploded) {
      segExploded.setAttribute('aria-pressed', String(isExploded));
      segAssembled.setAttribute('aria-pressed', String(!isExploded));
    }

    /** Drive to a state. With an active ScrollTrigger we simply scroll to
     *  the matching end of the pin range so the scrub stays the single
     *  source of truth (no fighting tweens). */
    function go(exploded, fromScroll) {
      pressed(exploded);
      if (st && !fromScroll) {
        var target = exploded ? st.end : st.start;
        global.scrollTo({ top: target, behavior: motion.reduced() ? 'auto' : 'smooth' });
        return;
      }
      if (tween) tween.kill();
      var proxy = { a: currentAmount };
      tween = motion.t(proxy, {
        a: exploded ? 1 : 0,
        duration: 0.7,
        ease: 'power2.inOut',
        onUpdate: function () { apply(proxy.a); currentAmount = proxy.a; }
      });
    }

    var currentAmount = 1; // DOM default = exploded (readable without JS)

    function init() {
      var canPin = motion.available && motion.scrollTrigger && !motion.reduced() &&
        global.matchMedia('(min-width: 640px)').matches;

      if (canPin) {
        apply(0); // start assembled; scroll separates it (hero cue says so)
        pressed(false);
        st = motion.scrollTrigger.create({
          trigger: stage,
          start: 'top 96px',
          end: '+=110%',
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          onUpdate: function (self) {
            currentAmount = self.progress;
            apply(self.progress);
            pressed(self.progress > 0.5);
          }
        });
      } else {
        apply(motion.reduced() ? 1 : 0);
        currentAmount = motion.reduced() ? 1 : 0;
        pressed(motion.reduced());
      }

      segAssembled.addEventListener('click', function () { go(false); });
      segExploded.addEventListener('click', function () { go(true); });
    }

    return { init: init };
  })();

  /* ================= 2 · Sections from product.json ================= */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function renderHeroMeta(d) {
    var host = $('#heroMeta');
    d.heroMeta.forEach(function (t, i) {
      if (i) host.appendChild(document.createTextNode('  ·  '));
      host.appendChild(document.createTextNode(t));
    });
    var cue = $('#scrollCue');
    if (cue && d.heroScrollCue) cue.textContent = d.heroScrollCue;
  }

  function renderParts(d) {
    var host = $('#partsList');
    if (!host) return;
    d.parts.forEach(function (p) {
      var li = el('li');
      li.appendChild(el('span', 'pl-no', p.no));
      li.appendChild(el('span', 'pl-name', p.name));
      li.appendChild(el('span', 'pl-mat', p.material));
      host.appendChild(li);
    });
  }

  function renderModes(d) {
    var section = $('#light');
    var group = $('#modeGroup');
    if (!section || !group) return;
    var readout = $('#modeReadout');
    var output = $('#modeOutput');
    var desc = $('#modeDesc');
    var live = $('#live');

    var fields = d.modes.map(function (m, i) {
      var wrap = el('div', 'modeopt');
      wrap.style.setProperty('--opt-glow', m.glowHex);
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'aurora-mode';
      input.id = 'mode-' + m.id;
      input.value = m.id;
      if (i === 0) input.checked = true; // data order = default (ember)
      var label = el('label', null, '<span class="swatchdot" aria-hidden="true"></span>' + m.label + ' — ' + m.temperature);
      label.setAttribute('for', input.id);
      wrap.appendChild(input);
      wrap.appendChild(label);
      group.appendChild(wrap);
      return { mode: m, input: input };
    });

    function select(id, announce) {
      var m = null;
      for (var i = 0; i < d.modes.length; i++) if (d.modes[i].id === id) m = d.modes[i];
      if (!m) return;
      section.setAttribute('data-mode', m.id);
      readout.firstChild.nodeValue = m.temperature;
      output.textContent = m.output + ' — ' + m.label;
      desc.innerHTML = m.description;
      // Smooth the one variable that reads as "light" (glow color). GSAP
      // tweens the CSS variable; alpha/tint snap via [data-mode] CSS.
      if (motion.available && !motion.reduced()) {
        motion.t(section, { '--glow': m.glowHex, duration: 0.45, ease: 'power2.out' });
      } else {
        section.style.setProperty('--glow', m.glowHex);
      }
      if (announce && live) live.textContent = m.announce;
    }

    group.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'aurora-mode') select(e.target.value, true);
    });
    // keyboard: radio group gives arrows for free

    select(d.modes[0].id, false);
  }

  function renderMaterials(d) {
    var list = $('#swatchList');
    var figure = $('#materialsFigure');
    var svg = $('#materialsSvg');
    var caption = $('#materialsCaption');
    if (!list || !figure) return;

    var pinned = null;

    function lit(id) {
      var mat = null;
      d.materials.forEach(function (m) { if (m.id === id) mat = m; });
      $$('.mpw', svg).forEach(function (g) {
        g.classList.toggle('is-lit', !!(mat && mat.pieces.indexOf(g.getAttribute('data-part')) !== -1));
      });
      figure.classList.toggle('is-focused', !!mat);
      caption.innerHTML = mat ? '<b>Highlighted:</b> ' + mat.caption : 'Select a material to see where it lives.';
    }

    d.materials.forEach(function (m) {
      var li = el('li');
      var btn = el('button', 'swatch');
      btn.type = 'button';
      btn.setAttribute('aria-pressed', 'false');
      btn.appendChild(el('span', 'swatch__chip'));
      btn.querySelector('.swatch__chip').style.background = m.chip;
      btn.appendChild(el('span', 'swatch__name', m.name));
      btn.appendChild(el('span', 'swatch__spec', m.spec));
      li.appendChild(btn);
      list.appendChild(li);

      btn.addEventListener('mouseenter', function () { if (!pinned) lit(m.id); });
      btn.addEventListener('focus', function () { if (!pinned) lit(m.id); });
      btn.addEventListener('mouseleave', function () { if (!pinned) lit(null); });
      btn.addEventListener('blur', function () { if (!pinned) lit(null); });
      btn.addEventListener('click', function () {
        if (pinned === m.id) { // unpin
          pinned = null;
          btn.setAttribute('aria-pressed', 'false');
          lit(null);
        } else {
          if (pinned) {
            $$('.swatch', list).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
          }
          pinned = m.id;
          btn.setAttribute('aria-pressed', 'true');
          lit(m.id);
        }
      });
    });
  }

  function renderDimensions(d) {
    var dim = d.dimensions;
    var map = { dimHeight: 'height', dimBase: 'base', dimShade: 'shade', dimCord: 'cord' };
    Object.keys(map).forEach(function (id) {
      var node = document.getElementById(id);
      var v = dim[map[id]];
      if (node && v) node.textContent = v.value + ' ' + v.unit;
    });
    var notes = $('#dimNotes');
    if (!notes) return;
    ['height', 'base', 'shade', 'cord'].forEach(function (k) {
      var v = dim[k];
      if (!v) return;
      var div = el('div');
      var dt = el('dt', null, v.label);
      var dd = el('dd', null, v.value + ' ' + v.unit);
      div.appendChild(dt);
      div.appendChild(dd);
      notes.appendChild(div);
    });
  }

  function renderSpec(d) {
    var body = $('#specBody');
    if (!body) return;
    var lastGroup = null;
    d.spec.forEach(function (row) {
      if (row.group !== lastGroup) {
        var gh = el('tr', 'sp-grouphdr');
        var th = el('th', null, row.group);
        th.setAttribute('colspan', '2');
        th.setAttribute('scope', 'colgroup');
        gh.appendChild(th);
        body.appendChild(gh);
        lastGroup = row.group;
      }
      var tr = el('tr');
      var th = el('th', null, row.row);
      th.setAttribute('scope', 'row');
      tr.appendChild(th);
      tr.appendChild(el('td', null, row.value));
      body.appendChild(tr);
    });
  }

  function renderClosing(d) {
    var lead = $('#closingLead');
    if (lead && d.closing.lead) lead.textContent = d.closing.lead;
    var replay = $('#replayBtn');
    if (replay && d.closing.replayLabel) replay.textContent = d.closing.replayLabel;
    var specs = $('#specsBtn');
    if (specs && d.closing.specsLabel) specs.textContent = d.closing.specsLabel;
    var ff = $('#footerFiction');
    if (ff && d.footerFiction) ff.textContent = d.footerFiction;
    var fr = $('#footerRights');
    if (fr && d.footerRights) fr.textContent = d.footerRights;
  }

  function dataFailed(err) {
    var main = $('#story');
    var banner = el('p', 'data-fail',
      '<strong>The local product data could not be loaded.</strong> ' +
      '<span class="note">' + (err && err.message ? err.message : 'unknown error') +
      ' — the story, drawings and copy above still read fine; serve the folder over HTTP (not file://).</span>');
    var hero = $('.hero');
    if (hero && hero.nextSibling) main.insertBefore(banner, hero.nextSibling);
    else if (hero) hero.appendChild(banner);
  }

  /* ================= 3 · Closing CTAs ================= */

  function wireCtas() {
    var replay = $('#replayBtn');
    if (replay) replay.addEventListener('click', function () {
      global.scrollTo({ top: 0, behavior: motion.reduced() ? 'auto' : 'smooth' });
    });
    var specs = $('#specsBtn');
    if (specs) specs.addEventListener('click', function () {
      var sheet = $('#specsheet');
      if (!sheet) return;
      sheet.open = true;
      sheet.scrollIntoView({ behavior: motion.reduced() ? 'auto' : 'smooth', block: 'start' });
      var summary = sheet.querySelector('summary');
      if (summary) summary.focus({ preventScroll: true });
    });
  }

  /* ================= 4 · Reveals (fade-only, budgeted) ================= */

  function reveals() {
    if (!motion.available || motion.reduced()) return;
    var gsap = global.gsap;
    // hero: copy rises, lamp fades in — never blocks interaction
    gsap.from('.hero__copy > *', { opacity: 0, y: 18, duration: 0.7, ease: 'power2.out', stagger: 0.08, delay: 0.1 });
    gsap.from('.hero__figure', { opacity: 0, duration: 0.9, ease: 'power1.out', delay: 0.25 });
    // sections: subtle fade-rise, y kept small so it reads as a fade
    $$('.band').forEach(function (band) {
      var targets = $$('.kicker, .display, .lead', band);
      if (!targets.length) return;
      gsap.from(targets, {
        opacity: 0, y: 14, duration: 0.55, ease: 'power2.out', stagger: 0.07,
        scrollTrigger: { trigger: band, start: 'top 86%', toggleActions: 'play none none none' }
      });
    });
  }

  /* ================= boot ================= */

  function boot() {
    if (anatomy) anatomy.init();
    wireCtas();
    reveals();

    if (global.AuroraData) {
      global.AuroraData.loadProduct().then(function (d) {
        renderHeroMeta(d);
        renderParts(d);
        renderModes(d);
        renderMaterials(d);
        renderDimensions(d);
        renderSpec(d);
        renderClosing(d);
      }).catch(dataFailed);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof globalThis !== 'undefined' ? globalThis : this);

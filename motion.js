// ── Motion system (nid-generator-gsap-motion-system.md, later revised by
// NID_Generator_Hide_Preview_Scroll_Indicators (1).md's "very fast white
// transition" section — see withWipe() below) ──
// Wraps the plain/instant behavior already implemented in script.js with
// GSAP transitions. Every wrapper below falls back to calling the original
// function directly — no animation, but fully functional — when GSAP/Flip
// aren't loaded (offline use, CDN failure) or when the user has asked for
// reduced motion, so the app never depends on this file to work correctly.
// Level 1 (major step navigation) = a brief solid-white flash, no travel or
// separate entrance. Level 2 (structural UI changes: selectors, form layout,
// galleries) = GSAP Flip. Level 3 (micro-interactions) = short opacity/
// transform tweens. See the source docs for the full rationale; this file
// follows their section numbers in comments where they still apply.

(function(){
  if(typeof gsap === 'undefined'){ return; } // no GSAP: script.js's own behavior stands untouched

  function prefersReducedMotion(){
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  const hasFlip = typeof Flip !== 'undefined';
  if(hasFlip) gsap.registerPlugin(Flip);

  // ── Very fast white transition (supersedes the earlier sliding wipe +
  // clip-path preview reveal) — a near-instantaneous ~220ms solid-white
  // flash between platform/purpose/form/details and into the final editor.
  // No vertical travel and no separate entrance animation for the new
  // screen: the destination must already be in its complete, final state
  // the instant the white cover clears. Wraps goToPage() (covers
  // navTo()/goBackNav(), both of which call it directly by name) and
  // goToFinal() (covers the normal completeGeneration() path and the
  // reuse-platform direct-to-editor route).
  const wipeLayer = document.getElementById('wipeLayer');
  let wipeInProgress = false;

  function withWipe(changeFn){
    if(prefersReducedMotion() || !wipeLayer){ changeFn(); return; }
    // A transition already running: let it finish rather than starting a
    // second one on top of it (explicit requirement — rapid clicks must not
    // pile up overlapping wipes).
    if(wipeInProgress){ changeFn(); return; }
    wipeInProgress = true;
    const tl = gsap.timeline({ onComplete: () => { wipeInProgress = false; } });
    tl.set(wipeLayer, { opacity: 0 })
      .to(wipeLayer, { opacity: 1, duration: 0.08, ease: 'power1.out' })
      .call(changeFn) // the screen swap happens only once the cover is fully opaque
      .to(wipeLayer, { opacity: 1, duration: 0.04 }) // the ~40ms fully-white hold
      .to(wipeLayer, { opacity: 0, duration: 0.10, ease: 'power1.in' });
  }

  const _goToPage = window.goToPage;
  window.goToPage = function(key){ withWipe(() => _goToPage(key)); };
  const _goToFinal = window.goToFinal;
  window.goToFinal = function(){ withWipe(() => _goToFinal()); };

  // ── §2 Language switcher — script.js's own applyLanguage() now moves the
  // shared .lang-indicator itself (so the very first frame, GSAP-unavailable,
  // and reduced-motion cases are all correct without this wrapper); this
  // wrapper only adds the animated move, capturing Flip state beforehand and
  // animating from it after the base function has already relocated the
  // indicator's DOM.
  const _applyLanguage = window.applyLanguage;
  window.applyLanguage = function(lang){
    const indicator = document.getElementById('langIndicator');
    // getClientRects().length===0 guards the same way as animateFieldLayout()
    // below — the switch is normally always visible, but a degenerate 0×0
    // Flip capture is never safe to risk regardless.
    if(!indicator || !hasFlip || prefersReducedMotion() || indicator.getClientRects().length === 0){ _applyLanguage(lang); return; }
    const flipState = Flip.getState(indicator); // named to avoid shadowing script.js's app-state `state`
    _applyLanguage(lang);
    Flip.from(flipState, { duration: 0.32, ease: 'power3.inOut', absolute: true });
  };

  // ── §3 Dynamic form layout — Flip smooths the surviving fields into their
  // new positions when picking a different date/category pill changes which
  // fields show; newly-revealed fields get a short fade+y entrance. Fields
  // that hide don't get an exit tween (display:none is instant, not
  // animatable, and re-plumbing setFormBadge/setModalBadge's own visibility
  // toggles to defer it wasn't worth the added fragility for this pass) —
  // everything that stays visible still repositions smoothly, which is the
  // bulk of the visual value here.
  function animateFieldLayout(container, applyFn){
    if(!hasFlip || prefersReducedMotion() || !container){ applyFn(); return; }
    // Not actually rendered yet (e.g. a display:none ancestor — the modal or
    // wizard page this container lives in hasn't been shown yet by the time
    // this runs) — there's no meaningful "before" box to Flip from, and
    // capturing one anyway risks GSAP snapshotting a degenerate 0×0 state
    // that can get stuck as a lingering inline width/height/transform once
    // the container IS shown. Just apply the change plainly.
    if(container.getClientRects().length === 0){ applyFn(); return; }
    const kids = [...container.children];
    const before = kids.filter(el => getComputedStyle(el).display !== 'none');
    const flipState = Flip.getState(before); // named to avoid shadowing script.js's app-state `state`
    applyFn();
    const after = kids.filter(el => getComputedStyle(el).display !== 'none');
    // An element this change just hid can still carry an inline opacity/
    // transform left over from a PRIOR reveal tween (GSAP inline styles
    // don't clear themselves on display:none) — wipe it now so it starts
    // clean instead of possibly reappearing invisible the next time it's
    // shown, rather than only clearing it right before that future reveal.
    const newlyHidden = kids.filter(el => !after.includes(el));
    if(newlyHidden.length) gsap.set(newlyHidden, { clearProps: 'opacity,transform' });
    Flip.from(flipState, { duration: 0.34, ease: 'power3.inOut', absolute: false });
    const entered = after.filter(el => !before.includes(el));
    if(entered.length) gsap.fromTo(entered, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out', delay: 0.05 });
  }

  const _setFormBadge = window.setFormBadge;
  window.setFormBadge = function(key){
    animateFieldLayout(document.getElementById('formBadgeSection'), () => _setFormBadge(key));
  };
  const _setModalBadge = window.setModalBadge;
  window.setModalBadge = function(key){
    animateFieldLayout(document.getElementById('mDateFieldBlock'), () => _setModalBadge(key));
  };

  // ── §5 Switching between design variations — lighter than the preview
  // reveal. There's one shared <canvas> (drawPost() redraws it in place, not
  // a second element to crossfade against), so this is a brief out/redraw/in
  // flash on the post's own frame rather than a true two-element crossfade.
  const _selectVariant = window.selectVariant;
  window.selectVariant = function(idx){
    const frame = document.querySelector('.canvas-frame');
    if(!frame || prefersReducedMotion()){ _selectVariant(idx); return; }
    gsap.to(frame, {
      opacity: 0, y: -6, duration: 0.14, ease: 'power2.out',
      onComplete: () => {
        _selectVariant(idx);
        gsap.fromTo(frame, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' });
      },
    });
  };

  // ── §7 Buttons — a small, restrained press compression on every native
  // <button> in the app (delegated on the document, since new buttons are
  // created dynamically throughout — pills, cards, gallery tiles, palette
  // circles). Skips disabled buttons; keyboard activation (Enter/Space)
  // isn't a pointer gesture, so it's intentionally left to each control's
  // own focus/hover styling instead of this press effect.
  function pressTarget(e){
    // pointerleave is registered on document itself (see below) and fires
    // with e.target === document when the pointer exits the viewport
    // entirely — Document has no .closest, so guard for Element targets only.
    if(!(e.target instanceof Element)) return null;
    const btn = e.target.closest('button');
    // The platform icons already lift on hover via their own CSS transform;
    // GSAP animating `scale` on them reads that hover transform and writes it
    // back as a permanent inline translate, leaving the icon stuck raised once
    // the pointer leaves or the page is revisited. They keep their own feedback.
    if(btn && btn.classList.contains('platform-icon-btn')) return null;
    return (btn && !btn.disabled) ? btn : null;
  }
  document.addEventListener('pointerdown', e => {
    if(prefersReducedMotion()) return;
    const btn = pressTarget(e);
    if(btn) gsap.to(btn, { scale: 0.97, duration: 0.09, ease: 'power2.out' });
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(type => {
    document.addEventListener(type, e => {
      if(prefersReducedMotion()) return;
      const btn = pressTarget(e);
      if(btn) gsap.to(btn, { scale: 1, duration: 0.12, ease: 'power2.out' });
    });
  });

  // ── §9 Validation shake — a tiny 2–3px horizontal shake on top of
  // flashRequired()'s existing border-flash + fading hint text, which
  // already matches this doc's guidance for the error message itself.
  const _flashRequired = window.flashRequired;
  window.flashRequired = function(inputId, hintId, msg){
    _flashRequired(inputId, hintId, msg);
    const el = document.getElementById(inputId);
    if(el && !prefersReducedMotion()){
      gsap.timeline()
        .to(el, { x: -3, duration: 0.06 })
        .to(el, { x: 3, duration: 0.06 })
        .to(el, { x: 0, duration: 0.06 });
    }
  };

  // ── §11 Adjust Photo — the toolbar fades/settles in rather than just
  // appearing; the preview itself stays spatially stable (enterAdjust()
  // already keeps the post's own position/size fixed, see style.css).
  const _enterAdjust = window.enterAdjust;
  window.enterAdjust = function(){
    _enterAdjust();
    if(prefersReducedMotion()) return;
    const panel = document.getElementById('adjustPanel');
    if(panel) gsap.fromTo(panel, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out' });
  };

  // ── §12 Gallery / saved drafts — renderDrafts() fully rebuilds the grid's
  // DOM from scratch every call (see script.js), so nodes can't be matched
  // by identity. Flip supports this via a shared data-flip-id it re-queries
  // itself: tag the fresh tiles with a stable id (the draft's own id for
  // real tiles, a positional id for the inert placeholder cells — script.js
  // doesn't know about this attribute, so it's added here) and let Flip
  // correlate old→new by that id. Wrapped in try/catch: this is a best-
  // effort enhancement on top of an already-fully-functional rebuild, so any
  // Flip API surprise just falls back to the plain instant redraw rather
  // than risking the drafts grid itself.
  //
  // saveFlightPending (§13 below) additionally suppresses JUST this Flip
  // pass for a save-triggered rerender — the flying copy owns that entry's
  // reveal, and existing tiles don't move (a save only ever appends), so
  // there's nothing for Flip to usefully animate on that specific call.
  const DRAFTS_SELECTOR = '#draftsList [data-flip-id]';
  const _renderDrafts = window.renderDrafts;
  let saveFlightPending = false;

  function tagDraftTiles(){
    const wrap = document.getElementById('draftsList');
    if(!wrap) return;
    [...wrap.children].forEach((el, i) => {
      const d = state.drafts[i];
      el.dataset.flipId = d ? ('draft-' + d.id) : ('placeholder-' + i);
    });
  }

  window.renderDrafts = function(){
    const draftsList = document.getElementById('draftsList');
    // Same degenerate-0×0 guard as animateFieldLayout() — renderDrafts() can
    // run (e.g. from applyLanguage()) while the final editor, and so this
    // grid, isn't the visible page at all.
    if(!hasFlip || prefersReducedMotion() || saveFlightPending || !draftsList || draftsList.getClientRects().length === 0){
      _renderDrafts();
      tagDraftTiles();
      return;
    }
    try {
      // `flipState` (not `state`) — script.js's own top-level `state` (the
      // app's data object, shared across script tags) is a different thing
      // entirely and must not be shadowed here.
      const flipState = Flip.getState(DRAFTS_SELECTOR);
      _renderDrafts();
      tagDraftTiles();
      Flip.from(flipState, {
        duration: 0.34, ease: 'power3.inOut',
        onEnter: els => gsap.fromTo(els, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out', clearProps: 'opacity,transform' }),
        onLeave: els => gsap.to(els, { opacity: 0, duration: 0.15 }),
      });
    } catch(e) { _renderDrafts(); tagDraftTiles(); }
  };

  // ── §13 Save variant — a visual copy of the live canvas flies from the
  // stationary large preview into the newly saved tile in #draftsList,
  // inspired by fly-to-cart/shared-element patterns (see the source prompt).
  // The save itself is never gated on the animation: saveDraft() always runs
  // first and is the sole source of truth for what got saved; the flight is
  // purely presentational and falls back to the plain instant result for
  // every case it can't safely animate (no GSAP, reduced motion, a full/
  // duplicate save, an off-screen destination, or a mid-flight interruption).
  const _saveDraft = window.saveDraft;
  let saveFlightActive = false;

  window.saveDraft = function(){
    if(saveFlightActive) return; // one flight at a time

    const source = document.getElementById('preview');
    const btn = document.getElementById('saveDraftBtn');
    const beforeCount = state.drafts.length;
    const canAnimate = source && btn &&
      document.getElementById('finalPage')?.classList.contains('is-current') &&
      !prefersReducedMotion() && beforeCount < MAX_DRAFTS;

    if(!canAnimate){ _saveDraft(); return; }

    const from = source.getBoundingClientRect();
    if(!from.width || !from.height){ _saveDraft(); return; }

    // Draw the visible canvas to a separate canvas, so the original remains
    // still and its appearance doesn't wait for an <img> to decode.
    let ghost;
    try {
      ghost = document.createElement('canvas');
      ghost.width = source.width;
      ghost.height = source.height;
      ghost.getContext('2d').drawImage(source, 0, 0);
    } catch(err) { _saveDraft(); return; }

    saveFlightPending = true;
    try { _saveDraft(); } // existing validation, persistence and rendering happen now
    finally { saveFlightPending = false; }

    // Duplicate/full/failed saves do not create a tile or a flight.
    if(state.drafts.length !== beforeCount + 1) return;

    const savedId = state.drafts[beforeCount].id;
    const tile = [...document.querySelectorAll('#draftsList .draft-tile')]
      .find(el => el.dataset.flipId === 'draft-' + savedId);
    const target = tile && tile.querySelector('img');
    const to = target && target.getBoundingClientRect();
    // Destination outside the viewport? Keep the save, skip the flight.
    if(!to || !to.width || !to.height || to.bottom < 0 || to.top > innerHeight ||
       to.right < 0 || to.left > innerWidth) return;

    saveFlightActive = true;
    btn.disabled = true;
    gsap.set(tile, { autoAlpha: 0 });
    document.body.appendChild(ghost);
    gsap.set(ghost, {
      position: 'fixed', left: from.left, top: from.top,
      width: from.width, height: from.height,
      margin: 0, borderRadius: '4px', pointerEvents: 'none',
      zIndex: 10000, transformOrigin: 'center center',
    });

    let finished = false;
    function finish(){
      if(finished) return;
      finished = true;
      ghost.remove();
      // renderDrafts() may have rebuilt the DOM while this was in flight
      // (e.g. a language switch or a delete) — re-find the tile by its
      // stable id rather than trust the original element reference.
      const current = [...document.querySelectorAll('#draftsList .draft-tile')]
        .find(el => el.dataset.flipId === 'draft-' + savedId);
      if(current) gsap.set(current, { clearProps: 'opacity,visibility,transform' });
      saveFlightActive = false;
      btn.disabled = state.drafts.length >= MAX_DRAFTS;
    }

    // One continuous arc — a single progress value (0→1) drives a quadratic
    // Bézier through the ghost's viewport-space CENTRE (never its top-left
    // corner, which visibly distorts the path while the rectangle shrinks),
    // from the source centre through one control point lifted above both
    // endpoints, to the destination centre. Width/height ease on their own
    // restrained smoothstep of that same t, so there is exactly one
    // monotonic motion — no separate top/left/scale tweens fighting it, no
    // initial dip, no second hump (NID_Generator_Save_Arc_And_Password_
    // Completion.md §1). Coordinates are viewport-based because the ghost is
    // position:fixed; centres are derived from the real from/to rects, never
    // stage-local coordinates, so this stays correct under responsive
    // .final-stage scaling.
    const start = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
    const end = { x: to.left + to.width / 2, y: to.top + to.height / 2 };
    const lift = Math.min(160, Math.max(100, Math.abs(end.x - start.x) * 0.30));
    const control = {
      x: start.x + (end.x - start.x) * 0.5,
      y: Math.min(start.y, end.y) - lift,
    };
    const path = { t: 0 };
    gsap.timeline({ onComplete: finish, onInterrupt: finish })
      .to(path, {
        t: 1, duration: 0.6, ease: 'power1.inOut',
        onUpdate: () => {
          const t = path.t, u = 1 - t;
          const cx = u*u*start.x + 2*u*t*control.x + t*t*end.x;
          const cy = u*u*start.y + 2*u*t*control.y + t*t*end.y;
          const sizeT = t*t*(3 - 2*t); // smoothstep — eases size on top of the position's own ease
          const w = from.width + (to.width - from.width) * sizeT;
          const h = from.height + (to.height - from.height) * sizeT;
          gsap.set(ghost, { left: cx - w/2, top: cy - h/2, width: w, height: h });
        },
      }, 0)
      // The copy fades out exactly as the real tile fades in — a crossfade,
      // not a hard cut, and no rebound (plain power2.out, no back.out).
      .to(ghost, { opacity: 0, duration: 0.16, ease: 'power2.out' }, 0.44)
      .fromTo(tile,
        { autoAlpha: 0, scale: 0.96 },
        { autoAlpha: 1, scale: 1, duration: 0.18, ease: 'power2.out',
          clearProps: 'opacity,visibility,transform' },
        0.44
      );
  };

  // The earlier direct onclick = saveDraft (script.js) captured the old,
  // unwrapped function — rebind now that window.saveDraft points here.
  document.getElementById('saveDraftBtn').onclick = window.saveDraft;
})();

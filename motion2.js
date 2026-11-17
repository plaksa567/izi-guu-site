(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = 'cubic-bezier(.22,.75,.22,1)';
  const running = new WeakMap();
  const seen = new WeakSet();
  const openers = new WeakMap();
  const revealSelector = '.section-top,.institute-card,.teacher,.mapbox,.mapInfo,.about-card,.profile,.info-section,.feedback-group-heading,.feedback-group>.section,.fact,.rating-box,.criterion,.review-card,.direction,.council-story,.hero-search';
  let observer;
  let departing = false;
  let navigationTimer;
  let pageAnimation;

  // A second click replaces the current animation rather than queuing it.
  function cancel(element) {
    const previous = running.get(element);
    if (previous) previous.cancel();
    running.delete(element);
  }

  function animate(element, frames, duration = 300, delay = 0) {
    cancel(element);
    if (preference.matches || !element.animate) return Promise.resolve(true);
    const animation = element.animate(frames, { duration, delay, easing: ease, fill: 'both' });
    running.set(element, animation);
    return animation.finished.then(() => {
      if (running.get(element) !== animation) return false;
      running.delete(element);
      animation.cancel();
      return true;
    }, () => false);
  }

  function content(element, delay = 0) {
    if (!element || !element.getClientRects().length) return;
    element.classList.remove('motion-wait');
    return animate(element, [
      { opacity: 0, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], 380, delay);
  }

  function watch(root = document) {
    if (!observer) return;
    const targets = [...root.querySelectorAll(revealSelector)];
    targets.forEach((element, index) => {
      if (seen.has(element)) return;
      seen.add(element);
      if (preference.matches || !observer || !element.getClientRects().length) return;
      element.dataset.revealDelay = String(Math.min(index % 3, 2) * 45);
      element.classList.add('motion-wait');
      observer.observe(element);
    });
  }

  function clear(root) {
    root.querySelectorAll(revealSelector).forEach(element => {
      observer?.unobserve(element);
      cancel(element);
      element.classList.remove('motion-wait');
    });
  }

  function panel(element, update, open = true) {
    const wasVisible = element.classList.contains('open');
    const current = getComputedStyle(element);
    const before = {
      height: wasVisible ? element.getBoundingClientRect().height + 'px' : '0px',
      opacity: wasVisible ? current.opacity : 0,
      paddingTop: wasVisible ? current.paddingTop : '0px',
      paddingBottom: wasVisible ? current.paddingBottom : '0px',
      borderTopWidth: wasVisible ? current.borderTopWidth : '0px',
      borderBottomWidth: wasVisible ? current.borderBottomWidth : '0px',
      marginTop: wasVisible ? current.marginTop : '0px'
    };
    cancel(element);
    update();
    element.dataset.motionOpen = String(open);
    element.inert = !open;
    if (!open && !wasVisible) return Promise.resolve(true);
    element.classList.add('open');
    const natural = getComputedStyle(element);
    const after = {
      height: open ? element.getBoundingClientRect().height + 'px' : '0px',
      opacity: open ? 1 : 0,
      paddingTop: open ? natural.paddingTop : '0px',
      paddingBottom: open ? natural.paddingBottom : '0px',
      borderTopWidth: open ? natural.borderTopWidth : '0px',
      borderBottomWidth: open ? natural.borderBottomWidth : '0px',
      marginTop: open ? natural.marginTop : '0px'
    };
    element.classList.add('motion-panel-running');
    return animate(element, [before, after], open ? 320 : 230).then(finished => {
      if (!finished) return false;
      element.classList.remove('motion-panel-running');
      element.classList.toggle('open', open);
      return true;
    });
  }

  function modal(element, open) {
    const dialog = element.querySelector('.dialog');
    const wasOpen = element.classList.contains('open');
    if (open && !wasOpen) openers.set(element, document.activeElement);
    cancel(element);
    cancel(dialog);
    element.dataset.motionOpen = String(open);
    element.classList.add('open');
    element.inert = !open;
    document.body.classList.add('motion-modal-open');
    const backdrop = animate(element, [{ opacity: open ? 0 : 1 }, { opacity: open ? 1 : 0 }], open ? 230 : 180);
    animate(dialog, [
      { transform: open ? 'translateY(18px) scale(.98)' : 'translateY(0) scale(1)' },
      { transform: open ? 'translateY(0) scale(1)' : 'translateY(10px) scale(.985)' }
    ], open ? 300 : 180);
    if (open) dialog.querySelector('input,button,select,a[href]')?.focus({ preventScroll: true });
    return backdrop.then(finished => {
      if (!finished) return;
      element.classList.toggle('open', open);
      if (!open) {
        openers.get(element)?.focus({ preventScroll: true });
        if (!document.querySelector('.modal.open')) document.body.classList.remove('motion-modal-open');
      }
    });
  }

  function internalPage(href) {
    try {
      const destination = new URL(href, location.href);
      const current = new URL(location.href);
      const folder = current.pathname.slice(0, current.pathname.lastIndexOf('/') + 1);
      if (destination.origin !== current.origin || destination.protocol !== current.protocol) return null;
      if (![folder + 'index.html', folder + 'index2.html', folder + 'teacher2.html', folder + 'stud-iis2.html'].includes(destination.pathname)) return null;
      if (destination.pathname === current.pathname && destination.search === current.search) return null;
      return destination;
    } catch { return null; }
  }

  function navigate(href) {
    if (departing) return;
    const destination = internalPage(href);
    const main = document.querySelector('main');
    if (!destination || preference.matches || !main?.animate) {
      location.assign(href);
      return;
    }
    departing = true;
    document.documentElement.classList.add('page-transitioning');
    pageAnimation = main.animate([
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-8px)' }
    ], { duration: 170, easing: ease, fill: 'forwards' });
    let committed = false;
    const commit = () => {
      if (!departing || committed) return;
      committed = true;
      clearTimeout(navigationTimer);
      location.assign(destination.href);
    };
    pageAnimation.finished.then(commit, commit);
    // Navigation also completes if a background tab pauses its animation.
    navigationTimer = setTimeout(commit, 240);
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    if (!internalPage(link.href) || preference.matches) return;
    event.preventDefault();
    navigate(link.href);
  });

  document.addEventListener('keydown', event => {
    const active = document.querySelector('.modal.open[data-motion-open="true"]');
    if (!active) return;
    if (event.key === 'Escape') { event.preventDefault(); modal(active, false); }
    if (event.key !== 'Tab') return;
    const focusable = [...active.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')]
      .filter(element => !element.disabled && element.getClientRects().length);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    departing = false;
    clearTimeout(navigationTimer);
    pageAnimation?.cancel();
    document.documentElement.classList.remove('page-transitioning');
  });

  preference.addEventListener('change', () => {
    if (!preference.matches) return;
    document.querySelectorAll('.motion-wait').forEach(element => {
      element.classList.remove('motion-wait');
      observer?.unobserve(element);
    });
  });

  window.IziMotion = { panel, modal, content, watch, clear, navigate, reduced: () => preference.matches };
  document.addEventListener('DOMContentLoaded', () => {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        content(entry.target, Number(entry.target.dataset.revealDelay || 0));
      }), { threshold: .05, rootMargin: '0px 0px 24px 0px' });
    }
    watch();
  }, { once: true });
})();

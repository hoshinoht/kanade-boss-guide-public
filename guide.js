function wireTabKeys(list, controls, select, vertical = false) {
  list.addEventListener('keydown', (event) => {
    const index = controls.indexOf(event.target);
    if (index < 0) return;
    const keys = {
      ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: controls.length - 1, ' ': index,
      ...(vertical ? { ArrowUp: index - 1, ArrowDown: index + 1 } : {}),
    };
    if (!Object.hasOwn(keys, event.key)) return;
    event.preventDefault();
    const next = controls[(keys[event.key] + controls.length) % controls.length];
    select(next);
    next.focus();
  });
}

function wireTabs(pane) {
  const list = pane.querySelector('.section-links ul');
  const tabs = Array.from(list.querySelectorAll('a'), (link) => ({
    link,
    panel: document.getElementById(link.hash.slice(1)),
  }));
  const byHash = new Map(tabs.map((tab) => [tab.link.hash, tab]));
  const contents = [...pane.querySelectorAll('.toc a')];
  const top = [];
  for (const link of contents) {
    const tab = byHash.get(link.hash);
    if (tab) tab.toc = link;
    else top.push({ link, panel: document.getElementById(link.hash.slice(1)) });
  }
  let active = tabs[0];
  let marked;
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', 'Guide sections');

  for (const { link, panel } of tabs) {
    link.id = `tab-${panel.id}`;
    link.parentElement.setAttribute('role', 'presentation');
    link.setAttribute('role', 'tab');
    link.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', link.id);
    panel.tabIndex = 0;
    panel.dataset.enhanced = '';
  }

  function highlight() {
    const rect = pane.getBoundingClientRect();
    const line = rect.top + Math.min(160, rect.height / 3);
    let current = top[0]?.link ?? active.toc;
    for (const { link, panel } of top) if (panel.getBoundingClientRect().top <= line) current = link;
    if (list.getBoundingClientRect().top <= line || pane.scrollTop > 0 && pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 2) current = active.toc;
    if (marked === current) return;
    marked?.removeAttribute('aria-current');
    marked = current;
    marked?.setAttribute('aria-current', 'location');
  }

  function show(selected) {
    active = selected;
    for (const tab of tabs) {
      const current = tab === selected;
      tab.link.tabIndex = current ? 0 : -1;
      tab.link.setAttribute('aria-selected', String(current));
      tab.panel.hidden = !current;
    }
    highlight();
  }

  function select(tab, fromContents = false) {
    show(tab);
    if (location.hash !== tab.link.hash) history.pushState(null, '', tab.link.hash);
    if (fromContents) {
      list.scrollIntoView({ block: 'start' });
      tab.link.focus({ preventScroll: true });
    }
  }

  const controls = tabs.map((tab) => tab.link);
  for (const link of [...controls, ...contents.filter((link) => byHash.has(link.hash))]) {
    link.addEventListener('click', (event) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(byHash.get(link.hash), !list.contains(link));
    });
  }

  wireTabKeys(list, controls, (link) => select(byHash.get(link.hash)));

  function readLocation() {
    const tab = byHash.get(location.hash);
    if (tab || !location.hash) show(tab ?? tabs[0]);
  }

  show(byHash.get(location.hash) ?? tabs[0]);
  pane.addEventListener('scroll', highlight, { passive: true });
  pane.addEventListener('toggle', highlight, true);
  window.addEventListener('resize', highlight);
  window.addEventListener('hashchange', readLocation);
  window.addEventListener('popstate', readLocation);
}

function wirePhases(pane) {
  const list = pane.querySelector('.guide-timeline__bar');
  if (!list) return;
  const buttons = [...list.querySelectorAll('button')];
  const panels = buttons.map((button) => document.getElementById(button.getAttribute('aria-controls')));
  function show(selected) {
    for (const [index, button] of buttons.entries()) {
      const current = button === selected;
      button.tabIndex = current ? 0 : -1;
      button.setAttribute('aria-selected', String(current));
      panels[index].hidden = !current;
    }
  }
  for (const [index, button] of buttons.entries()) {
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', button.id);
    panels[index].tabIndex = 0;
    button.addEventListener('click', () => show(button));
  }
  wireTabKeys(list, buttons, show, true);
  show(buttons[0]);
  list.hidden = false;
}

function wireStrategies(pane) {
  for (const toggle of pane.querySelectorAll('.guide-strategy__toggle')) {
    const steps = document.getElementById(toggle.getAttribute('aria-controls'));
    const show = toggle.textContent;
    steps.hidden = true;
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      steps.hidden = !steps.hidden;
      toggle.setAttribute('aria-expanded', String(!steps.hidden));
      toggle.textContent = steps.hidden ? show : 'Hide steps';
    });
  }
}

function wireHero(hero, pane) {
  const video = hero.querySelector('video');
  const toggle = hero.querySelector('input');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let compact = false;
  let visible = true;

  function updatePlayback() {
    if (!video || video.hidden) return;
    if (compact || !visible || document.hidden || !toggle.checked || motion.matches) {
      video.pause();
    } else {
      if (!video.currentSrc && video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) video.load();
      if (video.paused) video.play().catch(() => {});
    }
  }

  function updateHero() {
    const { scrollTop, scrollHeight, clientHeight } = pane;
    const next = compact ? scrollTop >= 12 : scrollTop > 96 && scrollHeight - clientHeight > 160;
    if (next === compact) return;
    compact = next;
    hero.classList.toggle('hero--compact', compact);
    updatePlayback();
  }

  pane.addEventListener('scroll', updateHero, { passive: true });
  if (video) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    }).observe(video);
    toggle.addEventListener('change', updatePlayback);
    motion.addEventListener('change', updatePlayback);
    document.addEventListener('visibilitychange', updatePlayback);
    video.addEventListener('error', () => {
      if (motion.matches) return;
      video.hidden = true;
      toggle.closest('label').hidden = true;
    }, true);
  }
  updateHero();
  updatePlayback();
}

const pane = document.querySelector('.guide-layout');
if (pane) {
  wireTabs(pane);
  wirePhases(pane);
  wireStrategies(pane);
  wireHero(document.querySelector('.hero'), pane);
}

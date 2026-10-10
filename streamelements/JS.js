/* Code für den JS-Tab eines StreamElements Custom Widget.
   Die Daten kommen NUR im StreamElements Widget an, nicht auf GitHub Pages. */
let config = {};
let session = { followers: 0, subs: 0 };
let hasSession = false;
const timerKey = 'SubBoostStudioTimerV1';
let timer = { durationMs: 12 * 3600000, remainingMs: 12 * 3600000, running: false, startedAt: null };
let lastSessionUpdate = { followers: 0, subs: 0 };
const $ = (id) => document.getElementById(id);
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const pct = (value, target) => Math.min(100, Math.max(0, value / Math.max(1, target) * 100));
const left = () => timer.running && timer.startedAt ? Math.max(0, timer.remainingMs - (Date.now() - timer.startedAt)) : timer.remainingMs;
const format = ms => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(v => String(v).padStart(2, '0')).join(':');
};
function render() {
  const total = config.countMode === 'total';
  const subs = session.subs + number(config.subsStart);
  const follows = session.followers + number(config.followersStart);
  $('sb-subs-count').textContent = `${subs} / ${config.subsTarget}`;
  $('sb-followers-count').textContent = `${follows} / ${config.followersTarget}`;
  $('sb-subs-bar').style.width = pct(subs, number(config.subsTarget, 50)) + '%';
  $('sb-followers-bar').style.width = pct(follows, number(config.followersTarget, 200)) + '%';
  $('sb-time').textContent = format(left());
  if (timer.running && left() === 0) { timer.running = false; timer.remainingMs = 0; timer.startedAt = null; persistTimer(); }
  $('sb-timer-status').textContent = timer.running ? 'Läuft' : left() === 0 ? 'Abgelaufen' : left() === timer.durationMs ? 'Bereit zum Starten' : 'Pausiert';
}
function readSession(data) {
  if (!data) return;
  const root = config.countMode === 'total' ? '-total' : '-session';
  const f = data['follower' + root]?.count;
  const s = data['subscriber' + root]?.count;
  if (Number.isFinite(Number(f))) session.followers = number(f);
  if (Number.isFinite(Number(s))) session.subs = number(s);
  hasSession = true;
  lastSessionUpdate.followers = Date.now();
  lastSessionUpdate.subs = Date.now();
  render();
}
function persistTimer() { try { SE_API.store.set(timerKey, timer); } catch (_) {} }
function toggleTimer() {
  if (timer.running) { timer.remainingMs = left(); timer.running = false; timer.startedAt = null; }
  else { if (timer.remainingMs <= 0) timer.remainingMs = timer.durationMs; timer.running = true; timer.startedAt = Date.now(); }
  persistTimer(); render();
}
function resetTimer() { timer.durationMs = Math.max(1, number(config.timerHours, 12)) * 3600000; timer.remainingMs = timer.durationMs; timer.running = false; timer.startedAt = null; persistTimer(); render(); }
window.addEventListener('onWidgetLoad', function (obj) {
  config = obj.detail.fieldData || {};
  config.subsTarget = Math.max(1, number(config.subsTarget, 50));
  config.followersTarget = Math.max(1, number(config.followersTarget, 200));
  const container = $('sb-widget');
  const style = ['neon', 'glass', 'fill', 'sharp', 'outline', 'transparent', 'image'].includes(config.style) ? config.style : 'glass';
  container.className = 'style-' + style;
  container.style.setProperty('--accent', /^#[a-f\d]{6}$/i.test(config.accent) ? config.accent : '#7863ee');
  $('sb-title').textContent = String(config.title || 'STREAM GOALS').slice(0, 32);
  $('sb-timer-row').style.display = config.showTimer === false ? 'none' : 'block';
  if (style === 'image' && /^https?:\/\//.test(config.background || '')) container.style.backgroundImage = `url(${JSON.stringify(config.background)})`;
  timer.durationMs = Math.max(1, number(config.timerHours, 12)) * 3600000;
  timer.remainingMs = timer.durationMs;
  readSession(obj.detail.session?.data || {});
  SE_API.store.get(timerKey).then(saved => { if (saved && saved.durationMs === timer.durationMs) timer = { ...timer, ...saved }; render(); }).catch(() => render());
  setInterval(render, 300);
});
window.addEventListener('onSessionUpdate', function (obj) {
  readSession(obj.detail.session || {});
});
window.addEventListener('onEventReceived', function (obj) {
  const type = obj.detail.listener, event = obj.detail.event || {};
  if (type === 'kvstore:update' && event.data?.key === 'customWidget.' + timerKey && event.data.value) { timer = {...timer, ...event.data.value}; render(); return; }
  if (type === 'widget-button') {
    if (event.field === 'toggleTimer') toggleTimer();
    if (event.field === 'resetTimer') resetTimer();
  }
  /* Fallback, falls der Session-Update-Event ausbleibt; max verhindert doppelte Zählung. */
  if (type === 'follower-latest' || type === 'subscriber-latest') {
    const key = type === 'follower-latest' ? 'followers' : 'subs';
    const amount = key === 'followers' ? 1 : (event.bulkGifted ? Math.max(1, number(event.amount, 1)) : 1);
    const old = session[key];
    setTimeout(() => { if (session[key] === old && Date.now() - lastSessionUpdate[key] > 600) { session[key] = old + amount; render(); } }, 900);
  }
});

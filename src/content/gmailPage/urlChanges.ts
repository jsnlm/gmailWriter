// Gmail is a single-page app: opening a thread changes the URL without
// reloading the page. We hear about it by listening for hash changes and by
// wrapping history.pushState/replaceState, which Gmail calls to change the URL.

type Listener = () => void;

const listeners = new Set<Listener>();
let started = false;

function notify() {
  listeners.forEach((listener) => listener());
}

function start() {
  if (started) return;
  started = true;

  window.addEventListener("hashchange", notify);

  const pushState = history.pushState.bind(history);
  history.pushState = (...args) => { pushState(...args); notify(); };
  const replaceState = history.replaceState.bind(history);
  history.replaceState = (...args) => { replaceState(...args); notify(); };
}

/** Calls `listener` whenever Gmail changes the URL. Returns an unsubscribe function. */
export function onNavigate(listener: Listener): () => void {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

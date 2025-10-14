// Lightweight event bus for cross-screen updates (no deps)
const listeners = {};

export function on(event, cb) {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(cb);
  return () => off(event, cb);
}

export function off(event, cb) {
  if (listeners[event]) listeners[event].delete(cb);
}

export function emit(event, payload) {
  if (!listeners[event]) return;
  for (const cb of Array.from(listeners[event])) {
    try {
      cb(payload);
    } catch (e) {
      console.warn(`eventBus listener error for ${event}:`, e);
    }
  }
}

export default { on, off, emit };

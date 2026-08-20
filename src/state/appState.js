const INITIAL_STATE = Object.freeze({
  selectedFilm: null,
  activeSection: null
});

export function createAppState(initial = {}) {
  let state = { ...INITIAL_STATE, ...initial };
  const listeners = new Set();

  return Object.freeze({
    get() {
      return { ...state };
    },
    set(patch) {
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener({ ...state }));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  });
}

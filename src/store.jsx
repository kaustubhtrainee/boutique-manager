import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { get, set } from 'idb-keyval';
import { defaultState } from './data';
import { ConfirmHost } from './ui';

const KEY = 'boutique-app-v1';
const Ctx = createContext(null);

async function loadState() {
  try {
    const v = await get(KEY);
    if (v) return v;
  } catch (e) {
    /* IndexedDB unavailable */
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* storage unavailable */
  }
  return null;
}

async function saveState(s) {
  try {
    await set(KEY, s);
    return true;
  } catch (e) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
      return true;
    } catch (e2) {
      return false;
    }
  }
}

// Fill any keys added in newer versions so old backups keep working.
export const migrate = (s) => {
  const d = defaultState();
  return {
    ...d,
    ...s,
    shop: { ...d.shop, ...(s.shop || {}) },
    templates: { ...d.templates, ...(s.templates || {}) },
    styleGroups: { ...d.styleGroups, ...(s.styleGroups || {}) },
  };
};

export function StoreProvider({ children }) {
  const [state, setState] = useState(null);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    loadState().then((s) => setState(s ? migrate(s) : defaultState()));
  }, []);

  useEffect(() => {
    if (!state) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => saveState(state), 250);
  }, [state]);

  const update = useCallback((fn) => setState((s) => (typeof fn === 'function' ? fn(s) : fn)), []);

  const notify = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  if (!state)
    return (
      <div className="h-full flex items-center justify-center text-plum-700 font-serif text-xl">Loading…</div>
    );

  return (
    <Ctx.Provider value={{ s: state, update, notify }}>
      {children}
      <ConfirmHost />
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] bg-ink text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);

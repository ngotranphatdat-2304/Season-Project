"use client";

type CartSyncListener = () => void;

const listeners = new Set<CartSyncListener>();

export function subscribeToCartUpdates(listener: CartSyncListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function notifyCartUpdated() {
  for (const listener of listeners) {
    listener();
  }
}

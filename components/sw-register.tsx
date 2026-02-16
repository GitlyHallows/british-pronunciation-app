"use client";

import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silent fail; app still works without cache registration.
      });
    }
  }, []);

  return null;
}

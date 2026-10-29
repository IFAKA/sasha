"use client";

import { createElement, useEffect, useState } from "react";

/** Turntable 3D view of a product with a "see it on your table" AR button (Google <model-viewer>). */
export function ProductModel({ src, name, poster }: { src: string; name: string; poster?: string | null }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The library is large and touches `window`, so load it only when a 3D view is opened.
    let live = true;
    import("@google/model-viewer").then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);

  if (!ready) return <div className="absolute inset-0 animate-pulse bg-blush" aria-hidden="true" />;

  return createElement(
    "model-viewer",
    {
      src,
      alt: `Modelo 3D: ${name}`,
      poster: poster ?? undefined,
      "camera-controls": true,
      "auto-rotate": true,
      "shadow-intensity": "1",
      // WebXR first: Scene Viewer (the Google app) crashes on some Android phones.
      "ar-modes": "webxr scene-viewer quick-look",
      "ar-scale": "fixed",
      ar: true,
      // Dragging the model turns it; it must not swipe the sheet away.
      "data-base-ui-swipe-ignore": "",
      style: { width: "100%", height: "100%", "--poster-color": "transparent" },
    },
    createElement(
      "button",
      {
        slot: "ar-button",
        type: "button",
        className:
          "absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-paper/95 px-4 py-2 text-sm font-semibold shadow",
      },
      "Ver en mi mesa",
    ),
  );
}

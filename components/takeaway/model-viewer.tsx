"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { m } from "motion/react";

type ArViewer = HTMLElement & { canActivateAR?: boolean; activateAR?: () => Promise<void> };

/**
 * A live 3D view of a product (Google <model-viewer>) that fades in over the photo once the model has
 * loaded: the cake drops in, spins, and the photo stays behind it, blurred. The "Ver en mi mesa" button
 * opens the AR camera and only shows on phones that can do AR.
 */
export function ProductModel({ src, name, poster }: { src: string; name: string; poster?: string | null }) {
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [canAr, setCanAr] = useState(false);
  const viewer = useRef<ArViewer | null>(null);

  useEffect(() => {
    // The library is large and touches `window`, so load it only when a detail sheet with a model opens.
    let live = true;
    import("@google/model-viewer").then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const el = viewer.current;
    if (!ready || !el) return;
    const onLoad = () => {
      setLoaded(true);
      setCanAr(Boolean(el.canActivateAR));
    };
    if ((el as { loaded?: boolean }).loaded) onLoad();
    el.addEventListener("load", onLoad);
    return () => el.removeEventListener("load", onLoad);
  }, [ready]);

  if (!ready) return null;

  return (
    <m.div
      className="absolute inset-0 overflow-hidden bg-blush"
      initial={{ opacity: 0 }}
      animate={{ opacity: loaded ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      style={{ pointerEvents: loaded ? "auto" : "none" }}
    >
      {/* Blurred so the photo's own cake doesn't compete with the 3D one. */}
      {poster ? (
        <div
          className="absolute -inset-4 scale-110 bg-cover bg-center blur-md brightness-90"
          style={{ backgroundImage: `url(${poster})` }}
        />
      ) : null}
      <m.div
        className="absolute inset-0"
        initial={{ opacity: 0, y: -40, scale: 0.7, rotate: -8 }}
        animate={loaded ? { opacity: 1, y: 0, scale: 1, rotate: 0 } : undefined}
        transition={{ type: "spring", stiffness: 120, damping: 14, mass: 0.9 }}
      >
        {createElement("model-viewer", {
          ref: viewer,
          src,
          alt: `Modelo 3D: ${name}`,
          "camera-controls": true,
          "auto-rotate": true,
          "auto-rotate-delay": "0",
          "rotation-per-second": "40deg",
          "camera-orbit": "30deg 68deg auto",
          "shadow-intensity": "1.2",
          // WebXR first: Scene Viewer (the Google app) crashes on some Android phones.
          "ar-modes": "webxr scene-viewer quick-look",
          "ar-scale": "fixed",
          ar: true,
          // Dragging the model turns it; it must not swipe the sheet away.
          "data-base-ui-swipe-ignore": "",
          style: { width: "100%", height: "100%", background: "transparent" },
        })}
      </m.div>
      {canAr ? (
        <m.button
          type="button"
          onClick={() => viewer.current?.activateAR?.()}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-3 left-3 rounded-full bg-paper/95 px-3.5 py-1.5 text-sm font-semibold shadow"
        >
          Ver en mi mesa
        </m.button>
      ) : null}
    </m.div>
  );
}

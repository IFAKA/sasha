"use client";

import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { m } from "motion/react";

type ArViewer = HTMLElement & { canActivateAR?: boolean; activateAR?: () => Promise<void> };

export type ModelSize = { id: string; label: string };

/**
 * A live 3D view of a product (Google <model-viewer>) that fades in over the photo once the model has
 * loaded: the cake drops in, spins, and the photo stays behind it, blurred. The "Ver en mi mesa" button
 * opens the AR camera and only shows on phones that can do AR.
 */
export function ProductModel({
  src,
  name,
  poster,
  scale = 1,
  sizes,
  sizeId,
  onSizeChange,
  onArChange,
}: {
  src: string;
  name: string;
  poster?: string | null;
  scale?: number;
  sizes: ModelSize[];
  sizeId: string;
  onSizeChange: (id: string) => void;
  /** Called with true when the AR camera opens and false when it closes. */
  onArChange?: (active: boolean) => void;
}) {
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [canAr, setCanAr] = useState(false);
  const [inAr, setInAr] = useState(false);
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
    const onStatus = (e: Event) => {
      const status = (e as CustomEvent<{ status: string }>).detail.status;
      const active = status !== "not-presenting" && status !== "failed";
      setInAr(active);
      onArChange?.(active);
    };
    el.addEventListener("load", onLoad);
    el.addEventListener("ar-status", onStatus);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("ar-status", onStatus);
    };
  }, [ready, onArChange]);

  // Closes the AR camera through the viewer's own exit button.
  const confirm = useCallback(
    () => viewer.current?.shadowRoot?.querySelector<HTMLElement>(".slot.exit-webxr-ar-button")?.click(),
    [],
  );

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
          // A fixed distance (not auto-fit), so a smaller size looks smaller. `scale` also sizes the AR model.
          "camera-orbit": "30deg 68deg 0.5m",
          "min-camera-orbit": "auto auto 0.3m",
          "max-camera-orbit": "auto auto 1.2m",
          scale: `${scale} ${scale} ${scale}`,
          "shadow-intensity": "1.2",
          // WebXR first: Scene Viewer (the Google app) crashes on some Android phones.
          "ar-modes": "webxr scene-viewer quick-look",
          "ar-scale": "fixed",
          ar: true,
          // Dragging the model turns it; it must not swipe the sheet away.
          "data-base-ui-swipe-ignore": "",
          style: { width: "100%", height: "100%", background: "transparent" },
        },
        // An empty ar-button slot replaces the library's own round AR icon; ours is the button below.
        createElement("span", { slot: "ar-button", hidden: true }),
        // Shown only inside the AR camera: pick a size (the model resizes at once), then confirm.
        inAr
          ? createElement(
              "div",
              { className: "absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 px-4" },
              createElement(
                "div",
                { className: "flex gap-2 rounded-full bg-paper/95 p-1.5 shadow" },
                ...sizes.map((s) =>
                  createElement(
                    "button",
                    {
                      key: s.id,
                      type: "button",
                      onClick: () => onSizeChange(s.id),
                      className: `rounded-full px-4 py-2 text-sm font-semibold ${s.id === sizeId ? "bg-brand text-white" : "text-ink"}`,
                    },
                    s.label,
                  ),
                ),
              ),
              createElement(
                "button",
                // eslint-disable-next-line react-hooks/refs -- the handler reads the ref only when tapped
                { type: "button", onClick: confirm, className: "rounded-full bg-brand px-8 py-3 font-semibold text-white shadow" },
                "Confirmar tamaño",
              ),
            )
          : null,
        )}
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

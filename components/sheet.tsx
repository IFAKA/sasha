"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "motion/react";

type SheetVariant = "side" | "center";

const panelMotion = {
  side: {
    className:
      "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-2xl sm:rounded-l-3xl",
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },
  center: {
    className:
      "absolute inset-x-4 top-1/2 mx-auto flex max-h-[calc(100dvh-2rem)] max-w-md -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-cream shadow-2xl",
    initial: { opacity: 0, scale: 0.94, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: 8 },
  },
} as const;

/**
 * Modal built on <dialog> (focus trap, Esc, top layer) with enter and exit
 * animations: the dialog stays open until the exit animation finishes.
 */
export function Sheet({
  open,
  onClose,
  labelledBy,
  variant = "side",
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  variant?: SheetVariant;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const panel = panelMotion[variant];

  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-ink"
    >
      <AnimatePresence onExitComplete={() => ref.current?.close()}>
        {open ? (
          <m.div key="backdrop" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
            <m.div
              className={panel.className}
              initial={panel.initial}
              animate={panel.animate}
              exit={panel.exit}
              transition={{ type: "spring", duration: 0.45, bounce: variant === "side" ? 0 : 0.2 }}
            >
              {children}
            </m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
}

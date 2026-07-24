"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function DrawerShell({
  title,
  description,
  children,
  footer,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label="Fechar painel"
        className="absolute inset-0 bg-[#17201b]/12 backdrop-blur-[1px]"
        onClick={onClose}
        type="button"
      />
      <section
        aria-describedby={description ? "drawer-description" : undefined}
        aria-modal="true"
        className="absolute inset-y-0 right-0 flex w-full max-w-[760px] flex-col border-l border-[#d4dad5] bg-[#fbfcfa] shadow-panel"
        role="dialog"
      >
        <header className="flex min-h-[82px] items-center justify-between border-b border-[#dfe3df] px-5 sm:px-7">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em]">
              {title}
            </h2>
            {description ? (
              <p
                className="mt-1 text-xs text-[#778079]"
                id="drawer-description"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="Fechar"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {children}
        </div>
        <footer className="flex items-center justify-end gap-3 border-t border-[#dfe3df] bg-white/90 px-5 py-4 sm:px-7">
          {footer}
        </footer>
      </section>
    </div>
  );
}

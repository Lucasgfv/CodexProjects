"use client";

import { CheckCircle2, XCircle } from "lucide-react";

export function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}) {
  const Icon = type === "success" ? CheckCircle2 : XCircle;
  return (
    <button
      className="fixed bottom-16 right-5 z-[80] flex max-w-sm items-center gap-3 rounded-xl border border-[#d9ded9] bg-white px-4 py-3 text-left text-[13px] shadow-panel"
      onClick={onClose}
      type="button"
    >
      <Icon
        className={type === "success" ? "text-moss" : "text-coral"}
        size={18}
      />
      <span>{message}</span>
    </button>
  );
}

import { cn } from "@/lib/format";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-moss text-[19px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]",
        className,
      )}
    >
      <span className="relative z-10 tracking-[-0.08em]">N</span>
      <span className="absolute -bottom-3 -right-2 h-7 w-7 rotate-45 bg-[#6e9a7a]/70" />
    </span>
  );
}

// แถบขั้นตอน 1-2-3-4 ด้านบนหน้าซื้อ
import { Check } from "lucide-react";
import { cx } from "./ui";

export function Steps({ labels, current }: { labels: string[]; current: number }) {
  return (
    <div className="flex items-start">
      {labels.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-1 text-center">
          <div className="flex w-full items-center">
            <div className={cx("h-0.5 flex-1", i === 0 ? "invisible" : i <= current ? "bg-navy" : "bg-line")} />
            <span className={cx("grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold", i < current ? "bg-navy text-white" : i === current ? "bg-navy text-white ring-4 ring-navy-soft" : "bg-line text-muted")}>
              {i < current ? <Check className="size-3.5" /> : i + 1}
            </span>
            <div className={cx("h-0.5 flex-1", i === labels.length - 1 ? "invisible" : i < current ? "bg-navy" : "bg-line")} />
          </div>
          <span className={cx("text-[11px]", i === current ? "font-semibold text-navy" : "text-muted")}>{label}</span>
        </div>
      ))}
    </div>
  );
}

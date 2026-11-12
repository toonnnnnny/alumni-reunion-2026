// กราฟแท่งแบบ SVG เขียนเอง (ไม่ใช้ library) ยืดตามความกว้างกล่องด้วย viewBox
import { num } from "@/lib/format";

type Series = { name: string; color: string; values: number[] };

// กราฟแท่งหลายชุด เช่น ยอดบัตร vs ยอดเสื้อ ต่อวัน
export function BarChart({ labels, series, height = 220, unit = "" }: { labels: string[]; series: Series[]; height?: number; unit?: string }) {
  const width = 640;
  const pad = { top: 16, right: 8, bottom: 28, left: 48 };
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const niceMax = Math.ceil(max / 4 / 10) * 10 * 4 || 4; // ปัดให้เส้นแบ่งเป็นเลขกลม
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const groupW = plotW / Math.max(1, labels.length);
  const barW = Math.min(28, (groupW * 0.7) / series.length);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
        {[0, 1, 2, 3, 4].map((i) => {
          const y = pad.top + plotH - (plotH * i) / 4;
          return (
            <g key={i}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e3e5e8" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9aa3af">{num((niceMax * i) / 4)}</text>
            </g>
          );
        })}
        {labels.map((label, li) => {
          const gx = pad.left + groupW * li + (groupW - barW * series.length) / 2;
          return (
            <g key={label}>
              {series.map((s, si) => {
                const v = s.values[li] ?? 0;
                const h = (plotH * v) / niceMax;
                return (
                  <rect key={s.name} x={gx + si * barW} y={pad.top + plotH - h} width={barW - 3} height={h} rx="3" fill={s.color}>
                    <title>{`${s.name} ${label}: ${num(v)} ${unit}`}</title>
                  </rect>
                );
              })}
              <text x={pad.left + groupW * li + groupW / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#6b7280">{label}</text>
            </g>
          );
        })}
      </svg>
      {series.length > 1 && (
        <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: s.color }} /> {s.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// แท่งแนวนอน เช่น ยอดขายแต่ละร้าน (ตัวเลขติดชื่อ)
export function HBars({ rows, unit, color = "#253448" }: { rows: { label: string; value: number }[]; unit: string; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{r.label}</span>
            <span className="font-semibold">{num(r.value)} <span className="text-xs font-normal text-muted">{unit}</span></span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100">
            <div className="h-2.5 rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

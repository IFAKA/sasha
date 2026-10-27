"use client";

import { useState } from "react";

export type Datum = { key: string; label: string; value: number };

const compact = new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 });

/** Rounds the axis maximum up to a clean number so ticks read 0 / 250K / 500K. */
function niceMax(max: number) {
  if (max <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / (step / 2)) * (step / 2);
}

/**
 * Single-series column chart. One brand colour (the title names the series, so no
 * legend); bars capped at 24px, 4px rounded tops on a shared baseline; hairline grid.
 * Each bar is focusable and shows a tooltip on hover or focus.
 */
export function ColumnChart({
  data,
  format,
  height = 180,
  labelEvery = 1,
  valueOnCap = false,
}: {
  data: Datum[];
  format: (v: number) => string;
  height?: number;
  labelEvery?: number;
  valueOnCap?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const ticks = [0, max / 2, max];

  return (
    <div className="relative">
      <div className="flex gap-2">
        {/* Y axis */}
        <div className="relative w-10 shrink-0 text-right text-[11px] text-muted tabular-nums" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${100 - (t / max) * 100}%` }}>
              {compact.format(t)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Gridlines */}
          <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height }} aria-hidden="true">
            {ticks.map((t) => (
              <div key={t} className="absolute inset-x-0 border-t border-line" style={{ top: `${100 - (t / max) * 100}%` }} />
            ))}
          </div>

          <ul className="relative flex items-end" style={{ height }}>
            {data.map((d, i) => {
              const pct = (d.value / max) * 100;
              return (
                <li key={d.key} className="flex h-full min-w-0 flex-1 justify-center">
                  {/* The hit target is the whole column slot, not just the painted bar. */}
                  <button
                    type="button"
                    className="group relative flex h-full w-full items-end justify-center outline-none"
                    aria-label={`${d.label}: ${format(d.value)}`}
                    onPointerEnter={() => setActive(i)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                  >
                    {valueOnCap && d.value > 0 ? (
                      <span className="absolute text-[11px] font-semibold text-ink tabular-nums" style={{ bottom: `calc(${pct}% + 4px)` }}>
                        {format(d.value)}
                      </span>
                    ) : null}
                    <span
                      className={`block w-[min(24px,70%)] rounded-t-[4px] bg-brand transition-[opacity,height] duration-500 ${
                        active === null || active === i ? "opacity-100" : "opacity-55"
                      } group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ink`}
                      style={{ height: `${Math.max(pct, d.value > 0 ? 1.5 : 0)}%` }}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* X labels */}
          <div className="mt-1.5 flex text-[11px] text-muted">
            {data.map((d, i) => (
              <span key={d.key} className="min-w-0 flex-1 text-center whitespace-nowrap">
                {i % labelEvery === 0 ? d.label : ""}
              </span>
            ))}
          </div>

          {active !== null ? (
            <div
              role="status"
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-2 text-xs whitespace-nowrap text-cream shadow-lg"
              style={{ left: `${((active + 0.5) / data.length) * 100}%` }}
            >
              <p className="text-sm font-semibold">{format(data[active].value)}</p>
              <p className="text-cream/70">{data[active].label}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Ranked horizontal bars with the value at each bar's tip. */
export function RankedBars({ data, format }: { data: Datum[]; format: (v: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ol className="space-y-3">
      {data.map((d) => (
        <li key={d.key} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-sm">
          <span className="truncate" title={d.label}>
            {d.label}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 rounded-r-[4px] bg-brand" style={{ width: `${(d.value / max) * 80}%` }} />
            <span className="shrink-0 font-semibold tabular-nums">{format(d.value)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The table view every chart offers, so no value depends on hovering. */
export function DataTable({ data, valueLabel, format }: { data: Datum[]; valueLabel: string; format: (v: number) => string }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-ink">Ver como tabla</summary>
      <table className="mt-2 w-full">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="py-1 font-medium">Día</th>
            <th className="py-1 text-right font-medium">{valueLabel}</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {data.map((d) => (
            <tr key={d.key} className="border-t border-line">
              <td className="py-1">{d.label}</td>
              <td className="py-1 text-right">{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

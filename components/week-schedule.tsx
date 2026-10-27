"use client";

import { weekSchedule } from "@/lib/shop";
import { useNow } from "@/lib/use-now";

const AR_OFFSET_MS = -3 * 60 * 60 * 1000;

function arClock(now: number) {
  const d = new Date(now + AR_OFFSET_MS);
  return { weekday: d.getUTCDay() };
}

/** Weekly schedule with today's row highlighted once the client knows the date. */
export function WeekSchedule() {
  const now = useNow();
  const today = now === null ? null : arClock(now).weekday;

  return (
    <ul className="divide-y divide-line">
      {weekSchedule.map((d) => {
        const isToday = d.weekday === today;
        return (
          <li
            key={d.day}
            className={`flex items-center justify-between py-2.5 tabular-nums ${isToday ? "font-semibold text-ink" : "text-muted"}`}
          >
            <span className="flex items-center gap-2">
              {d.day}
              {isToday ? <span className="rounded-full bg-blush px-2 py-0.5 text-xs text-brand-ink">Hoy</span> : null}
            </span>
            <span>{d.hours ?? "Cerrado"}</span>
          </li>
        );
      })}
    </ul>
  );
}

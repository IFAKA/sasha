import { closedLabel, scheduleRuns } from "@/lib/shop";

/** Opening hours with one line per group of days, so long schedules stay readable on a phone. */
export function ScheduleLines() {
  return (
    <ul className="space-y-0.5">
      {scheduleRuns.map((run) => (
        <li key={run.days}>
          <span className="font-semibold">{run.days}</span> · {run.hours}
        </li>
      ))}
      {closedLabel ? <li>{closedLabel}</li> : null}
    </ul>
  );
}

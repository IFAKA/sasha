"use client";

import { Input } from "@base-ui/react/input";
import { formatPrice } from "@/lib/menu";
import { maxLength, type Selection } from "@/lib/options";
import type { OptionGroup } from "@/shops/types";

const extraPrice = (price?: number) => (price ? ` + ${formatPrice(price)}` : "");

/** The personalization a cake allows, as chips and a text field, under the size picker. */
export function OptionFields({
  groups,
  selection,
  onChange,
}: {
  groups: OptionGroup[];
  selection: Selection;
  onChange: (selection: Selection) => void;
}) {
  const set = (id: string, value: string | string[] | undefined) => {
    const next = { ...selection };
    if (value === undefined || value === "" || value.length === 0) delete next[id];
    else next[id] = value;
    onChange(next);
  };

  return groups.map((group) => (
    <div key={group.id} role="group" aria-labelledby={`option-${group.id}`} className="mt-4">
      <p id={`option-${group.id}`} className="mb-2 text-sm font-semibold">
        {group.label}
        <span className="ml-2 font-normal text-muted">{hint(group)}</span>
      </p>
      {group.kind === "text" ? (
        <TextOption group={group} value={(selection[group.id] as string | undefined) ?? ""} onChange={(v) => set(group.id, v)} />
      ) : (
        <Chips group={group} value={selection[group.id]} onChange={(v) => set(group.id, v)} />
      )}
    </div>
  ));
}

function hint(group: OptionGroup) {
  if (group.kind === "many") return `Hasta ${group.max ?? group.choices?.length} · opcional`;
  return group.required ? "Obligatorio" : "Opcional";
}

function Chips({
  group,
  value,
  onChange,
}: {
  group: OptionGroup;
  value: string | string[] | undefined;
  onChange: (value: string | string[] | undefined) => void;
}) {
  const picked = typeof value === "string" ? [value] : (value ?? []);
  const full = group.kind === "many" && picked.length >= (group.max ?? Infinity);

  const toggle = (id: string) => {
    if (group.kind === "one") onChange(picked[0] === id && !group.required ? undefined : id);
    else onChange(picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {group.choices?.map((choice) => {
        const on = picked.includes(choice.id);
        return (
          <button
            key={choice.id}
            type="button"
            aria-pressed={on}
            disabled={full && !on}
            onClick={() => toggle(choice.id)}
            className="rounded-full bg-paper px-3.5 py-2 text-sm ring-1 ring-line transition-colors outline-none hover:ring-ink/30 focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 aria-pressed:bg-blush aria-pressed:ring-brand"
          >
            <span className="font-semibold">{choice.label}</span>
            <span className="text-muted tabular-nums">{extraPrice(choice.price)}</span>
          </button>
        );
      })}
    </div>
  );
}

function TextOption({ group, value, onChange }: { group: OptionGroup; value: string; onChange: (value: string) => void }) {
  const limit = maxLength(group);
  return (
    <>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, limit))}
        maxLength={limit}
        aria-labelledby={`option-${group.id}`}
        placeholder="Ej: Feliz cumple Ana"
        className="w-full rounded-xl bg-paper px-3.5 py-2.5 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
      />
      <p className="mt-1 flex justify-between text-xs text-muted tabular-nums">
        <span>{group.price ? `${extraPrice(group.price).slice(1)} si lo escribís` : ""}</span>
        <span aria-live="polite">
          {value.length} / {limit}
        </span>
      </p>
    </>
  );
}

"use client";

import { NumberField } from "@base-ui/react/number-field";
import { MAX_QUANTITY } from "@/components/cart/cart-provider";
import { MinusIcon, PlusIcon } from "@/components/icons";

const sizes = {
  md: { button: "size-11", input: "w-8", icon: 20 },
  sm: { button: "size-8", input: "w-6 text-sm", icon: 16 },
} as const;

/** − amount + stepper on Base UI's NumberField; the amount can also be typed. */
export function QuantityField({
  value,
  onChange,
  min = 1,
  size = "md",
  label,
  decrementLabel,
  incrementLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  size?: keyof typeof sizes;
  label: string;
  decrementLabel: string;
  incrementLabel: string;
}) {
  const s = sizes[size];
  const button = `grid ${s.button} place-items-center rounded-full hover:bg-blush disabled:opacity-40`;

  return (
    <NumberField.Root
      value={value}
      // Clearing the field while typing gives null: keep the last valid amount.
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
      min={min}
      max={MAX_QUANTITY}
    >
      <NumberField.Group className="flex items-center rounded-full ring-1 ring-line">
        <NumberField.Decrement className={button} aria-label={decrementLabel}>
          <MinusIcon width={s.icon} height={s.icon} />
        </NumberField.Decrement>
        <NumberField.Input
          aria-label={label}
          className={`${s.input} bg-transparent text-center font-semibold tabular-nums outline-none`}
        />
        <NumberField.Increment className={button} aria-label={incrementLabel}>
          <PlusIcon width={s.icon} height={s.icon} />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}

"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string[];
  setValue: (v: string[]) => void;
  hasError: boolean;
};

export default function OtpInputBoxes({ value, setValue, hasError }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const onChange = (idx: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[idx] = digit;
    setValue(next);

    if (digit && idx < 5) refs.current[idx + 1]?.focus();
  };

  const onKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  return (
    <div dir="ltr" className="flex items-center justify-center gap-2">
      {value.map((d, i) => {
        const filled = !!d;
        const base =
          "h-12 w-12 rounded-xl border text-center text-lg font-bold outline-none transition";
        const color = hasError
          ? "border-rose-400 bg-rose-50 text-rose-700"
          : filled
          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
          : "border-slate-300 bg-white text-slate-900";

        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            className={`${base} ${color}`}
          />
        );
      })}
    </div>
  );
}

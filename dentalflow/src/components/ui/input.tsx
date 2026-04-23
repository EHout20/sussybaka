import { cn } from "@/lib/cn";
import { type InputHTMLAttributes, forwardRef } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string };

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, id, label, hint, ...rest },
  ref
) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <input
        ref={ref}
        id={fieldId}
        className={cn(
          "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ring-sky-500/50 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50",
          className
        )}
        {...rest}
      />
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
});

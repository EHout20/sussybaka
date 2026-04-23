import { cn } from "@/lib/cn";
import { type TextareaHTMLAttributes, forwardRef } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { className, id, label, hint, ...rest },
  ref
) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        className={cn(
          "min-h-[96px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50",
          className
        )}
        {...rest}
      />
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
});

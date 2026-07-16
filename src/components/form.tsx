"use client";

type FieldProps = {
  id: string;
  label: string;
  labelEnd?: React.ReactNode;
  error?: React.ReactNode;
} & React.ComponentProps<"input">;

export function Field({ id, label, labelEnd, error, ...inputProps }: FieldProps) {
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className={`text-[12px] font-medium tracking-[0.06em] transition-colors duration-200 ${
            hasError ? "text-ember-deep" : "text-muted"
          }`}
        >
          {label}
        </label>
        {labelEnd}
      </div>
      <div className="relative">
        <input
          id={id}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={`peer h-[46px] w-full border-b-2 bg-transparent px-0.5 text-[17px] font-medium outline-none transition-colors duration-200 placeholder:text-clay ${
            hasError ? "border-ember" : "border-ink"
          }`}
          {...inputProps}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-ember transition-transform duration-300 ease-out peer-focus:scale-x-100"
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="animate-rise text-[13px] font-medium text-ember-deep"
        >
          {error}
        </p>
      )}
    </div>
  );
}

type TextareaProps = {
  id: string;
  label: string;
  hint?: string;
} & React.ComponentProps<"textarea">;

export function Textarea({ id, label, hint, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="text-[12px] font-medium tracking-[0.06em] text-muted"
        >
          {label}
        </label>
        {hint && <span className="text-[12px] text-clay">{hint}</span>}
      </div>
      <div className="relative">
        <textarea
          id={id}
          className="peer min-h-[92px] w-full resize-y border-b-2 border-ink bg-transparent px-0.5 py-2 text-[16px] font-medium outline-none transition-colors duration-200 placeholder:text-clay"
          {...props}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-ember transition-transform duration-300 ease-out peer-focus:scale-x-100"
        />
      </div>
    </div>
  );
}

export function SubmitButton({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`group flex h-14 items-center px-[22px] text-[16px] font-bold text-paper transition-[background-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
        pending
          ? "cursor-default justify-center gap-2.5 bg-clay"
          : "cursor-pointer justify-between bg-ink hover:bg-ink-soft active:translate-y-px"
      }`}
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="inline-block size-4 animate-spin rounded-full border-2 border-paper/35 border-t-paper"
          />
          {pendingLabel}
        </>
      ) : (
        <>
          <span>{children}</span>
          <span
            aria-hidden="true"
            className="text-ember transition-transform duration-200 ease-out group-hover:translate-x-1.5"
          >
            →
          </span>
        </>
      )}
    </button>
  );
}

export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="animate-rise border border-error-edge bg-error-bg px-4 py-3.5 text-[13.5px] leading-snug text-error-ink"
    >
      {children}
    </div>
  );
}

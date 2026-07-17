"use client";

/**
 * Stepper de séries (+/−): alvo de toque generoso no mobile, sem teclado.
 * O valor vai ao form via input hidden no chamador.
 */
export function SetsStepper({
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-stretch border-2 border-ink bg-paper">
      <StepButton
        label="Diminuir séries"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </StepButton>
      <output
        aria-label={`${value} séries`}
        className="flex flex-1 items-center justify-center text-[17px] font-bold tabular-nums"
      >
        {value}
      </output>
      <StepButton
        label="Aumentar séries"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </StepButton>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="size-11 shrink-0 cursor-pointer text-[20px] leading-none font-bold transition-colors hover:bg-ink hover:text-paper disabled:cursor-default disabled:text-clay disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
    >
      {children}
    </button>
  );
}

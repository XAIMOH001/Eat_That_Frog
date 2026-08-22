export function AuthCard({
  headline,
  subhead,
  footer,
  children,
}: {
  headline: string;
  subhead: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-surface p-8 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] sm:p-10">
      <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-primary uppercase">
        Eat That Frog
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{headline}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subhead}</p>

      {children}

      <p className="mt-7 text-center text-sm text-muted-foreground">{footer}</p>
    </div>
  );
}

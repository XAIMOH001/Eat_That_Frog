export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main>
      <article className="rounded-3xl bg-surface p-8 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] sm:p-10">
        <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-primary uppercase">
          Eat That Frog
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">Last updated {updated}</p>

        <div className="mt-8 flex flex-col gap-7">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {heading}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-2xl bg-surface px-4 py-3 text-sm leading-relaxed text-foreground shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function LegalTodo({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-danger">{children}</strong>;
}

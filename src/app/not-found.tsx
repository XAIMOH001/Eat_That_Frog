import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#e0e5ec] px-4">
      <div className="max-w-md rounded-3xl bg-[#e0e5ec] p-10 text-center shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]">
        <p className="text-6xl font-semibold tracking-tight text-foreground">404</p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center justify-center rounded-full bg-[#e0e5ec] px-6 py-3 text-sm font-semibold text-primary shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] transition-shadow duration-200 ease-out hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-[#6c5ce7]/45 focus-visible:outline-none"
        >
          Back to journal
        </Link>
      </div>
    </main>
  );
}

import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteNav } from "@/components/marketing/SiteNav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:gap-12">
        <SiteNav />
        {children}
        <SiteFooter />
      </div>
    </div>
  );
}

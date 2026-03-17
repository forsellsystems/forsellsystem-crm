"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Överblick" },
  "/prospekt": { title: "Prospekt", subtitle: "Potentiella kunder" },
  "/pipeline": { title: "Pipeline", subtitle: "Aktiva affärer" },
  "/foretag": { title: "Kunder", subtitle: "Kundregister" },
  "/aterforsaljare": { title: "Återförsäljare", subtitle: "Partners" },
  "/maskiner": { title: "Maskiner", subtitle: "Produktkatalog" },
  "/installningar": { title: "Inställningar", subtitle: "System" },
};

export function Header() {
  const pathname = usePathname();
  const basePath = "/" + (pathname.split("/")[1] || "dashboard");
  const page = pageTitles[basePath] || { title: "Forsell System", subtitle: "CRM" };

  return (
    <header className="flex h-14 items-center border-b border-[#B8BFBB]/60 bg-white/80 backdrop-blur-sm px-8">
      <div className="flex items-center gap-3">
        <span className="font-condensed text-[10px] text-[#8A9E99] tracking-[0.15em]">
          {page.subtitle}
        </span>
        <div className="h-3 w-px bg-[#B8BFBB]" />
        <h1 className="text-sm font-semibold text-[#1A1F1D] tracking-wide">
          {page.title}
        </h1>
      </div>
    </header>
  );
}

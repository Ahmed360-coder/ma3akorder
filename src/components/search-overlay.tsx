"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { SearchScreen, loadSearchData, type SearchLabels } from "@/app/search/search-screen";

// A search box that opens the search screen right on top of the page, with the cursor already in it.
// The screen stays in the page (invisible) so the tap can focus its input straight away, which is
// what makes phones raise the keyboard without a loading step.
export function SearchLauncher({ labels, locale, className }: { labels: SearchLabels; locale: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const inputRef = useRef<HTMLInputElement>(null);

  // Download the stores and items while the page sits idle, so results are ready on the first letter.
  useEffect(() => {
    const warm = () => loadSearchData(locale).catch(() => {});
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(warm);
    else setTimeout(warm, 1500);
  }, [locale]);

  useEffect(() => {
    if (!open) return;
    // The phone's back button closes search instead of leaving the page.
    history.pushState({ search: true }, "");
    const onPop = () => setOpen(false);
    window.addEventListener("popstate", onPop);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = "";
    };
  }, [open]);

  function start() {
    setOpen(true);
    inputRef.current?.focus();
  }

  return (
    <>
      <button type="button" onClick={start} className={className}>
        <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2" aria-hidden="true" />
        {labels.search}
      </button>
      {/* At the end of <body> so the search box's own section can't clip or layer over it. */}
      {mounted &&
        createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={labels.search}
        aria-hidden={!open}
        className={`fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background text-foreground transition-opacity duration-150 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <SearchScreen initialQuery="" labels={labels} locale={locale} inputRef={inputRef} active={open} onClose={() => history.back()} />
      </div>,
          document.body,
        )}
    </>
  );
}

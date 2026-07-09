"use client"

import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useRef } from "react";

export default function AppWrapper({ children }: PropsWithChildren) {
  const pathname = usePathname();
  
  const footerRef = useRef<HTMLElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    footerRef.current = document.getElementsByTagName("footer")[0];

    const observer = new ResizeObserver(updateAsideHeight);
    
    if (ref.current) {
      observer.observe(ref.current);

      for (const child of ref.current?.children)
        observer.observe(child);
    }

    updateAsideHeight();

    return () => observer.disconnect();
  }, [])

  useEffect(() => {
    if (pathname !== "/login" && pathname !== "/forgot-password")
      sessionStorage.removeItem("prefillEmail");
  }, [pathname])

  function updateAsideHeight() {
    if (ref.current) {
      ref.current.classList.add("hide-asides");
  
      const rect = ref.current.getBoundingClientRect();
      const visibleFooterHeight = rect.bottom - (footerRef.current?.getBoundingClientRect().top ?? 0);
      const height = ref.current.clientHeight - (visibleFooterHeight > 0 ? visibleFooterHeight : 0);
  
      document.documentElement.style.setProperty("--aside-height", height + "px");
      ref.current.classList.remove("hide-asides");
    }
  }

  return (
    <div className="grow flex flex-col basis-0 overflow-auto scrollbar-thin" onScroll={updateAsideHeight} ref={ref}>
      {children}
    </div>
  );
}
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation"

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="grow pt-0.5">
      <Link 
        className={`hover:text-primary ${pathname === "/discover" ? "text-primary font-bold" : ""}`} 
        href="/discover"
      >
        Discover
      </Link>
    </nav>
  );
}
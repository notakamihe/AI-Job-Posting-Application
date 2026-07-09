"use client"

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePageRouterRefresher() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, [])

  return null;
}
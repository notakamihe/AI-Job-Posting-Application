'use client'

import { useEffect } from "react";
import { Geist } from "next/font/google";
import Header from "./components/Header"
import ServerError from "@/components/icons/ServerError";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function GlobalError({ error }: { error: Error & { digest?: string }; }) {
  const year = new Date().getFullYear();

  useEffect(() => {
    document.title = "Server Error";
  }, [])

  useEffect(() => {
    console.error(error);
  }, [error])

  return (
    <html>
      <body className={`${geistSans.className} antialiased`}>
        <Header />
        <main className="grow flex flex-col justify-center items-center p-5 md:p-10">
          <ServerError className="text-[12rem] mb-7 opacity-50" />
          <h1 className="text-2xl font-bold mb-1">Server Error</h1>
          <p className="text-center">
            The server encountered an error or is temporary unavailable. 
            Please retry your request or come back at a later time.
          </p>
        </main>
        <footer className="p-3 text-center bg-primary text-white text-sm font-medium z-10">
          &copy; {year}. All rights reserved.
        </footer>
      </body>
    </html>
  )
}
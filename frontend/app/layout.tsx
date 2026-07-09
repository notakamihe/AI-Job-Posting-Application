import { cachedGetAuthUser } from "@/actions/api/user";
import "./globals.css";
import Header from "@/app/components/Header";
import { Metadata } from "next";
import { Geist } from "next/font/google"
import AppWrapper from "./AppWrapper";
import { NavigationGuardProvider } from "next-navigation-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = { 
  title: { 
    template: "%s | Job Posting Application", 
    default: "Job Posting Application: Where the Best Work Opportunities Meet the Right Talent" 
  } 
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const user = await cachedGetAuthUser();
  const year = new Date().getFullYear();

  return (
    <html lang="en">
      <body className={`${geistSans.className} antialiased`}>
        <NavigationGuardProvider>
          <Header user={user} />
          <AppWrapper>
            <main className="grow flex flex-col w-full relative">{children}</main>
            <footer className="p-3 text-center bg-primary text-white text-sm font-medium z-10">
              &copy; {year}. All rights reserved
            </footer>
          </AppWrapper>
        </NavigationGuardProvider>
      </body>
    </html>
  );
}
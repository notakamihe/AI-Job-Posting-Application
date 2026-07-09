import { cachedGetAuthUser } from "@/actions/api/user";
import NotFound from "@/components/icons/NotFound";
import { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: 'Page Not Found' };

export default async function NotFoundPage() {
  const user = await cachedGetAuthUser();

  return (
    <div className="m-auto text-center p-3">
      <NotFound className="text-[12rem] mx-auto text-base-content/25" />
      <h2 className="font-bold text-2xl mt-10 mb-1">Page Not Found</h2>
      <p className="text-gray-500 italic">
        The requested page does not exist. 
        Go back or head{" "}
        <Link className="text-primary font-bold" href={user ? "/discover" : "/login"}>somewhere safe</Link>
      </p>
    </div>
  )
}
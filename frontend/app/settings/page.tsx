import { redirect } from "next/navigation";
import AccountSettings from "./components/AccountSettings";
import { Metadata } from "next";
import { cachedGetAuthUser } from "@/actions/api/user";

export const metadata: Metadata = { title: "Account Settings" };

export default async function SettingsPage() {
  const user = await cachedGetAuthUser();
  
  if (!user)
    redirect("/login");

  if (user.roles.includes("Admin"))
    redirect("/discover");

  return (
    <div className="p-5 md:p-10">
      <h1 className="text-2xl font-bold mb-10 text-center">Account Settings</h1>
      <AccountSettings user={user} />
    </div>
  ) 
}
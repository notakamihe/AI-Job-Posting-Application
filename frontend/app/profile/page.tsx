import { Metadata } from "next";
import { cachedGetAuthUser } from "@/actions/api/user";
import { redirect } from "next/navigation";
import UserProfile from "./components/UserProfile";
import { Suspense } from "react";
import ProfileLoading from "./components/ProfileLoading";

export const metadata: Metadata = { title: "Your Profile" };

async function AuthProfilePageContent() {
  const user = await cachedGetAuthUser();
  
  if (!user)
    redirect("/login");
  
  if (user.roles.includes("Admin"))
    redirect("/discover");
  
  return <UserProfile profileUser={user} user={user} />
}

export default function AuthProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <AuthProfilePageContent />
    </Suspense>
  )
}
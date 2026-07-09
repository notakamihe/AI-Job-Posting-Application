import { getUser, cachedGetAuthUser } from "@/actions/api/user";
import UserProfile from "../components/UserProfile";
import { cache, Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import ProfileLoading from "../components/ProfileLoading";
import { getUserName } from "@/utils/utils";
import { Metadata } from "next";

const cachedGetUser = cache(getUser);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await cachedGetUser(id);

  if (user !== undefined)
    return { title: user ? getUserName(user) : "Private Profile" };

  return { title: "Page Not Found" };
}

async function ProfilePageContent({ params }: { params: Promise<{ id: string; }> }) {
  const { id } = await params;
  const profileUser = await cachedGetUser(id);
  
  if (profileUser === undefined)
    notFound();
  
  const user = await cachedGetAuthUser();
  
  if (user && user.id === profileUser?.id)
    redirect(user.roles.includes("Admin") ? "/discover" : "/profile");
  
  return <UserProfile profileUser={profileUser} user={user} />;
}

export default function ProfilePage({ params }: { params: Promise<{ id: string; }> }) {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfilePageContent params={params} />
    </Suspense>
  )
}
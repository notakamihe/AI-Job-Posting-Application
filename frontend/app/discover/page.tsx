import { cachedGetAuthUser, getJobApplications } from "@/actions/api/user";
import { Metadata } from "next";
import Discover from "./components/Discover";

export async function generateMetadata({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}): Promise<Metadata> {
  const { term } = await searchParams;
  return { title: term ? `Search for "${term}"` : "Discover" };
}

export default async function DiscoverPage() {
  const user = await cachedGetAuthUser();
  const applications = user?.type === "Employer" ? await getJobApplications(user.id) : { results: [], totalCount: 0 };

  return <Discover applications={applications} user={user} />;
}
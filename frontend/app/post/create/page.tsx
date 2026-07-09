import { Metadata } from "next";
import JobPostForm from "../components/JobPostForm";
import { cachedGetAuthUser } from "@/actions/api/user";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create Job Post" };

export default async function CreateJobPostPage() {
  const user = await cachedGetAuthUser();

  if (user?.type !== "Employer")
    redirect(user ? "/discover" : "/login");
  
  return <JobPostForm />;
}
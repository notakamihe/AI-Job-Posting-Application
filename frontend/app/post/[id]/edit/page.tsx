import { getJobPost } from "@/actions/api/jobPost";
import { redirect } from "next/navigation";
import JobPostForm from "../../components/JobPostForm";
import { cachedGetAuthUser } from "@/actions/api/user";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Job Post" };

export default async function EditJobPostPage({ params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  const post = await getJobPost(id);

  if (!post)
    redirect("/discover");

  const user = await cachedGetAuthUser();

  if (!user)
    redirect("/login");
  else if (post.employer.id !== user.id && !user.roles.includes("Admin"))
    redirect(`/post/${post.id}`);

  return <JobPostForm post={post} />
}
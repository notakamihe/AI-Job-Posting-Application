import { getApplicationsByJobPost, getJobPost, getSimilarJobPosts } from "@/actions/api/jobPost";
import JobPostDetail from "./components/JobPostDetail";
import { cache, Suspense } from "react";
import { notFound } from "next/navigation";
import { cachedGetAuthUser } from "@/actions/api/user";
import { Metadata } from "next";

const cachedGetJobPost = cache(getJobPost);

export async function generateMetadata({ params }: { params: Promise<{ id: number }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await cachedGetJobPost(id);

  return { title: post ? `${post.title} from ${post.employer.name}` : "Page Not Found" };
}

async function JobPostPageContent({ params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  const post = await cachedGetJobPost(id);

  if (!post)
    notFound();

  const user = await cachedGetAuthUser();
  const isAdmin = !!user && user.roles.includes("Admin");
  const similar = user?.type !== "Employer" && !isAdmin ? await getSimilarJobPosts(post.id) : [];
  const applications = user && (isAdmin || post.employer.id === user?.id)
    ? await getApplicationsByJobPost(post.id) 
    : { results: [], totalCount: 0 };

  return <JobPostDetail applications={applications} post={post} similar={similar} user={user} />;
}

export default function JobPostPage({ params }: { params: Promise<{ id: number }> }) {
  return (
    <Suspense 
      fallback={
        <div className="flex flex-col max-w-7xl w-full h-full mx-auto p-5 md:p-10">
          <div className="skeleton w-full h-8 mb-2 sm:min-w-lg sm:max-w-5/10 md:h-10" />
          <div className="skeleton w-1/2 h-5 max-w-md sm:w-1/4 sm:min-w-2xs" />
          <div className="skeleton w-70 h-10 mt-2 max-w-full md:hidden" />
          <div className="flex flex-col gap-5 mt-5 md:flex-row">
            <div className="skeleton hidden w-29 h-42 md:block" />
            <div className="flex h-12 gap-3 max-w-md md:hidden">
              <div className="skeleton flex-1 h-full" />
              <div className="skeleton flex-1 h-full" />
              <div className="skeleton flex-1 h-full" />
            </div>
            <div className="grow">
              <div className="skeleton flex-1 h-4 w-8/10 md:w-2/3" />
              <div className="skeleton flex-1 h-4 w-9/10 mt-2 md:w-3/4" />
              <div className="skeleton hidden flex-1 h-4 mt-2 w-1/3 md:block" />
              <div className="skeleton hidden flex-1 h-4 mt-2 w-3/5 md:block" />
              <div className="skeleton flex-1 h-4 mt-5 w-3/5" />
              <div className="skeleton hidden flex-1 h-4 mt-2 w-1/2 md:block" />
            </div>
          </div>
          <div className="flex gap-2 mt-5 w-full max-w-3xl">
            <div className="skeleton flex-35 h-8" />
            <div className="skeleton flex-47 h-8" />
            <div className="skeleton flex-24 h-8" />
            <div className="skeleton hidden flex-44 h-8 xs:block" />
            <div className="skeleton hidden flex-40 h-8 md:block" />
          </div>
          <div className="mt-7 max-w-5xl">
            <div className="flex items-center mb-2 w-3/5">
              <span className="skeleton w-2 h-2 rounded-full ml-2 mr-2" />
              <div className="skeleton grow h-8" />
            </div>
            <div className="flex items-center w-3/4">
              <span className="skeleton w-2 h-2 rounded-full ml-2 mr-2" />
              <div className="skeleton grow h-8" />
            </div>
            <div className="hidden items-center w-2/5 mt-2 [@media(min-height:48rem)]:flex">
              <span className="skeleton w-2 h-2 rounded-full ml-2 mr-2" />
              <div className="skeleton grow h-8" />
            </div>
          </div>
          <div className="mt-7 max-w-5xl">
            <div className="flex items-center mb-2 w-3/5">
              <span className="skeleton w-2 h-2 rounded-full ml-2 mr-2" />
              <div className="skeleton grow h-8" />
            </div>
            <div className="flex items-center w-3/4">
              <span className="skeleton w-2 h-2 rounded-full ml-2 mr-2" />
              <div className="skeleton grow h-8" />
            </div>
            <div className="hidden items-center w-2/5 mt-2 [@media(min-height:51rem)]:flex">
              <span className="skeleton w-2 h-2 rounded-full ml-2 mr-2" />
              <div className="skeleton grow h-8" />
            </div>
          </div>
          <div className="skeleton hidden mt-5 h-4 w-9/10 [@media(min-height:42rem)]:flex" />
        </div>
      }
    >
      <JobPostPageContent params={params} />
    </Suspense>
  )
}
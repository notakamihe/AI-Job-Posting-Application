import { redirect } from "next/navigation";
import { cachedGetAuthUser, getJobApplications } from "@/actions/api/user";
import Link from "next/link";
import { FaBookmark } from "react-icons/fa";
import { FaClipboardUser, FaStar } from "react-icons/fa6";
import ApplicationsTab from "./components/ApplicationsTab";
import ReviewsTab from "./components/ReviewsTab";
import { cache } from "react";
import SavedTab from "./components/SavedTab";
import { AuthenticatedApplicant } from "@/types";
import { Metadata } from "next";

export async function generateMetadata({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}): Promise<Metadata | null> {
  const user = await cachedGetAuthUser();

  if (user) {
    const { tab: tabParam = "" } = await searchParams;
    const tabName = typeof tabParam === "string" ? tabParam : tabParam[0];
    const tabs = user.type === "Applicant" ? ["Saved", "Applications", "Reviews"] : ["Applications"];
    const tab = tabs.find(t => t.toLowerCase() === tabName.toLowerCase());

    if (tab)
      return { title: "Your " + tab };
  }

  return null;
} 

const cachedGetJobApplications = cache(getJobApplications);

export default async function ActivityPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const user = await cachedGetAuthUser();

  if (!user)
    redirect("/login");

  if (user.roles.includes("Admin"))
    redirect("/discover");

  const { tab: tabParam = "" } = await searchParams;
  const tab = typeof tabParam === "string" ? tabParam : tabParam[0];
  const tabs = user.type === "Applicant" ? ["Saved", "Applications", "Reviews"] : ["Applications"];
  
  if (!tabs.some(t => t.toLowerCase() === tab.toLowerCase()))
    redirect(`/activity?tab=${tabs[0].toLowerCase()}`);

  const applications = await cachedGetJobApplications(user.id);
  
  return (
    <div className="grow flex flex-col px-5 pb-5 md:px-10 md:pb-7">
      <div className="sticky top-0 bg-base-100 z-10 pt-5 pb-5 md:pt-7">
        <h1 className="text-2xl font-bold mb-3">Activity</h1>
        <div className={`tabs tabs-border mx-auto gap-x-3 w-fit max-w-sm xs:m-0 2xs:gap-x-5`} role="tablist">
          {tabs.map(name => (
            <Link 
              className={`tab capitalize text-base gap-x-2 text-primary px-0 outline-0! hover:text-primary active:text-primary focus:text-primary! before:w-full! before:left-px! ${tab.toLowerCase() === name.toLowerCase() ? "tab-active font-bold" : ""}`} 
              href={`/activity?tab=${name.toLowerCase()}`} 
              key={name}
              role="tab"
            >
              {name === "saved" && <FaBookmark />}
              {name === "applications" && <FaClipboardUser />}
              {name === "reviews" && <FaStar />}
              {name}
            </Link>
          ))}
        </div>
      </div>
      {tabs.map(name => (
        <div className={`grow flex-col gap-5 ${tab.toLowerCase() === name.toLowerCase() ? "flex" : "hidden"}`} key={name}>
          {name === "Saved" && <SavedTab user={user as AuthenticatedApplicant} />}
          {name === "Applications" && <ApplicationsTab applicationsData={applications} user={user} />}
          {name === "Reviews" && <ReviewsTab user={user as AuthenticatedApplicant} />}
        </div>
      ))}
    </div>
  );
}
import { AuthenticatedUser, JobApplication } from "@/types";
import { getPayRangeString } from "@/utils/utils";
import Link from "next/link";
import React, { useState, useRef, useEffect, useMemo, Fragment } from "react";
import { FaAngleDown } from "react-icons/fa";
import { FaMessage } from "react-icons/fa6";
import JobPostCard from "./JobPostCard";
import { useRouter } from "next/navigation";
import { getChats } from "@/actions/api/chat";
import ReadyToWork from "./icons/ReadyToWork";

interface JobApplicationCardProps {
  application: JobApplication;
  brief?: boolean;
  className?: string;
  link?: boolean;
  showJobPost?: boolean;
  size?: "sm" | "md"
  user: AuthenticatedUser;
}

export default function JobApplicationCard({ 
  application, 
  brief, 
  className, 
  link,
  showJobPost, 
  size, 
  user 
}: JobApplicationCardProps) {
  const router = useRouter();

  const [expanded, setExpanded] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const isFollowed = useMemo(() => {
    return application.applicant.following.some(followed => followed.id === user.id);
  }, [application.applicant, user]);

  const hash = `applicant-${application.applicant.id}-post-${application.jobPost.id}`;

  useEffect(() => {
    if (window.location.hash === "#" + hash) {
      if (application.jobPost.applicationQuestions.length > 0)
        setExpanded(true);

      window.location.href = window.location.href;
    }
  }, [])

  function redirectToChat(e: React.MouseEvent) {
    if (!isPending) {
      setIsPending(true);
      getChats([application.applicant.id])
        .then(result => {
          const chat = result.find(chat => chat.users.length === 2);
          
          if (chat)
            router.push(`/chat/${chat.id}`);
          else
            router.push(`/chat/new?withUser=${application.applicant.id}`);
          
          setIsPending(false);
        });
    }
  }

  return (
    <div className={`relative border border-base-content/20 rounded ${brief ? (size === "sm" ? "px-3 py-2" : "px-4 py-3") : ""} ${className ?? ""}`} ref={ref}>
      <div className="absolute -top-35 left-0" id={hash} />
      {link && <Link className="absolute inset-0" href={`/activity?tab=applications#${hash}`} />}
      <div className={!brief ? (size === "sm" ? "px-3 py-2" : "px-4 py-3") : ""}>
        {!brief && (
          <div className="flex items-center shrink-0 mb-px md:hidden">
            <div className="badge badge-success badge-soft badge-sm gap-1.5 h-auto px-1.5 mr-2">
              <ReadyToWork className="text-sm" />
              <span>Ready To Work</span>
            </div>
            {isFollowed && (
              <div className="badge badge-sm text-current/50 border border-current/50 leading-1 px-1.5 bg-transparent">
                Follows you
              </div>
            )}
          </div>
        )}
        <div className="flex justify-between items-center gap-5">
          <div>
            <Link 
              className={`relative leading-tight ${size === "sm" ? "text-base" : "text-base md:text-lg"} font-medium hover:text-primary`} 
              href={`/profile/${application.applicant.id}`}
            >
              {application.applicant.firstName} {application.applicant.middleName} {application.applicant.lastName}
            </Link>
            <p className={`leading-none text-base-content/75 ${size === "sm" ? "text-sm" : "text-[0.9375rem] md:text-base"}`}>
              {application.applicant.preferredOccupation}
            </p>
          </div>
          <div className="flex justify-end items-center flex-wrap gap-3">
            {!brief && (
              <div className="hidden items-center shrink-0 md:flex">
                <div className="badge badge-success badge-soft gap-1.5 h-auto px-1.5 mr-2 py-px">
                  <ReadyToWork className="text-base" />Ready To Work
                </div>
                {isFollowed && (
                  <div className="badge text-current/50 border border-current/50 leading-1 px-1.5 bg-transparent">
                    Follows you
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              {user.type === "Employer" && (
                <button className="btn btn-sm btn-circle relative" onClick={redirectToChat}>
                  {isPending ? <span className="loading loading-ring" /> : <FaMessage />}
                </button>
              )}
              {!brief && application.jobPost.applicationQuestions.length > 0 && (
                <button className="btn btn-sm btn-circle" onClick={() => setExpanded(!expanded)}>
                  <FaAngleDown className={expanded ? "rotate-180" : ""} />
                </button>
              )}
            </div>
          </div>
        </div>
        {showJobPost && (
          <>
            <p className={`${size === "sm" ? "mt-1 mb-2" : "mt-2 mb-3"} font-bold text-primary text-sm`}>applied to</p>
            {brief ? (
              <Link 
                className={`border border-base-content/20 relative ${size === "sm" ? "px-3 py-1.5" : "p-3"} rounded-md block hover:border-primary hover:bg-primary/10 hover:text-primary active:bg-primary/10 active:text-primary`} 
                href={`post/${application.jobPost.id}`}
              >
                <h2 className={`${size === "sm" ? "text-base/6" : "text-lg/6"} font-medium`}>
                  {application.jobPost.title}
                </h2>
                <p className={`opacity-75 ${size === "sm" ? "text-sm" : ""}`}>
                   {[
                    application.jobPost.payLowEnd !== null || application.jobPost.payHighEnd !== null
                      ? `${getPayRangeString(application.jobPost.payLowEnd, application.jobPost.payHighEnd)}/hr`
                      : "",
                    application.jobPost.medium,
                    application.jobPost.employmentType
                  ].filter(item => item).map((item, i) => (
                    <Fragment key={i}>
                      {i > 0 && <span className="mx-1.5">&bull;</span>}
                      <span>{item}</span>
                    </Fragment>
                  ))}
                </p>
              </Link>
            ) : (
              <JobPostCard brief className="p-3! md:p-4!" post={application.jobPost} user={user} />
            )}
          </>
        )}
      </div>
      {!brief && expanded && (
        <div className="border-t border-t-base-content/20 py-2.5 px-1 md:py-4">
          <div className="max-h-100 overflow-auto scrollbar-thin px-1.5 md:px-3">
            {application.jobPost.applicationQuestions.map((question, idx) => {
              const answer = application.answers.find(answer => answer.question.id === question.id);

              return (
                <div className="mb-3" key={idx}>
                  <div>
                    <span className="text-[0.9375rem] leading-tight py-2 px-3 text-base-content/75 border border-base-content/20 mr-5 rounded inline-block">
                      {question.question}
                    </span>
                  </div>
                  <div className="text-right mt-2 ml-10">
                    {answer && answer.answer ? (
                      <span className="bg-primary/15 text-primary px-3 py-1 rounded inline-block font-medium">
                        {answer.answer}
                      </span>
                    ) : (
                      <span className="border border-dashed opacity-40 px-3 py-1 rounded">Unanswered</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
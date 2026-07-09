import { Applicant, AuthenticatedUser } from "@/types";
import Link from "next/link";
import Highlightable from "./Highlightable";
import { useMemo } from "react";
import { FaLocationDot } from "react-icons/fa6";
import ReadyToWork from "./icons/ReadyToWork";

interface ApplicantCardProps {
  applicant: Applicant;
  className?: string;
  highlight?: string | null;
  linkNewTab?: boolean;
  size?: "sm" | "md";
  user: AuthenticatedUser | null;
}

export default function ApplicantCard({ applicant, className, highlight, linkNewTab, size, user }: ApplicantCardProps) {
  const isFollowed = useMemo(() => applicant.following.some(followed => followed.id === user?.id), [user, applicant])

  return (
    <Link 
      className={`block border border-base-content/20 rounded p-3 group hover:text-primary active:text-primary hover:bg-primary/10 hover:border-primary active:bg-primary/10 active:border-primary pointer-events-auto ${className}`}
      href={`/profile/${applicant.id}`}  
      target={linkNewTab ? "_blank" : ""}
    >
      <div className="flex gap-2">
        {applicant.readyToWork && (
          <div className={`badge badge-success badge-soft h-auto px-1.5 ${size === "sm" ? "badge-sm mb-0.5 gap-1" : "mb-1 gap-1.25"}`}>
            <ReadyToWork className={`translate-y-px ${size === "sm" ? "text-sm" : "text-base"}`} />
            <span className="mt-px">Ready To Work</span>
          </div>
        )}
        {isFollowed && (
          <div className={`badge text-current/60 border border-current/50 leading-1 px-1.5 bg-transparent ${size === "sm" ? "badge-sm mb-0.5" : "mb-1"}`}>
            Follows you
          </div>
        )}
      </div>
      <div>  
        <p className={`${size == "sm" ? "text-base/4" : "text-lg/4"} font-medium mt-1 mb-0.5`}>
          <Highlightable 
            text={`${applicant.firstName} ${applicant.middleName ?? ""} ${applicant.lastName}`} 
            highlight={highlight} 
          /> 
        </p>
        <div className={`flex items-center flex-wrap text-current/75 ${size === "sm" ? "text-[0.9rem]" : "text-base/5"}`}>
          <span className="mr-3 leading-tight mt-px">
            <Highlightable text={applicant.preferredOccupation} highlight={highlight} />
          </span>
          {applicant.location && (
            <span className="leading-tight">
              <FaLocationDot className="inline text-xs mr-1.5" />
              <span className="align-middle">
                <Highlightable text={applicant.location} highlight={highlight} />
              </span> 
            </span>
          )}
        </div>
        {applicant.about && (
          <p className="text-sm line-clamp-3 mt-1.5">
            <Highlightable text={applicant.about} highlight={highlight} /> 
          </p>
        )}
        {applicant.skills.length > 0 && (
          <div className="flex gap-2 items-center w-full overflow-auto scrollbar-none mt-2">
            {applicant.skills.map((skill, idx) => (
              <span 
                className={`bg-primary/15 text-primary font-medium px-2 py-1 rounded whitespace-nowrap ${size === "sm" ? "text-[0.95rem]" : ""}`} 
                key={idx}
              >
                <Highlightable text={skill.name} highlight={highlight} /> 
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
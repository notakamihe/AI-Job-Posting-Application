import { Employer } from "@/types";
import Link from "next/link";
import Rating from "./Rating";
import { FaBriefcase } from "react-icons/fa";
import Highlightable from "./Highlightable";
import { FaLocationDot } from "react-icons/fa6";

interface EmployerCardProps {
  className?: string;
  employer: Employer;
  highlight?: string | null;
  linkNewTab?: boolean;
  showJobCount?: boolean;
  size?: "sm" | "md";
}

export default function EmployerCard({ className, employer, highlight, linkNewTab, showJobCount, size }: EmployerCardProps) {
  return (
    <Link 
      className={`block border border-base-content/20 rounded p-3 relative hover:text-primary active:text-primary hover:bg-primary/10 hover:border-primary active:bg-primary/10 active:border-primary pointer-events-auto ${className} @container`}
      href={`/profile/${employer.id}`}  
      target={linkNewTab ? "_blank" : ""}
    >
      <div className="flex justify-between items-start">
        <div className="leading-none">
          {employer.averageRating && <Rating className="mb-0.5" readOnly size="xs" value={employer.averageRating} />}
          <p className={`${size == "sm" ? "text-base/4" : "text-lg/4"} font-medium mt-1 mb-0.5`}>
            <Highlightable text={employer.name} highlight={highlight} /> 
          </p>
        </div>
        {showJobCount && employer.jobPosts.length > 0 && (
          <div className="inline-flex items-center text-sm px-2 py-1 border border-primary rounded-md font-medium leading-none justify-self-end gap-2">
            <FaBriefcase className="text-primary" />
            <span className="text-primary whitespace-nowrap">
              {employer.jobPosts.length}<span className="hidden @md:inline"> available jobs</span>
            </span>
          </div>
        )}
      </div>
      <div className={`flex items-center flex-wrap text-current/75 ${size === "sm" ? "text-[0.9rem]" : "text-base/5"}`}>
        <span className="mr-3 leading-tight mt-px">
          <Highlightable text={employer.industry} highlight={highlight} />
        </span>
        {employer.location && (
          <span className="leading-tight">
            <FaLocationDot className="inline text-xs mr-1.5" />
            <span className="align-middle">
              <Highlightable text={employer.location} highlight={highlight} />
            </span> 
          </span>
        )}
      </div>
      {employer.about && (
        <p className="text-sm line-clamp-3 mt-1">
          <Highlightable text={employer.about} highlight={highlight} />
        </p>
      )}
    </Link>
  );
}
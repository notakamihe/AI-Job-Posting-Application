"use client"

import { deleteJobPost } from "@/actions/api/jobPost";
import { saveJobPost, unsaveJobPost } from "@/actions/api/user";
import { AuthenticatedUser, JobPost } from "@/types"
import { getPayRangeString, timeAgo } from "@/utils/utils";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { FaAngleDown, FaAngleUp, FaBookmark, FaClockRotateLeft, FaPencil, FaTrash } from "react-icons/fa6";
import { MdBookmarkRemove } from "react-icons/md";
import Highlightable from "./Highlightable";

interface JobPostCardProps {
  brief?: boolean;
  className?: string;
  highlight?: string | null;
  linkNewTab?: boolean;
  onDelete?: () => void;
  onToggleSave?: (isSaved: boolean) => void;
  post: JobPost;
  showActions?: boolean;
  size?: "sm" | "md";
  user: AuthenticatedUser | null;
}

export default function JobPostCard({ 
  brief, 
  className, 
  highlight,
  linkNewTab,
  onDelete,
  onToggleSave,
  post, 
  showActions, 
  size, 
  user 
}: JobPostCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [isSaved, setIsSaved] = useState(user?.type === "Applicant" && user.saved.some(saved => saved.id === post.id));
  const [showMore, setShowMore] = useState(false);

  const isAdmin = !!user && user.roles.includes("Admin");
  const isAuthorized = !!user && (isAdmin || user.id === post.employer.id);

  const postedAt = useMemo(() => new Date(post.postedAt), [post.postedAt]);

  useEffect(() => {
    setIsSaved(user?.type === "Applicant" && user.saved.some(saved => saved.id === post.id));
  }, [user, post])

  function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.blur();

    if (!isPending) {
      setIsPending(true);
      deleteJobPost(post.id)
        .then(() => {
          onDelete?.();
          setIsPending(false);
        });
    }
  }

  function handleToggleSave() {
    if (!isPending && user?.type === "Applicant") {
      setIsPending(true);

      if (isSaved) {
        unsaveJobPost(user.id, post.id)
          .then(result => {
            if (result.success) {
              setIsSaved(false);
              onToggleSave?.(false);
            }
  
            setIsPending(false);
          });
      } else {
        saveJobPost(user.id, post.id)
          .then(result => {
            if (result.success) {
              setIsSaved(true);
              onToggleSave?.(true);
            }

            setIsPending(false);
          });
      }
    }
  }

  return (
    <div className={`w-full relative p-4 border border-base-content/20 rounded-xl flex flex-col cursor-pointer hover:text-primary hover:bg-primary/10 hover:border-primary active:text-primary active:bg-primary/10 active:border-primary ${className}`}>
      <Link className="absolute inset-0" href={`/post/${post.id}`} target={linkNewTab ? "_blank" : ""} />
      <div className="flex gap-1">
        <div className="grow">
          <p className="flex items-center relative">
            {post.employer && post.employer.id !== user?.id && (
              <Link 
                className={`mr-3 link link-primary font-bold ${size === "sm" ? "text-sm" : ""} leading-none`}
                href={`/profile/${post.employer.id}`}
                target={linkNewTab ? "_blank" : ""}
              >
                <Highlightable text={post.employer.name} highlight={highlight} />
              </Link>
            )}
            <span 
              className={`inline-flex items-center leading-none opacity-60 group-hover/card:text-primary ${size === "sm" ? "text-xs" : "text-sm"} shrink-0`}
              title={postedAt.toDateString() + " " + postedAt.toLocaleTimeString()}
            >
              <FaClockRotateLeft className="mr-1.5 text-xs" />{timeAgo(postedAt)}
            </span>
          </p>
          <h2 className={`${size === "sm" ? "text-base my-1" : "text-lg my-1.5"} font-medium leading-none`}>
            <Highlightable text={post.title} highlight={highlight} />
          </h2>
          <p className={`opacity-75 pointer-events-none leading-none ${size === "sm" ? "text-[0.95rem]" : ""}`}>
            {[
              post.payLowEnd !== null || post.payHighEnd !== null
                ? `${getPayRangeString(post.payLowEnd, post.payHighEnd)}/hour`
                : "",
              post.medium,
              post.employmentType
            ].filter(item => item).map((item, i) => (
              <Fragment key={i}>
                {i > 0 && <span className="mx-2">&bull;</span>}
                <span>{item}</span>
              </Fragment>
            ))}
          </p>
        </div>
        {!brief && (
          <div className="flex items-center h-fit relative" onClick={e => e.preventDefault()}>
            <div>
              <div className="mb-1">
                <button className="btn btn-sm btn-circle" onClick={() => setShowMore(!showMore)}>
                  {showMore ? <FaAngleUp /> : <FaAngleDown />}
                </button>
              </div>
              {user?.type === "Applicant" && (
                <div className="mb-1">
                  <button className={`btn btn-sm btn-circle ${isSaved ? "btn-neutral" : ""}`} onClick={handleToggleSave}>
                    {
                      isPending 
                        ? <span className="loading loading-ring" /> 
                        : (isSaved ? <MdBookmarkRemove className="text-lg" /> : <FaBookmark />)
                    }
                  </button>
                </div>
              )}
            </div>
            {showActions && isAuthorized && (
              <div>
                <div>
                  <Link className="btn btn-sm btn-circle mb-1 relative" href={`/post/${post.id}/edit`}>
                    <FaPencil />
                  </Link>
                </div>
                <div className="dropdown dropdown-bottom dropdown-end">
                  <button className="btn btn-sm btn-circle">
                    {isPending ? <span className="loading loading-ring" /> : <FaTrash />}
                  </button>
                  <div tabIndex={0} className="dropdown-content menu bg-base-100 rounded z-1 w-36 p-3 shadow-sm">
                    <p className="mb-2 text-center text-base-content">Confirm deletion?</p>
                    <div className="flex">
                      <button className="btn btn-error btn-sm mr-2 flex-1" onClick={handleDelete}>
                        Yes
                      </button>
                      <button className="btn btn-sm flex-1" onClick={e => e.currentTarget.blur()}>
                        No
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {!brief && (
        <Link className="relative grow max-h-96 overflow-auto mt-1" href={`/post/${post.id}`}>
          <p className={`relative mb-2 ${!showMore ? "line-clamp-5" : ""} ${size == "sm" ? "text-sm" : "text-[0.95rem]"}`}>
            <Highlightable text={post.summary} highlight={highlight} />
          </p>
          {showMore && (
            <div className="mb-2">
              <p className={`leading-tight opacity-75 ${size === "sm" ? "text-sm" : "text-[0.9rem]"}`}>Schedule</p>
              <p className={size == "sm" ? "text-sm" : "text-[0.95rem]"}>
                <Highlightable text={post.schedule} highlight={highlight} />
              </p>
            </div>
          )}
          {showMore && (
            <div>
              {post.qualifications.length > 0 && (
                <div className="mb-2">
                  <p className={`font-bold ${size === "sm" ? "text-sm" : ""}`}>Qualifications</p>
                  <ul className="list-disc pl-5">
                    {post.qualifications.map((qualification, idx) => (
                      <li className="text-sm" key={idx}>
                        <Highlightable text={qualification.description} highlight={highlight} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {post.responsibilities.length > 0 && (
                <div className="mb-2">
                  <p className={`font-bold ${size === "sm" ? "text-sm" : ""}`}>Responsibilities</p>
                  <ul className="list-disc pl-5">
                    {post.responsibilities.map((responsiblity, idx) => (
                      <li className="text-sm" key={idx}>
                        <Highlightable text={responsiblity.description} highlight={highlight} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {post.additionalDetails && (
                <p className="italic text-sm text-current/75">
                  <Highlightable text={post.additionalDetails} highlight={highlight} />
                </p>
              )}
            </div>
          )}
        </Link>
      )}
      {post.skillsWanted.length > 0 && (
        <Link className="w-full overflow-x-auto scrollbar-none relative mt-2" href={`/post/${post.id}`}>
          <p className="flex gap-2 items-center">
            {post.skillsWanted.map((skill, idx) => (
              <span 
                className={`bg-primary/15 text-primary font-medium px-2 py-1 rounded inline-block shrink-0 ${size === "sm" ? "text-[0.95rem]" : ""}`} 
                key={idx}
              >
                <Highlightable text={skill.name} highlight={highlight} />
              </span>
            ))}
          </p>
        </Link>
      )}
    </div>
  )
}
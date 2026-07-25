"use client"

import JobPostCard from "@/components/JobPostCard";
import { Applicant, AuthenticatedUser, Chat, Employer, Review } from "@/types";
import { trimLink } from "@/utils/utils";
import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { FaGlobe, FaStoreAlt, FaUserMinus, FaUserPlus, FaUsers } from "react-icons/fa";
import { FaCirclePlus, FaMessage, FaPencil, FaPlus, FaTrash, FaXmark } from "react-icons/fa6";
import { MdOutlinePostAdd } from "react-icons/md";
import ReviewCard from "@/components/ReviewCard";
import { deleteUser, followEmployer, unfollowEmployer } from "@/actions/api/user";
import Rating from "@/components/Rating";
import ReviewForm from "@/components/ReviewForm";
import ApplicantCard from "@/components/ApplicantCard";
import { useRouter } from "next/navigation";

interface EmployerProfileProps {
  chat: Chat | undefined;
  employer: Employer;
  followers: { results: Applicant[]; totalCount: number; };
  reviews: { results: Review[]; totalCount: number; };
  user: AuthenticatedUser | null;
}

export default function EmployerProfile({ 
  chat,
  employer, 
  followers: followersData, 
  reviews: reviewsData, 
  user 
}: EmployerProfileProps) {
  const router = useRouter();

  const [averageRating, setAverageRating] = useState(employer.averageRating);
  const [followers, setFollowers] = useState(followersData);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [posts, setPosts] = useState(employer.jobPosts);
  const [reviews, setReviews] = useState(reviewsData);
  const [showCreateReviewForm, setShowCreateReviewForm] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);

  const reviewsContainerRef = useRef<HTMLDivElement>(null);

  const isAdmin = !!user && user.roles.includes("Admin");
  const isAuthorized = !!user && (isAdmin || user.id === employer.id);

  const isFollowed = useMemo(() => followers.results.some(follower => follower.id === user?.id), [followers, user]);

  useEffect(() => {
    router.refresh();
  }, [])

  useEffect(() => {
    setAverageRating(employer.averageRating);
    setReviews(reviewsData);
    setFollowers(followersData);
  }, [employer, followersData, reviewsData])

  function addReview(review: Review) {
    setShowCreateReviewForm(false);   
    
    if (averageRating === null) {
      setAverageRating(review.rating);
    } else {
      const sum = averageRating * reviews.totalCount;
      setAverageRating((sum + review.rating) / (reviews.totalCount + 1));
    }

    setReviews({ results: [review, ...reviews.results], totalCount: reviews.totalCount + 1 });
  }

  function deleteEmployer() {
    if (!isDeletePending) {
      setIsDeletePending(true);
      deleteUser(employer.id);
    }
  }
  
  function follow() {
    if (user?.type === "Applicant" && !isPending) {
      setIsPending(true);
      followEmployer(user.id, employer.id)
        .then(() => {
          setFollowers({ results: [...followers.results, user], totalCount: followers.totalCount + 1 });
          setIsPending(false);
        })
    }
  }

  function getSizeRangeString(lowEnd: number | null, highEnd: number | null) {
    if (lowEnd === null && highEnd !== null)
      return `< ${highEnd + 1}`;
    else if (lowEnd !== null && highEnd === null)
      return `${lowEnd}+`;
    else if (lowEnd === highEnd && lowEnd !== null)
      return lowEnd.toString();
    else
      return `${lowEnd}-${highEnd}`;
  }

  function removeReview(review: Review) {
    if (averageRating !== null) {
      const sum = averageRating * reviews.totalCount;
      setAverageRating((sum - review.rating) / (reviews.totalCount - 1));
    }
    
    setReviews({ results: reviews.results.filter(r => r.id !== review.id), totalCount: reviews.totalCount - 1 });
  }

  function unfollow() {
    if (user && user.type === "Applicant" && !isPending) {
      setIsPending(true);
      unfollowEmployer(user.id, employer.id)
        .then(() => {
          setFollowers({ 
            results: followers.results.filter(follower => follower.id !== user.id),
            totalCount: followers.totalCount - 1
          });
          setIsPending(false);
        })
    }
  }

  function updateReview(idx: number, review: Review) {
    const newReviews = reviews.results.slice();

    if (averageRating !== null) {
      const sum = averageRating * reviews.totalCount - newReviews[idx].rating + review.rating;
      setAverageRating(sum / reviews.totalCount);
    }

    newReviews[idx] = review;
    setReviews({ ...reviews, results: newReviews });
  }

  return (
    <div className="flex">
      <div className={`@container/main min-w-0 relative flex-2 ${showFollowers && followers.results.length > 0 ? "hidden" : "block"} md:block`}>
        <div className="p-5 @3xl/main:p-10 max-w-7xl mx-auto">
          <div className="mb-4">
            <div className="badge badge-outline badge-primary text-[0.9375rem] font-medium leading-tight mb-1 px-2 gap-1.75">
              <FaStoreAlt />Employer
            </div>
            <h1 className="font-black text-4xl mb-1 @3xl/main:text-6xl">{employer.name}</h1>
            <div className="mb-1">
              {employer.website && (
                <a 
                  className="px-2 text-sm font-medium bg-blue-500/15 text-blue-500 rounded-xl mr-3 inline-flex items-center"
                  href={employer.website}
                  target="_blank"
                >
                  <FaGlobe className="text-blue-500 text-xs inline-flex mr-1.5 shrink-0" />
                  <span className="line-clamp-1">{trimLink(employer.website)}</span>
                </a>
              )}
            </div>
            <p className="text-base-content/60 font-medium leading-snug">
              {employer.industry && <span className="mr-2">{employer.industry}</span>}
              {employer.location && (
                <>
                  {employer.industry && <span className="mr-2">&bull;</span>}
                  <span className="mr-2">{employer.location}</span>
                </>
              )}
              {(employer.sizeRangeLowEnd || employer.sizeRangeHighEnd) && (
                <>
                  {(employer.industry || employer.location) && <span className="mr-2">&bull;</span>}
                  <span>
                    {getSizeRangeString(employer.sizeRangeLowEnd, employer.sizeRangeHighEnd)} employees
                  </span>
                </>
              )}
            </p>
            <div className="flex items-start mt-2 gap-4 gap-y-2 flex-wrap">
              <div 
                className={`text-center ${followers.results.length > 0 ? "group cursor-pointer hover:text-primary" : ""}`}
                onClick={() => setShowFollowers(!showFollowers)}
              >
                <p className="flex items-center text-base-content/60 group-hover:text-primary">
                  <FaUsers className="mr-2" />
                  <span className="font-normal text-sm leading-none">Followers</span>
                </p>
                <p className="font-bold text-lg">{followers.totalCount}</p> 
              </div>
              {user?.type === "Applicant" && (
                <>
                  <div className="join">
                    <button 
                      className={`btn join-item btn-primary w-26 ${isFollowed ? "pointer-events-none" : "btn-outline"}`} 
                      onClick={follow}
                    >
                      {
                        isPending && !isFollowed
                          ? <span className="loading loading-ring" /> 
                          : isFollowed ? "Following" : <><FaUserPlus />Follow</>
                      }
                    </button>
                    {isFollowed && (
                      <button className="btn join-item cursor-pointer w-8 p-0" onClick={unfollow}>
                        {isPending ? <span className="loading loading-ring loading-xs" /> : <FaUserMinus />}
                      </button>
                    )}
                  </div>
                  <span className="w-px h-10 bg-base-content/20" />
                  <Link className="btn btn-neutral w-29" href={`/chat/${chat?.id ?? `new?withUser=${employer.id}`}`}>
                    <FaMessage />Message
                  </Link>
                </>
              )}
              {isAuthorized && (
                <>
                  <span className="w-px h-10 bg-base-content/20" />
                  <Link 
                    className="btn btn-outline btn-primary ml-1"
                    href={`/profile/${isAdmin ? employer.id + "/" : ""}edit`}
                  >
                    <FaPencil />Edit
                  </Link>
                  {isAdmin && (
                    <div className="dropdown dropdown-bottom dropdown-end ml-1">
                      <div className="btn btn-outline btn-error -mb-px w-26" role="button" tabIndex={0}>
                        {isDeletePending ? <span className="loading loading-ring" /> : <><FaTrash />Delete</>} 
                      </div>
                      {!isDeletePending && (
                        <div 
                          className="dropdown-content menu rounded z-1 w-36 p-3 shadow-sm bg-base-100 dark:bg-base-200 mt-1.5"
                          tabIndex={0} 
                        >
                          <p className="mb-2 font-medium text-center">Confirm?</p>
                          <div className="flex">
                            <button className="btn btn-error btn-sm mr-3 flex-1" onClick={deleteEmployer}>
                              Yes
                            </button>
                            <button className="btn btn-sm flex-1" onClick={e => e.currentTarget.blur()}>
                              No
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <p className="mb-7">{employer.about}</p>
          <div className="mb-7">
            {(employer.id === user?.id || employer.jobPosts.length > 0) && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Posts</h2>
                  {employer.id === user?.id && (
                    <Link className="btn btn-primary btn-circle btn-outline md:hidden" href="/post/create">
                      <MdOutlinePostAdd className="text-xl" />
                    </Link>
                  )}
                </div>
                <div className="flex gap-5 mt-5">
                  {employer.id === user?.id && (
                    <Link 
                      className="hidden justify-center items-center flex-col shrink-0 p-4 gap-3 btn btn-primary btn-outline h-auto md:flex"
                      href="/post/create"
                    >
                      <MdOutlinePostAdd className="text-3xl" />
                    </Link>
                  )}
                  <div className="grow flex overflow-x-auto gap-5 snap-x snap-proximity @xl/main:snap-none">
                    {posts.map(post => (
                      <div className="w-full shrink-0 h-auto snap-center @xl/main:w-1/2 @xl/main:min-w-sm" key={post.id}>
                        <JobPostCard 
                          onDelete={() => setPosts(posts.filter(p => p !== post))} 
                          post={{ ...post, employer }} 
                          showActions 
                          user={user} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          {(reviews.totalCount > 0 || user?.type === "Applicant") && (
            <div>
              <div className="flex items-center gap-5">
                <div className="grow">
                  <h2 className="text-2xl/6 font-bold">Reviews</h2>
                  <p className="text-base-content/60 text-lg">
                    {reviews.totalCount} review{reviews.totalCount !== 1 ? "s" : ""}
                  </p>
                </div>
                {averageRating && (
                  <div className="rounded text-lg text-right mb-1 @2xl/main:hidden">
                    <p className="text-right font-bold leading-none pr-1">{averageRating.toFixed(1)}</p>
                    <Rating readOnly size="sm" value={averageRating} />
                  </div>
                )}
                {user?.type === "Applicant" && (
                  <button 
                    className={`btn btn-sm btn-circle mb-1 ${!showCreateReviewForm ? "btn-primary btn-outline" : ""} @2xl/main:hidden`} 
                    onClick={() => setShowCreateReviewForm(!showCreateReviewForm)}
                  >
                    {showCreateReviewForm ? <FaXmark className="text-base" /> : <FaPlus className="text-base" />}
                  </button>
                )}
              </div>
              <div className="flex mt-5">
                <div className={`hidden flex-col gap-3 mr-5 ${user && user.id !== employer.id ? "h-62" : ""} @2xl/main:flex`}>
                  {averageRating && (
                    <div className="flex-1 rounded flex flex-col justify-center gap-2">
                      <p className="text-center text-xl font-bold">{averageRating.toFixed(1)}</p>
                      <Rating readOnly value={averageRating} />
                    </div>
                  )}
                  {user?.type === "Applicant" && (
                    <button 
                      className={`flex-1 btn w-full ${showCreateReviewForm ? "btn-primary" : "border-primary bg-transparent text-primary"}`}
                      onClick={() => setShowCreateReviewForm(!showCreateReviewForm)}
                    >
                      <FaPlus className="text-2xl" />
                    </button>
                  )}
                </div>
                <div className="flex gap-3 w-full overflow-hidden">
                  {user?.type === "Applicant" && showCreateReviewForm && (
                    <div className="flex-1 h-64 shrink-0 bg-base-100 z-10 @2xl/main:min-w-xs">
                      <ReviewForm
                        employer={employer} 
                        onCancel={() => setShowCreateReviewForm(false)}
                        onSave={review => addReview(review)}
                      />
                    </div>
                  )}
                  <div 
                    className={`flex-2 overflow-auto gap-3 snap-x snap-proximity ${showCreateReviewForm ? "hidden" : "flex"} @2xl/main:flex @2xl/main:snap-none`} 
                    ref={reviewsContainerRef}
                  >
                    {reviews.results.map((review, idx) => (
                      <div 
                        className={`shrink-0 w-full min-w-xs h-64 snap-center ${showCreateReviewForm ? "hidden" : ""} @2xl/main:block ${showCreateReviewForm ? "@2xl/main:w-[calc(50%-6px)]" : "@2xl/main:w-[calc(33.333%-6px)]"}`} 
                        key={review.id}
                      >
                        <ReviewCard 
                          onDelete={() => removeReview(review)}
                          onUpdate={updated => updateReview(idx, updated)}
                          review={review} 
                          user={user}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showFollowers && followers.results.length > 0 && (
        <aside className="flex flex-col w-full shrink-0 min-w-76 md:flex-1 md:border-x md:border-x-base-content/20">
          <div className="flex justify-between items-center p-3 bg-base-100 border-b border-b-base-content/20">
            <h3 className="font-bold text-center ml-2 text-lg">
              <span className="h-fit text-primary">{followers.totalCount}</span> Followers
            </h3>
            <button className="btn btn-sm btn-circle" onClick={() => setShowFollowers(false)}>
              <FaXmark className="text-base" />
            </button>
          </div>
          <div className="flex flex-col gap-3 px-4 my-5 grow overflow-auto scrollbar-thin gutter-stable pointer-fine:pr-0.75 pointer-fine:mr-0.75">
            {followers.results.map((follower, idx) => (
              <ApplicantCard applicant={follower} key={idx} linkNewTab size="sm" user={user} />
            ))}
          </div>
        </aside>
      )}
    </div>
  )
}
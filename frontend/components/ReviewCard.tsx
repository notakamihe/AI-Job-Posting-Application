import { deleteReview } from "@/actions/api/review";
import Rating from "@/components/Rating";
import { AuthenticatedUser, Review } from "@/types";
import Link from "next/link";
import React, { useRef, useState } from "react"
import { FaTrash } from "react-icons/fa";
import { FaPencil, FaStar } from "react-icons/fa6";
import ReviewForm from "./ReviewForm";

interface ReviewCardProps { 
  onDelete: () => void;
  onUpdate: (review: Review) => void; 
  review: Review;
  showEmployer?: boolean;
  showReviewer?: boolean;
  user: AuthenticatedUser | null;
}

export default function ReviewCard({ 
  onDelete,
  onUpdate, 
  review, 
  showEmployer, 
  showReviewer,
  user
}: ReviewCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const isAdmin = !!user && user.roles.includes("Admin");
  const isAuthorized = !!user && (isAdmin || user.id === review.reviewer.id);

  function handleDelete() {
    setIsPending(true);
    deleteReview(review.id)
      .then(result => {
        setIsPending(false);

        if (result.success)
          onDelete?.();
      });
  }

  return showForm ? (
    <ReviewForm 
      employer={review.employer} 
      onCancel={() => setShowForm(!showForm)} 
      onSave={updated => onUpdate(updated)} 
      review={review}
    />
  ) : (
    <div 
      className="h-full relative border rounded border-base-content/20 p-3 shrink-0 flex flex-col overflow-hidden" 
      ref={ref}
    >
      {isAuthorized && (
        <div className="absolute top-2.5 right-2.5">
          <button className="btn btn-sm btn-circle mr-2" onClick={() => setShowForm(isPending ? showForm : !showForm)}>
            <FaPencil />
          </button>
          {isPending ? (
            <span className="loading loading-ring loading-lg text-primary" />
          ) : (
            <button className="btn btn-sm btn-circle" onClick={handleDelete}>
              <FaTrash />
            </button>
          )}
        </div>
      )}
      <div className="mb-1">
        <Rating className="mb-2" readOnly value={review.rating} />
        <p className="text-lg/5 font-bold line-clamp-3">{review.title}</p>
        {showReviewer !== false && (
          <Link 
            className="mb-2 font-medium text-base-content/75 hover:text-primary" 
            href={`/profile/${review.reviewer.id}`}
          >
            {
              user?.id === review.reviewer.id
                ? "You"
                : `${review.reviewer.firstName} ${review.reviewer.middleName ?? ""} ${review.reviewer.lastName}`
            }
          </Link>
        )}
      </div>
      <div className="text-sm italic grow overflow-auto">
        <p>{review.description}</p>
      </div>
      {showEmployer && (
        <Link 
          className="flex justify-between border border-base-content/20 rounded p-3 gap-3 overflow-hidden hover:bg-primary/10 active:bg-primary/10 hover:border-primary active:border-primary hover:text-primary active:text-primary mt-3" 
          href={`/profile/${review.employer.id}`}
        >
          <div>
            <p className="font-medium text-lg/5 mb-1">{review.employer.name}</p>
            <div className="flex flex-wrap opacity-75 leading-4 gap-y-1">
              <p>
                <span>{review.employer.industry && `${review.employer.industry} employer`}</span> 
                {review.employer.industry && review.employer.location && <span className="mx-2">&bull;</span>}
              </p>
              <p>{review.employer.location}</p>
            </div>
          </div>
          {review.employer.averageRating && (
            <p className="flex items-center opacity-60 bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded-xl self-center">
              <FaStar className="mr-1.5" />
              <span className="translate-y-[0.5px]">{review.employer.averageRating.toFixed(1)}</span>
            </p>
          )}
        </Link>
      )}
    </div>
  )
}
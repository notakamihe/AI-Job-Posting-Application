"use client"

import ReviewCard from "@/components/ReviewCard";
import { AuthenticatedApplicant } from "@/types";
import { useEffect, useState } from "react";

export default function ReviewsTab({ user }: { user: AuthenticatedApplicant }) {
  const [reviews, setReviews] = useState(user.reviews);

  useEffect(() => {
    setReviews(user.reviews);
  }, [user])

  return reviews.map((review, idx) => (
    <div className="max-w-4xl" key={idx}>
      <ReviewCard 
        onDelete={() => setReviews(reviews.filter(r => r !== review))}
        onUpdate={updated => setReviews(reviews.map(r => r === review ? updated : r))}
        review={{ ...review, reviewer: user }} 
        showEmployer
        showReviewer={false}
        user={user}
      />
    </div>
  ));
}
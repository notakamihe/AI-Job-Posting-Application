"use client"

import JobPostCard from "@/components/JobPostCard";
import { AuthenticatedApplicant } from "@/types";
import { useEffect, useState } from "react";

export default function SavedTab({ user }: { user: AuthenticatedApplicant }) {
  const [saved, setSaved] = useState(user.saved);

  useEffect(() => {
    setSaved(user.saved);
  }, [user])

  return saved.map(post => (
    <div className="max-w-4xl" key={post.id}>
      <JobPostCard 
        onToggleSave={isSaved => setSaved(isSaved ? saved : saved.filter(p => p !== post))}
        post={post} 
        user={user}  
      />
    </div>
  ));
}
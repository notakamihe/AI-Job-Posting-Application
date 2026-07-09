import Rating from "@/components/Rating";
import { Employer, FormState, Review, ReviewFormData } from "@/types";
import { startTransition, useActionState, useEffect, useState } from "react";
import { updateReview, createReview } from "@/actions/api/review";

function Asterisk() {
  return <span className="text-red-500 inline-block translate-y-0.75 ml-1.5 scale-150 h-4">*</span>;
}

interface ReviewFormProps {
  employer: Employer;
  onCancel?: () => void;
  onSave?: (review: Review) => void;
  review?: Review;
}

export default function ReviewForm({ employer, onCancel, onSave, review }: ReviewFormProps) {
  const [state, formAction, isPending] = useActionState<FormState<Review> | null, ReviewFormData>(
    (state, formData) => review ? updateReview(state, review.id, formData) : createReview(state, formData), 
    null
  );
  
  const [formData, setFormData] = useState<ReviewFormData>({ 
    employerId: employer.id,
    rating: review?.rating ?? 0,
    title: review?.title ?? "",
    description: review?.description ?? "",
  });
  
  useEffect(() => {
    if (state?.success) {
      if (review)
        onSave?.({ ...review, ...formData });
      else if (state.data)
        onSave?.({ ...state.data });
    }
  }, [state])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!isPending)
      startTransition(() => formAction(formData));
  }
  
  return (
    <form className="@container/review-form h-full flex flex-col shrink-0" onSubmit={handleSubmit}>
      <div className={`flex flex-col grow border border-base-content/20 rounded p-2 overflow-hidden ${state?.message ? "@max-lg/review-form:pb-0" : ""}`}>
        <div className="flex justify-between gap-3 p-1 pb-0">
          <Rating 
            onChange={e => setFormData({ ...formData, rating: Math.max(1, Number(e.target.value)) })}
            value={formData.rating}
          />
          <div className="flex items-center">
            {state?.message && (
              <span className={`hidden @lg/review-form:inline ${state.success ? "bg-success/15 text-success" : "bg-error/15 text-error"} font-medium text-sm text-center px-3 py-1 mt-px rounded mr-5`}>
                {state.message}
              </span>
            )}
            <button className="btn btn-sm text-sm mr-2" disabled={isPending} onClick={onCancel} type="button">
              {review ? "Close" : "Cancel"}
            </button>
            <button 
              className="btn btn-primary btn-sm text-sm w-12" 
              disabled={!formData.rating || !formData.title.trim() || !formData.description.trim()}
            >
              {isPending ? <span className="loading loading-ring loading-sm" /> : (review ? "Save" : "Add")}
            </button>
          </div>
        </div>
        <div className="p-1">
          <label className="block text-sm mb-1" htmlFor="title">
            Title<Asterisk />
          </label>
          <input 
            className="input text-base p-1 px-2 h-auto w-full" 
            id="title" 
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter title and keep it short" 
            type="text"
            value={formData.title}
          />
        </div>
        <div className="flex flex-col grow overflow-hidden p-1">
          <label className="block text-sm mb-1" htmlFor="description">
            Description<Asterisk />
          </label>
          <textarea 
            className="textarea p-1 px-2 grow min-h-0 w-full" 
            id="description" 
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description"
            rows={5} 
            value={formData.description}
          />
        </div>
        {state?.message && (
          <p className={`mt-1 mb-2 @lg/review-form:hidden ${state.success ? "bg-success/15 text-success" : "bg-error/15 text-error"} font-medium text-sm text-center px-3 py-0.5 rounded m-auto`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
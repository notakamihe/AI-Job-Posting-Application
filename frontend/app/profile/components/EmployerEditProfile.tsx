"use client"

import { updateUserProfile } from "@/actions/api/user";
import { AuthenticatedUser, Employer, EmployerProfileFormData, FormState, User } from "@/types";
import { employerSizeOptions, industries } from "@/utils/constants";
import { preventSubmitOnEnter } from "@/utils/utils";
import { useNavigationGuard } from "next-navigation-guard";
import Link from "next/link";
import { useState, useMemo, useRef, useActionState, startTransition, useEffect } from "react";
import { FaSave } from "react-icons/fa";

export function toFormData(user: Employer): EmployerProfileFormData {
  return {
    type: "Employer",
    location: user.location ?? "",
    industry: user.industry ?? "",
    name: user.name,
    website: user.website ?? "",
    size: Object.keys(employerSizeOptions).find(key => 
      employerSizeOptions[key].low === user.sizeRangeLowEnd && 
      employerSizeOptions[key].high === user.sizeRangeHighEnd
    ) ?? "",
    about: user.about ?? ""
  };
}

export default function EmployerEditProfile({ employer, user }: { employer: Employer; user: AuthenticatedUser }) {
  const [state, formAction, isPending] = useActionState<FormState<User> | null, EmployerProfileFormData>(
    (state, formData) => updateUserProfile(state, employer.id, formData), 
    null
  );
  
  const [formData, setFormData] = useState<EmployerProfileFormData>(toFormData(employer));
  const [hideMessage, setHideMessage] = useState(false);
  const [savedFormData, setSavedFormData] = useState(formData);
  
  const formRef = useRef<HTMLFormElement>(null);
  
  const isDirty = useMemo(() => formData !== savedFormData, [formData]);
  useNavigationGuard({ enabled: isDirty, confirm: () => window.confirm("You have unsaved changes that will be lost.") });

  const disableSubmit = useMemo(() => {
    return !isDirty || !formRef.current?.checkValidity() || !formData.name.trim() || !formData.size;
  }, [isDirty, formData])

  useEffect(() => {
    setSavedFormData(toFormData(employer));
  }, [employer])

  useEffect(() => {
    setHideMessage(false);
    
    if (state?.success && state.data?.type === "Employer") {
      const formData = toFormData({ ...employer, ...state.data, jobPosts: employer.jobPosts });
      setFormData(formData);
      setSavedFormData(formData);
    }
  }, [state])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setHideMessage(true);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isPending)
      startTransition(() => formAction(formData));
  }

  return (
    <form className="flex flex-col grow" onKeyDown={preventSubmitOnEnter} onSubmit={handleSubmit} ref={formRef}>
      <div className="max-w-6xl mx-auto grow w-full mb-10 px-5 md:px-10">
        <div className="mb-5">
          <label className="block text-sm mb-1" htmlFor="name">
            Name
            <span className="text-red-500 inline-block translate-y-1.5 ml-1 text-xl">*</span>  
          </label>
          <input 
            className="input text-base w-full" 
            id="name" 
            maxLength={250}
            name="name"
            onChange={handleChange}
            placeholder="Microsoft" 
            type="text"
            value={formData.name}
          />
        </div>
        <div className="flex flex-wrap gap-5 mb-5">
          <div className="flex-1 min-w-fit">
            <label className="block text-sm mb-1" htmlFor="industry">Industry</label>
            <select 
              className="select w-full text-base [&:has(option[hidden]:checked)]:text-base-content/40 *:text-base-content"
              id="industry" 
              name="industry"
              onChange={handleChange}
              onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }}
              value={formData.industry}
            >
              <option hidden value="">Select industry</option>
              <option value=""></option>
              {industries.map(industry => <option key={industry} value={industry}>{industry}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-fit">
            <label className="block text-sm mb-1" htmlFor="location">Location</label>
            <input 
              className="input text-base w-full" 
              id="location" 
              name="location"
              onChange={handleChange}
              placeholder="Los Angeles, California, United States" 
              type="text" 
              value={formData.location}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="website">Website</label>
          <input 
            className="input text-base w-full peer user-invalid:input-error" 
            id="website" 
            name="website"
            onChange={handleChange}
            placeholder="https://www.example.com" 
            type="url" 
            value={formData.website}
          />
          <p className="invisible text-xs text-error pt-1 h-6 peer-user-invalid:visible">Invalid URL.</p>
        </div>
        <div className="mb-5">
          <p className="text-sm mb-3 text-center">Size</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {Object.keys(employerSizeOptions).map((key, idx) => (
              <label
                className="has-checked:bg-primary/10 has-checked:text-primary has-checked:border-primary hover:bg-primary/10 hover:text-primary hover:border-primary border-base-content/45 bg-base-content/5 text-base-content/60 px-2 py-1 border rounded inline-block text-sm cursor-pointer font-bold"
                key={idx}
              >
                <input
                  checked={formData.size === key}
                  className="sr-only"
                  name="size"
                  onChange={handleChange}
                  type="radio"
                  value={key}
                />
                {key}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="about">About</label>
          <textarea 
            className="textarea text-base w-full" 
            id="about" 
            name="about"
            onChange={handleChange}
            placeholder="Describe yourself"
            rows={5}
            value={formData.about}
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-y-3 sticky bottom-0 p-3 bg-base-100 z-1 border-t border-t-base-content/20 text-right md:flex-row md:justify-between">
        {isPending && <span className="loading loading-ring loading-lg text-primary" />}
        {!isPending && state?.message && !hideMessage && (
          <span className={`inline-block ${state?.success ? "bg-success/15 text-success": "bg-error/15 text-error"} ml-1 rounded font-medium py-0.5 px-3 text-left`}>
            {state.message}
          </span>
        )}
        <div className="flex justify-end grow">
          <button 
            className="btn mr-3" 
            disabled={isPending || !isDirty} 
            onClick={() => setFormData(savedFormData)} 
            type="button"
          >
            Revert
          </button>
          <button className="btn btn-primary mr-3" disabled={disableSubmit}>
            <FaSave />Save
          </button>
          <Link className="btn btn-neutral" href={`/profile${user.id !== employer.id ? "/" + employer.id : ""}`}>
            Done
          </Link>
        </div>
      </div>
    </form>
  )
}
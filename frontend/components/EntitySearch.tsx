"use client"

import { getSearchResults } from "@/actions/api/discover";
import { EntityQueryResult } from "@/types";
import { debounce, getPayRangeString } from "@/utils/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { FaLocationDot, FaStar } from "react-icons/fa6";
import ReadyToWork from "./icons/ReadyToWork";

interface EntitySearchProps {
  allowSubmit?: boolean;
  autoFocus?: boolean;
  className?: string;
  numResults?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect?: (result: EntityQueryResult) => boolean | void;
  placeholder?: string;
  type?: ("JobPost" | "Employer" | "Applicant")[];
  value?: string;
}

const EntitySearch = forwardRef<HTMLInputElement, EntitySearchProps>(({ 
  allowSubmit, 
  autoFocus,
  className,
  numResults, 
  onChange, 
  onSelect,
  placeholder,
  type,
  value
}, ref) => {
  const router = useRouter();

  const [error, setError] = useState<EntityQueryResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [results, setResults] = useState<EntityQueryResult[]>([]);
  const [text, setText] = useState("");

  const textRef = useRef("");

  useEffect(() => {
    if (value !== undefined)
      setText(value);
  }, [value])

  useEffect(() => {
    textRef.current = text;

    if (!text.trim()) {
      setResults([]);
      setIsPending(false);
      return;
    }

    search(text);
  }, [text]);

  const search = useCallback(
    debounce((term: string) => {
      setIsPending(true);
      getSearchResults(term, { type }, 0, numResults || 7)
        .then(result => {
          if (textRef.current.trim() === term.trim()) {
            setResults(result.results);
            setIsPending(false);
          }
        });
    }, 500),
    [type, numResults]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    
    if (value === undefined)
      setText(e.target.value);

    onChange?.(e);
  }

  function handleSelect(e: React.MouseEvent<HTMLAnchorElement>, result: EntityQueryResult) {
    if (onSelect) {
      e.preventDefault();
  
      if (onSelect?.(result)) {
        setError(null);
        requestAnimationFrame(() => setError(result));
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); 

    if (text && allowSubmit !== false) {
      if (document.activeElement)
        (document.activeElement as HTMLElement).blur();
      
      router.push(`/discover?${new URLSearchParams({ term: text }).toString()}`);
    }
  }

  return (
    <form className="flex" onSubmit={handleSubmit}>
      <div className="grow">
        <div className="dropdown dropdown-start w-full">
          <div className={"w-full input " + className}>
            <input 
              autoFocus={autoFocus}
              className="grow text-base" 
              onChange={handleChange}
              placeholder={placeholder || "Search jobs, employers, and job seekers"}
              ref={ref}
              value={value}
            />
            {isPending && <span className="loading loading-ring loading-md" />}
          </div>
          {text && results.length > 0 && (
            <ul 
              className="@container dropdown-content bg-base-100 rounded-box z-1 w-full p-1 shadow-sm border border-base-content/10 mt-1 py-2"
              tabIndex={0}
            >
              {results.map((result, idx) => (
                <li className="px-0.75 py-px overflow-hidden" key={idx}>
                  <div className={`relative flex items-center py-1.5 px-2 rounded-md cursor-pointer gap-1 ${result.id === error?.id ? "bg-red-500/15 text-red-500 animate-shake" : "hover:bg-base-content/5"} sm:px-3`}>
                    <Link 
                      className="absolute inset-0"
                      href={`/${result.type === "JobPost" ? "post" : "profile"}/${result.id}`}
                      onClick={e => handleSelect(e, result)}
                    />
                    {result.type === "Applicant" && (
                      <>
                        <div className="grow min-w-0">
                          <div className="leading-none mb-1">
                            {result.readyToWork && <ReadyToWork className="inline text-success mr-2" />}
                            <span className="inline font-medium text-[0.95rem] leading-none line-clamp-2">
                              {result.firstName} {result.middleName} {result.lastName}
                            </span>
                          </div>
                          {(result.preferredOccupation || result.location) && (
                            <p className="flex items-center gap-x-2.75 text-current/75 text-sm leading-none flex-wrap gap-y-1 overflow-hidden min-w-0 mt-1">
                              {result.preferredOccupation && (
                                <span className="whitespace-nowrap truncate">{result.preferredOccupation}</span>
                              )}
                              {result.location && (
                                <span className="inline-flex items-center min-w-0 overflow-hidden">
                                  <FaLocationDot className="text-xs mr-1.25 shrink-0 scale-90" />
                                  <span className="truncate">{result.location}</span>
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        {(!type || type.length > 1) && (
                          <span className="hidden text-xs text-current/60 @md:inline text-right">JOB SEEKER</span>
                        )}
                      </> 
                    )}
                    {result.type === "Employer" && (
                      <>
                        <div className="grow min-w-0">
                          <p className="font-medium text-[0.95rem] leading-none mb-1 line-clamp-2">
                            {result.name}
                          </p> 
                          <p className="flex items-center gap-x-2.75 text-current/75 text-sm leading-none min-w-0 flex-wrap gap-y-1">
                            {result.industry && (
                              <span className="whitespace-nowrap shrink-0">
                                {result.industry}
                              </span>
                            )}
                            {result.location && (
                              <span className="inline-flex items-center min-w-0 overflow-hidden">
                                <FaLocationDot className="text-xs mr-1.25 shrink-0 scale-90" />
                                <span className="truncate">{result.location}</span>
                              </span>
                            )}
                          </p>
                        </div>
                        {result.averageRating && (
                          <div className={`flex items-center px-1.25 py-px rounded-xl ${result.id === error?.id ? "bg-red-400/20 text-red-500" : "bg-amber-400/20 text-amber-400"}`}>
                            <FaStar className="mr-1 text-sm" />
                            <span className="text-sm">
                              {result.averageRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {(!type || type.length > 1) && (
                          <span className="hidden text-xs text-current/60 ml-2 @md:inline">EMPLOYER</span>
                        )}
                      </>
                    )}
                    {result.type === "JobPost" && (
                      <>
                        <div className="grow min-w-0">
                          <p className="font-medium text-[0.95rem] leading-none line-clamp-2 mb-1">
                            {result.title}
                          </p> 
                          <p className="flex items-center text-sm text-current/75 min-w-0 flex-wrap gap-y-1">
                            <span className="leading-none whitespace-nowrap truncate">
                              <Link 
                                className="link link-primary text-primary font-bold relative"
                                href={`/profile/${result.employer.id}`}
                              >
                                {result.employer.name}
                              </Link>
                              <span className="mx-2">&bull;</span>
                            </span>
                            {(result.payLowEnd !== null || result.payHighEnd !== null) && (
                              <span className="leading-none whitespace-nowrap truncate">
                                {getPayRangeString(result.payLowEnd, result.payHighEnd)}/hr
                                <span className="hidden mx-2 @sm:inline">&bull;</span>
                              </span>
                            )}
                            <span className="hidden leading-none whitespace-nowrap @sm:inline">
                              {result.medium} {result.employmentType}
                            </span>
                          </p>
                        </div>
                        {(!type || type.length > 1) && (
                          <span className="hidden text-xs text-current/60 @md:inline">JOB POST</span>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {allowSubmit !== false && (
        <button className="flex btn btn-primary ml-5 max-md:btn-square">
          <FaSearch />
          <span className="hidden md:inline">Search</span>
        </button>
      )}
    </form>
  )
})

export default EntitySearch;
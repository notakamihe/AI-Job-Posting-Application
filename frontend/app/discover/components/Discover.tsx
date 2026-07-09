"use client"

import { getDiscoverResults, getSearchResults } from "@/actions/api/discover";
import ApplicantCard from "@/components/ApplicantCard";
import EntitySearch from "@/components/EntitySearch";
import EmployerCard from "@/components/EmployerCard";
import NoResults from "@/components/icons/NoResults";
import JobApplicationCard from "@/components/JobApplicationCard";
import JobPostCard from "@/components/JobPostCard";
import { JobApplication, EntityQueryResult, AuthenticatedUser, DiscoverFilterFormData, Pagination } from "@/types";
import { useResizeObserver } from "@/utils/hooks/useResizeObserver";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { FaFilter, FaXmark } from "react-icons/fa6";
import DiscoverFilterForm from "./DiscoverFilterForm";
import FilterApplied from "@/components/icons/FilterApplied";

interface FilterButtonProps {
  active: boolean; 
  className: string; 
  isFilterApplied: boolean; 
  onClick: () => void;
}

function FilterButton({ active, className, isFilterApplied, onClick }: FilterButtonProps) {
  return (
    <button 
      className={`btn btn-sm btn-circle ${active ? "bg-primary border-primary" : isFilterApplied ? "border-primary bg-transparent" : ""} ${className}`}
      onClick={onClick}
      type="button"
    >
      {isFilterApplied ? (
        <FilterApplied className={`translate-y-px scale-135 ${active ? "text-white" : "text-primary"}`} />
      ): (
        <FaFilter className={`translate-y-px ${active ? "text-white" : ""}`} />
      )}
    </button>
  );
}

interface DiscoverProps { 
  applications: { results: JobApplication[]; totalCount: number; };
  user: AuthenticatedUser | null;
}

const initialFilterFormData: DiscoverFilterFormData = {
  location: "",
  jobPost: { before: "", after: "", minPay: "", type: "", medium: "", skills: [] },
  applicant: {
    readyToWork: false,
    preferredOccupation: "",
    industry: "",
    minWorkExperienceYears: "",
    minEducationTrainingLevel: "",
    skills: []
  },
  employer: { industry: "", size: "", minRating: 0 },
  type: []
};

export default function Discover({ applications, user }: DiscoverProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [appliedFilterFormData, setAppliedFilterFormData] = useState<DiscoverFilterFormData | undefined>(undefined);
  const [filterFormData, setFilterFormData] = useState(initialFilterFormData);
  const [hydrated, setHydrated] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isMorePending, setIsMorePending] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [results, setResults] = useState<EntityQueryResult[] | null>(null);
  const [searchText, setSearchText] = useState("");
  const [showFilterForm, setShowFilterForm] = useState(false);
  const [showFilterFormMobile, setShowFilterFormMobile] = useState(false);
  const [showRecentApplications, setShowRecentApplications] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { height } = useResizeObserver(searchContainerRef);

  const searchTerm = searchParams.get("term");

  useEffect(() => {
    setHydrated(true);
    router.refresh();
  }, [])

  useEffect(() => {
    if (searchTerm)
      setSearchText(searchTerm);
  }, [searchTerm])

  useEffect(() => {
    setShowFilterFormMobile(false);
    loadItems(appliedFilterFormData);
  }, [searchTerm])

  useEffect(() => {
    function handleScroll(e: Event) {
      const currentTarget = e.currentTarget as HTMLElement;
      
      if (
        currentTarget.scrollTop > 0.95 * currentTarget.scrollHeight - currentTarget.clientHeight &&
        pagination && 
        pagination.page < pagination.pageCount && 
        !isPending && 
        !isMorePending
      ) {
        setIsMorePending(true);

        const promise = searchTerm 
          ? getSearchResults(searchTerm, appliedFilterFormData, pagination.page + 1)
          : getDiscoverResults(appliedFilterFormData, pagination.page + 1);

        promise.then(result => {
          setPagination(result);
          setResults(prev => prev ? [...prev, ...result.results] : result.results);
          setIsMorePending(false);
        });
      }
    }

    const element = document.getElementsByTagName("main")[0].parentElement;
    
    if (!element)
      return;

    element.addEventListener("scroll", handleScroll);
    return () => element.removeEventListener("scroll", handleScroll);
  }, [isPending, isMorePending, pagination, searchTerm, appliedFilterFormData])

  async function clear() {
    setFilterFormData(initialFilterFormData);
    setAppliedFilterFormData(undefined);
    await loadItems();
  }

  function clearSearch() {
    router.push("/discover");
    
    if (user) {
      const validSections = [];

      if (user.type !== "Applicant")
        validSections.push("Applicant");
      
      if (user.type !== "Employer")
        validSections.push("JobPost", "Employer");

      const appliedFilterValid = 
        !appliedFilterFormData ||
        appliedFilterFormData.type.length > 0 && validSections.includes(appliedFilterFormData.type[0]);

      if (!appliedFilterValid) {
        setAppliedFilterFormData(undefined);
        setShowFilterFormMobile(false);
        loadItems();
      }

      if (filterFormData.type.length === 0 || !validSections.includes(filterFormData.type[0]))
        setFilterFormData(appliedFilterFormData && appliedFilterValid ? appliedFilterFormData : initialFilterFormData);
    }
  }

  async function filter() {
    if (filterFormData !== initialFilterFormData) {
      setAppliedFilterFormData(filterFormData);
      setShowFilterFormMobile(false);
      await loadItems(filterFormData);
    }
  }

  async function loadItems(formData?: DiscoverFilterFormData | undefined) {
    setIsPending(true);
    setShowRecentApplications(false);

    const result = searchTerm 
      ? await getSearchResults(searchTerm, formData)
      : await getDiscoverResults(formData);

    setPagination(result);
    setResults(result.results);
    setIsPending(false);
  }

  const filters: ("JobPost" | "Employer" | "Applicant")[] | undefined = useMemo(() => {
    if (!searchTerm && user) {
      switch (user.type) {
        case "Applicant":
          return ["JobPost", "Employer"];
        case "Employer":
          return ["Applicant"];
      }
    }

    return undefined;
  }, [searchTerm, user]);

  return (
    <>
      <div className="sticky top-0 bg-base-100 z-20 p-5 pb-2" ref={searchContainerRef}>
        <div className="max-w-4xl mx-auto">
          <EntitySearch onChange={e => setSearchText(e.target.value)} value={searchText} />
        </div>
        {applications.results.length > 0 && (
          <div className={`text-right mt-4 w-full md:hidden`}>
            <button 
              className={`btn btn-sm h-7 ${!showRecentApplications ? "btn-outline btn-primary" : ""}`} 
              onClick={() => setShowRecentApplications(!showRecentApplications)}
            >
              {showRecentApplications ? "Close" : "Recent applications"}
            </button>
          </div>
        )}
      </div>
      <div className="grow flex gap-5 px-5 pt-0 justify-center lg:px-10">
        {results && (  
          <aside 
            className={`pb-5 flex-col shrink-3 self-start pt-1 ${showRecentApplications ? `hidden ${showFilterFormMobile ? "md:flex md:grow" : ""}` : showFilterFormMobile ? "flex grow" : "hidden"} ${applications.results.length > 0 ? `lg:flex ${showFilterForm ? "lg:min-w-72 lg:max-w-84 lg:grow" : "lg:hidden"}` : `md:flex ${showFilterForm ? "md:min-w-72 md:max-w-84 md:grow" : "md:hidden"}`}`} 
            style={{ top: height, height: `calc(var(--aside-height) - ${height}px)` }}
          >
            <div className="flex justify-between items-center px-1 mb-3">
              <h2 className="text-lg font-bold">Filter</h2>
              <FilterButton  
                active={showFilterFormMobile}
                className={applications.results.length > 0 ? "lg:hidden" : "md:hidden"}
                isFilterApplied={!!appliedFilterFormData}
                onClick={() => { 
                  setShowFilterForm(!showFilterFormMobile); 
                  setShowFilterFormMobile(!showFilterFormMobile); 
                }}
              />
            </div>
            <div className="overflow-auto grow">
              <DiscoverFilterForm 
                filters={filters}
                disableClear={!appliedFilterFormData}
                formData={filterFormData}
                onClear={clear}
                onFilter={filter}
                onFormDataChange={setFilterFormData}
              />
            </div>
          </aside>
        )}
        <div className={`flex-col max-w-4xl grow basis-180 pb-5 min-w-0 ${showRecentApplications ? `hidden ${!showFilterFormMobile ? "md:flex" : ""}` : showFilterFormMobile ? "hidden" : "flex"} ${applications.results.length > 0 ? "lg:flex" : "md:flex"}`}>
          {results && (
            <div 
              className={`flex justify-between items-center sticky bg-base-100 pb-3 z-10 pt-1 ${isPending ? (applications.results.length > 0 ? "lg:hidden" : "md:hidden") : ""}`}
              style={{ top: height }}  
            >
              <div className={`${showFilterFormMobile ? "hidden" : ""} ${applications.results.length > 0 ? "lg:block" : "md:block"}`}>  
                {!isPending && results && (
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                      {searchTerm ? (
                        <>Search results for <span className="text-primary">{searchTerm}</span></>
                      ) : (
                        user ? "Recommended for you" : "Discover"
                      )}
                    </h2>
                  </div>
                )}
                {(
                  <p>
                    {!isPending && pagination?.totalCount === 0 && (
                      <span className="text-base-content/60">No results</span>
                    )}
                    {!isPending && searchTerm && pagination && pagination.totalCount > 0 && (
                      <span className="text-primary">{pagination.totalCount} search results</span>
                    )}
                    {!isPending && searchTerm && pagination && (
                      <button 
                        className="btn btn-xs btn-circle w-fit p-0.75 h-auto ml-3 -translate-y-px"
                        onClick={clearSearch}
                      >
                        <FaXmark /> 
                      </button>
                    )}
                  </p>
                )}
              </div>
              <FilterButton  
                active={showFilterForm}
                className={`hidden ${applications.results.length > 0 ? "lg:flex" : "md:flex"}`}
                isFilterApplied={!!appliedFilterFormData}
                onClick={() => { setShowFilterForm(!showFilterForm); setShowFilterFormMobile(!showFilterForm); }}
              />
              <FilterButton  
                active={showFilterFormMobile}
                className={applications.results.length > 0 ? "lg:hidden" : "md:hidden"}
                isFilterApplied={!!appliedFilterFormData}
                onClick={() => { 
                  setShowFilterForm(!showFilterFormMobile); 
                  setShowFilterFormMobile(!showFilterFormMobile); 
                }}
              />
            </div>
          )}
          {!hydrated || isPending ? (
            <div className={`flex flex-col gap-4 grow pt-2 ${showFilterFormMobile ? "hidden" : "flex"} ${applications.results.length > 0 ? "lg:flex" : "md:flex"}`}>
              <div className="skeleton flex-3 min-h-26"/>
              <div className="skeleton flex-5 min-h-26"/>
              <div className="skeleton flex-4 min-h-26"/>
              <div className="skeleton hidden flex-3 min-h-26 [@media(min-height:44rem)]:flex"/>
            </div>
          ) : results && (
            results.length > 0 ? (
              <div className={`relative grow ${showFilterFormMobile ? "hidden" : "flex"} ${applications.results.length > 0 ? "lg:flex" : "md:flex"}`}>
                <div className="w-full h-fit">
                  <div className={`overflow-hidden flex flex-col gap-4`}>
                    {results?.map((item, idx) => {
                      switch (item.type) {
                        case "Employer":
                          return <EmployerCard employer={item} highlight={searchTerm} key={idx} showJobCount />;
                        case "JobPost":
                          return (
                            <div key={idx}>
                              <JobPostCard highlight={searchTerm} post={item} user={user} />
                            </div>
                          );
                        case "Applicant":
                          return <ApplicantCard applicant={item} highlight={searchTerm} key={idx} user={user} />;
                      }
                    })}
                    {isMorePending && (
                      <div className="text-center">
                        <span className="loading loading-ring loading-lg text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`flex flex-col grow justify-center items-center ${showFilterFormMobile ? "hidden" : "flex"} ${applications.results.length > 0 ? "lg:flex" : "md:flex"}`}>
                <NoResults className="opacity-17 stroke-base-content text-[10rem] -translate-y-4 rotate-6" />
              </div>
            )
          )}
        </div>
        {user?.type === "Employer" && applications.results.length > 0 && (
          <aside 
            className={`self-start flex-1 flex-col pt-1 pb-5 ${showRecentApplications ? "flex" : "hidden"} md:flex md:min-w-72 md:max-w-84`}
            style={{ top: height, height: `calc(var(--aside-height) - ${height}px)` }}
          >
            <h2 className="font-bold text-lg mb-2.5 pt-1">Recent Applications</h2>
            <div className="grow overflow-auto h-full pr-1 scrollbar-thin">
              {applications.results.slice(0, 5).map((application, idx) => (
                <JobApplicationCard 
                  application={application} 
                  brief 
                  className="border-x-0 border-t-0 px-0! rounded-none pt-0 pb-2.5 mb-2"
                  key={idx}
                  link 
                  showJobPost 
                  size="sm" 
                  user={user} 
                />
              ))}
            </div>
            {applications.results.length > 5 && (
              <Link className="btn btn-block rounded-full mt-5" href="/activity?tab=applications">View more</Link>
            )}
          </aside>
        )}
      </div>
    </>
  )
}
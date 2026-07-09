"use client"

import { deleteJobPost } from "@/actions/api/jobPost";
import { applyToJob, saveJobPost, removeJobApplication, unsaveJobPost } from "@/actions/api/user";
import Contract from "@/components/icons/Contract";
import Hybrid from "@/components/icons/Hybrid";
import YesNo from "@/components/icons/YesNo";
import JobApplicationCard from "@/components/JobApplicationCard";
import JobPostCard from "@/components/JobPostCard";
import { ApplicantJobApplication, AuthenticatedUser, FormState, JobApplicationQuestionType, JobPost, JobPostJobApplication, EmploymentMedium } from "@/types";
import { getPayRangeString, timeAgo } from "@/utils/utils";
import { useNavigationGuard } from "next-navigation-guard";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BsTextParagraph } from "react-icons/bs";
import { FaMoneyBill, FaBuilding, FaBookmark, FaLaptop } from "react-icons/fa";
import { FaClipboardUser, FaXmark, FaPencil, FaTrash, FaClock } from "react-icons/fa6";
import { GrUndo } from "react-icons/gr";
import { IoText } from "react-icons/io5";
import { TbNumber123 } from "react-icons/tb";

interface JobPostDetailProps {
  applications: { results: JobPostJobApplication[]; totalCount: number; };
  post: JobPost;
  similar: JobPost[];
  user: AuthenticatedUser | null;
}

export default function JobPostDetail({ applications, post, similar, user }: JobPostDetailProps) {
  const router = useRouter();

  const [application, setApplication] = useState<ApplicantJobApplication | undefined>(
    user?.type === "Applicant" 
      ? user.applications.find(application => application.jobPost.id === post.id)
      : undefined
  );
  const [formData, setFormData] = useState({
    answers: post.applicationQuestions.map((question) => ({ 
      questionId: question.id, 
      answer: application?.answers.find(answer => answer.question.id === question.id)?.answer ?? "" 
    }))
  });
  const [formState, setFormState] = useState<FormState | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isRemovePending, setIsRemovePending] = useState(false);
  const [isSaved, setIsSaved] = useState(user?.type === "Applicant" && user.saved.some(saved => saved.id === post.id));
  const [isSavePending, setIsSavePending] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showMoreQuestions, setShowQuestions] = useState(false);

  const isAdmin = !!user && user.roles.includes("Admin");
  const isAuthorized = !!user && (isAdmin || user.id === post.employer.id);

  const postedAt = useMemo(() => new Date(post.postedAt), [post.postedAt]);

  const disableSubmit = useMemo(() => {
    return formData.answers.some(answer =>
      !answer.answer.trim() && post.applicationQuestions.find(question => question.id === answer.questionId)!.isRequired
    );
  }, [formData])

  const isDirty = useMemo(() => {
    return application
      ? formData.answers.some(answer => 
          answer.answer.trim() !== (application.answers.find(a => a.question.id === answer.questionId)?.answer ?? "")
        )
      : formData.answers.some(answer => answer.answer.trim());
  }, [application, formData])

  useNavigationGuard({ 
    enabled: showApplicationForm && isDirty, 
    confirm: () => window.confirm("You have unsaved changes that will be lost.") 
  });

  useEffect(() => {
    router.refresh();
  }, [])

  useEffect(() => {
    if (user?.type === "Applicant") {
      setApplication(user.applications.find(application => application.jobPost.id === post.id));
      setIsSaved(user.saved.some(saved => saved.id === post.id));
    }
  }, [user])

  useEffect(() => {
    if (!showApplicationForm)
      setFormState(null);
  }, [showApplicationForm])

  function apply() {
    if (user && user.type === "Applicant" && !isPending && !isRemovePending) {
      setIsPending(true);

      applyToJob(user.id, post.id, formData)
        .then(result => {
          if (result.success && result.data)
            setApplication(result.data);

          setFormState(result);
          setIsPending(false);
        });
    }
  }
  
  function deletePost() {
    if (isAuthorized && !isDeletePending) {
      setIsDeletePending(true);
      deleteJobPost(post.id)
        .then(() => {
          setIsDeletePending(false);
          redirect(`/profile${user.id !== post.employer.id ? "/" + post.employer.id : ""}`);
        });
    }
  }

  function handleApplyClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!application) {
      e.currentTarget.blur();
      apply();
    }  
  }  

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    apply();
  }

  function toggleSave() {
    if (user && user.type === "Applicant" && !isSavePending) {
      setIsSavePending(true);

      if (isSaved) {
        unsaveJobPost(user.id, post.id)
          .then(result => {
            if (result.success)
              setIsSaved(false);

            setIsSavePending(false);
          })
      } else {
        saveJobPost(user.id, post.id)
          .then(result => {
            if (result.success)
              setIsSaved(true);
  
            setIsSavePending(false);
          })
      }
    }
  }

  function removeApplication() {
    if (user && user.type === "Applicant" && application && !isPending && !isRemovePending) {
      setIsRemovePending(true);

      removeJobApplication(user.id, post.id)
        .then(result => {
          if (result.success) {
            setApplication(undefined);
            setShowApplicationForm(false);
            setFormData({ 
              answers: post.applicationQuestions.map(question => ({ questionId: question.id, answer: "" })) 
            });
          }

          setIsRemovePending(false);
          setFormState(result);
        });
    }
  }

  function setAnswer(idx: number, answer: string) {
    const answers = formData.answers.slice();
    answers[idx] = { ...answers[idx], answer };
    
    setFormState(null);
    setFormData({ answers });
  }

  return (
    <div className="flex h-full">
      <div className={`@container/main flex-2 h-full ${showApplicationForm ? "hidden" : "flex"} md:flex`}>
        <div className="p-5 overflow-hidden w-full h-full flex flex-col max-w-7xl mx-auto @3xl/main:p-10">
          <div>
            <div className="flex flex-col gap-x-5 gap-y-1 mb-5 md:mb-4 md:flex-row">
              <div className="grow min-w-0">
                <div className="badge badge-outline badge-primary text-[0.9375rem] leading-tight font-medium mb-1 px-2">
                  Job Post
                </div>
                <h1 className="font-black text-3xl wrap-break-word @3xl/main:text-5xl">{post.title}</h1>
                <p className="flex flex-wrap text-base-content/60">
                  <span className="hidden md:inline">Posted by&nbsp;</span>
                  <Link 
                    className="link link-primary font-bold" 
                    href={`/profile${post.employer.id !== user?.id ? "/" + post.employer.id : ""}`}
                  >
                    {post.employer.id === user?.id ? "you" : post.employer.name}
                  </Link>
                  <span className="mx-2">&bull;</span>
                  <span title={`${postedAt.toDateString()} ${postedAt.toLocaleTimeString()}`}>{timeAgo(postedAt)}</span>
                </p>
              </div>
              {!showApplicationForm && user && (
                isAuthorized ? (
                  <div className="flex gap-3 pt-1.5 shrink-0 md:items-end md:flex-col">
                    <div>
                      <Link className="btn btn-outline btn-neutral" href={`/post/${post.id}/edit`}>
                        <FaPencil />Edit
                      </Link>
                    </div>
                    <div className="dropdown dropdown-bottom dropdown-end">
                      <div className="btn btn-outline btn-error -mb-px w-26" role="button" tabIndex={0}>
                        {isDeletePending ? <span className="loading loading-ring" /> : <><FaTrash />Delete</>} 
                      </div>
                      {!isDeletePending && (
                        <div tabIndex={0} className="dropdown-content menu rounded z-1 w-36 p-3 shadow-sm mt-1.5 bg-base-200">
                          <p className="mb-2 font-medium text-center">Confirm?</p>
                          <div className="flex">
                            <button className="btn btn-error btn-sm mr-3 flex-1" onClick={deletePost}>Yes</button>
                            <button className="btn btn-sm flex-1" onClick={e => e.currentTarget.blur()}>No</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : user.type === "Applicant" && (
                  <div className="flex flex-row-reverse justify-end gap-3 pt-1.5 shrink-0 md:items-end md:flex-col">
                    {formData.answers.length > 0 ? (
                      <button className="btn btn-outline btn-primary" onClick={() => setShowApplicationForm(true)}>
                        <FaClipboardUser />{application ? "View Application" : "Apply"}
                      </button>
                    ) : (
                      <div className="flex flex-row-reverse group md:flex-row" tabIndex={0}>
                        {application && (
                          <button 
                            className={`rounded-l-none rounded-r btn -translate-x-0.5 ${isRemovePending ? "px-1.5" : "px-2"} md:rounded-r-none md:rounded-l md:translate-x-0.5`}
                            onClick={removeApplication}
                          >
                            {isRemovePending ? (
                              <span className="loading loading-ring loading-xs" /> 
                            ) : (
                              <FaTrash className="text-xs" /> 
                            )}
                          </button>
                        )}
                        <button 
                          className={`btn btn-primary w-22 ${application ? `pointer-events-none` : "btn-outline"}`} 
                          onClick={handleApplyClick}
                        >
                          {
                            isPending
                              ? <span className="loading loading-ring" /> 
                              : application ? "Applied" : <><FaClipboardUser />Apply</>
                          }
                        </button>
                      </div>
                    )}
                    <button className={`btn ${isSaved ? "w-24 btn-neutral" : "w-22 btn-outline"}`} onClick={toggleSave}>
                      {isSavePending ? (
                        <span className="loading loading-ring" />
                      ) : (
                        <><FaBookmark />{isSaved ? "Saved" : "Save"}</>
                      )} 
                    </button>
                  </div>
                )
              )}
            </div>
            <div className="flex gap-x-5 gap-3 justify-between flex-wrap max-w-md mb-3 md:mr-7 md:flex-col md:float-left md:mb-0">
              {(post.payLowEnd !== null || post.payHighEnd !== null) && (
                <div className="flex-1">
                  <p className="flex items-center text-[0.9rem] opacity-75">
                    <FaMoneyBill className="text-base mr-1.75" /><span>Pay</span>
                  </p>
                  <p className="font-medium text-lg">
                    {getPayRangeString(post.payLowEnd, post.payHighEnd)}
                    <span className="font-normal text-base text-base-content/75">/hour</span>
                  </p>
                </div>
              )}
              <div className="flex-1">
                <p className="flex items-center text-[0.9rem] opacity-75">
                  <Contract className="mr-2" />
                  <span>Type</span>
                </p>
                <p className="font-medium text-lg">{post.employmentType}</p>
              </div>
              {post.medium && (
                <div className="flex-1">
                  <p className="flex items-center text-[0.9rem] opacity-75">
                    {post.medium === EmploymentMedium.Onsite && <FaBuilding className="text-xs mr-2" />}
                    {post.medium === EmploymentMedium.Hybrid && <Hybrid className="text-base mr-1.75" />}
                    {post.medium === EmploymentMedium.Remote && <FaLaptop className="text-base mr-1.75" />}
                    <span>Medium</span>
                  </p>
                  <p className="font-medium text-lg">{post.medium}</p>
                </div>
              )}
            </div>
            <div>
              <p className="mb-3">{post.summary}</p>
              <div className="overflow-auto">
                <p className="flex items-center text-[0.9rem] opacity-75">
                  <FaClock className="mr-1.75" />
                  <span>Schedule</span>
                </p>
                <p>{post.schedule}</p>
              </div>
            </div>
          </div>
          {post.skillsWanted.length > 0 && (
            <div className="flex gap-2.5 mb-5 items-center flex-wrap clear-both pt-5">
              {post.skillsWanted.map((skill, idx) => (
                <span className="bg-primary/15 text-primary font-medium px-2 py-1 rounded shrink-0" key={idx}>
                  {skill.name}
                </span>
              ))}
            </div>
          )}
          {post.qualifications.length > 0 && (
            <div className="mb-5">
              <h2 className="font-bold text-xl mb-2">Qualifications</h2>
              <ul className="list-inside list-disc">
                {post.qualifications.map((qualification, idx) => (
                  <li 
                    className="border-b border-b-base-content/15 p-1 marker:mr-0! text-base-content/85 w-fit md:p-2 md:pb-1.5" 
                    key={idx}
                  >
                    <span className="-ml-2">{qualification.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {post.responsibilities.length > 0 && (
            <div className="mb-5">
              <h2 className="font-bold text-xl mb-2">Responsibilities</h2>
              <ul className="list-inside list-disc">
                {post.responsibilities.map((responsiblity, idx) => (
                  <li 
                    className="border-b border-b-base-content/15 p-1 text-base-content/85 w-fit md:p-2 md:pb-1.5" 
                    key={idx}
                  >
                    <span className="-ml-2">{responsiblity.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {post.additionalDetails && <p className="italic text-base-content/70">{post.additionalDetails}</p>}
          {isAuthorized && (post.applicationQuestions.length > 0 || applications.totalCount > 0) && (
            <div className="mt-5">
              <h2 className="font-bold text-2xl">Application</h2>
              {post.applicationQuestions.length > 0 && (
                <div className="mb-5 mt-5">
                  <h3 className="text-xl font-bold mb-2">Questions</h3>
                  <div className="mt-3">
                    {post.applicationQuestions.slice(0, showMoreQuestions ? post.applicationQuestions.length : 4).map((question, idx) => (
                      <div 
                        className="flex items-center leading-snug mb-2 border border-base-content/20 px-3 py-1 w-fit rounded" 
                        key={idx}
                      >
                        {question.type === JobApplicationQuestionType.Text && (
                          <IoText className="text-base-content/60 mr-3 shrink-0" />
                        )}
                        {question.type === JobApplicationQuestionType.TextArea && (
                          <BsTextParagraph className="text-base-content/60 mr-3 shrink-0" />
                        )}
                        {question.type === JobApplicationQuestionType.Number && (
                          <TbNumber123 className="text-base-content/60 mr-2 shrink-0 -translate-x-0.5 text-xl" />
                        )}
                        {question.type === JobApplicationQuestionType.Binary && (
                          <YesNo className="text-base-content/60 mr-3 shrink-0" />
                        )}
                        <p>
                          <span className="mr-2">{question.question}</span>
                          {question.isRequired && (
                            <span className="text-red-500 font-bold text-lg translate-y-1 inline-block leading-0">*</span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                  {post.applicationQuestions.length > 4 && (
                    <button className="btn btn-sm px-2 py-1 h-auto" onClick={() => setShowQuestions(!showMoreQuestions)}>
                      {showMoreQuestions ? "Hide More" : "Show All"} Questions
                    </button>
                  )}
                </div>
              )}
              {applications.totalCount > 0 && (
                <div className="mt-5">
                  <h3 className="font-medium text-lg mb-3">
                    {applications.totalCount} Applicant{applications.totalCount !== 1 ? "s" : ""}
                  </h3>
                  <div>
                    {applications.results.map((application, idx) => (
                      <JobApplicationCard 
                        application={{ ...application, jobPost: post }} 
                        className="mb-5"
                        key={idx} 
                        user={user} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {similar.length > 0 && (
            <div className="mt-5 overflow-auto">
              <h2 className="mb-3 text-2xl font-bold">Similar Posts</h2>
              <div className="flex flex-col gap-x-3 gap-y-4 overflow-auto md:flex-row">
                {similar.map((post, idx) => (
                  <div className="w-full h-auto md:w-1/3 md:min-w-sm" key={idx}>
                    <JobPostCard key={idx} post={post} size="sm" user={user} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {showApplicationForm && (
        <aside className="min-w-80 flex-1 md:border-x md:border-x-base-content/20">
          <form className="flex flex-col w-full h-full shrink-0" onSubmit={handleSubmit}>
            <button 
              className="absolute top-1.5 right-2 btn btn-circle btn-sm" 
              onClick={() => setShowApplicationForm(false)}
              type="button"
            >
              <FaXmark className="text-base" />
            </button>
            <h2 className="text-xl font-bold text-center border-b border-b-base-content/20 py-2">
              Fill Your Application
            </h2>
            <div className={`flex flex-col gap-5 my-3 px-4 grow scrollbar-thin overflow-auto ${formState?.message ? "mb-1.5" : ""}`}>
              {formData.answers.map((answer, idx) => {
                const question = post.applicationQuestions.find(question => question.id === answer.questionId)!;
                const savedAnswer = application?.answers.find(ans => ans.question.id === answer.questionId);

                return (
                  <div className="mb-1" key={idx}>
                    <p className="text-sm mb-2">
                      <span>
                        <span className="mr-1.5">{question.question}</span>
                        {question.isRequired && (
                          <span className="text-red-500 inline-block translate-y-0.75 scale-150 mr-2">*</span>
                        )}
                      </span>
                      {savedAnswer && savedAnswer.answer !== answer.answer && (
                        <button 
                          className="btn btn-xs p-0 bg-transparent h-auto py-0.5 px-1 -translate-y-px"
                          onClick={() => setAnswer(idx, savedAnswer.answer)}
                          type="button"
                        >
                          <GrUndo className="opacity-50" />
                        </button>
                      )}
                    </p>
                    <div>
                      {
                        (
                          question.type === JobApplicationQuestionType.Text || 
                          question.type === JobApplicationQuestionType.Number
                        ) && (
                          <input 
                            className={`input text-base w-full ${question.type === JobApplicationQuestionType.Number ? "max-w-36" : ""}`}
                            onChange={e => setAnswer(idx, e.target.value)}
                            placeholder="Enter answer" 
                            step="any"
                            type={question.type.toLowerCase()}
                            value={answer.answer}
                          />
                        )
                      }
                      {question.type === JobApplicationQuestionType.TextArea && (
                        <textarea 
                          className="textarea text-base w-full" 
                          onChange={e => setAnswer(idx, e.target.value)}
                          placeholder="Enter answer" 
                          rows={5} 
                          value={answer.answer}
                        />
                      )}
                      {question.type === JobApplicationQuestionType.Binary && (
                        <div className="join">
                          <input 
                            aria-label="Yes" 
                            checked={answer.answer === "Yes"} 
                            className="join-item btn" 
                            onChange={e => setAnswer(idx, e.target.value)}
                            onClick={e => { if (e.currentTarget.checked && !question.isRequired) setAnswer(idx, ""); }}
                            type="radio" 
                            value="Yes"
                          />
                          <input 
                            aria-label="No" 
                            checked={answer.answer === "No"}
                            className="join-item btn" 
                            onChange={e => setAnswer(idx, e.target.value)}
                            onClick={e => { if (e.currentTarget.checked && !question.isRequired) setAnswer(idx, ""); }}
                            type="radio"
                            value="No"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="sticky bottom-0 bg-base-100">
              {formState?.message && (
                <div className="text-center mb-1.5">
                  <span className={`${formState.success ? "text-success bg-success/15" : "text-error bg-error/15"} px-3 py-0.5 rounded font-medium`}>
                    {formState?.message}
                  </span>
                </div>
              )}
              <div className="bg-base-100 border-t border-base-content/20 p-3 text-center">
                <button className="btn btn-primary w-44" disabled={disableSubmit}>
                  {
                    isPending
                      ? <span className="loading loading-ring" />
                      : `${application ? "Update" : "Submit"} Application` 
                  }
                </button>
                {application && (
                  <button className="btn btn-error w-22 ml-4" onClick={removeApplication} type="button">
                    {isRemovePending ? <span className="loading loading-ring" /> : "Remove"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </aside>
      )}
    </div>
  )
}
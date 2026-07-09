"use client"

import { applyToJob, removeJobApplication } from "@/actions/api/user";
import YesNo from "@/components/icons/YesNo";
import JobApplicationCard from "@/components/JobApplicationCard";
import JobPostCard from "@/components/JobPostCard";
import { AuthenticatedUser, FormState, JobApplication, JobApplicationQuestionType } from "@/types";
import { useNavigationGuard } from "next-navigation-guard";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BsTextParagraph } from "react-icons/bs";
import { FaXmark } from "react-icons/fa6";
import { IoText } from "react-icons/io5";
import { TbNumber123 } from "react-icons/tb";

interface ApplicationDialogContentProps {
  application: JobApplication;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (updated: JobApplication) => void;
}

function ApplicationDialogContent({ application, onClose, onDelete, onUpdate }: ApplicationDialogContentProps) {
  const [edit, setEdit] = useState(false);
  const [formData, setFormData] = useState({ 
    answers: application.jobPost.applicationQuestions.map(question => ({
      questionId: question.id,
      answer: application.answers.find(answer => answer.question.id === question.id)?.answer ?? ""
    })) 
  });
  const [formState, setFormState] = useState<FormState | null>(null);
  const [isPending, setIsPending] = useState(false);

  const disableSubmit = useMemo(() => {
    return formData.answers.some(answer =>
      !answer.answer.trim() &&
      application.jobPost.applicationQuestions.find(question => question.id === answer.questionId)!.isRequired
    );
  }, [formData])

  const isDirty = useMemo(() => {
    return formData.answers.some(answer => 
      answer.answer.trim() !== (application.answers.find(a => a.question.id === answer.questionId)?.answer ?? "")
    );
  }, [application, formData])

  useNavigationGuard({ enabled: isDirty, confirm: () => window.confirm("You have unsaved changes that will be lost.") });

  useEffect(() => {
    setFormData({ answers: application.jobPost.applicationQuestions.map(question => ({
      questionId: question.id,
      answer: application.answers.find(answer => answer.question.id === question.id)?.answer ?? ""
    }))});
  }, [application])

  function cancel() {
    setEdit(false); 
    setFormData({ answers: application.jobPost.applicationQuestions.map(question => ({
      questionId: question.id,
      answer: application.answers.find(answer => answer.question.id === question.id)?.answer ?? ""
    }))});
    setFormState(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!isPending) {
      setIsPending(true);
      applyToJob(application.applicant.id, application.jobPost.id, formData)
        .then(result => {
          if (result.success && result.data) {
            setEdit(false);
            onUpdate(result.data);
          }

          setIsPending(false);
          setFormState(result);
        });
    }
  }
    
  function remove() {
    if (!isPending) {
      setIsPending(true);
      removeJobApplication(application.applicant.id, application.jobPost.id)
        .then(result => {
          if (result.success)
            onDelete();
          
          setIsPending(false);
          setFormState(result);
        })
    }
  }
  
  function setAnswer(index: number, answer: string) {
    const answers = formData.answers.slice();
    answers[index] = { ...answers[index], answer };
    setFormData({ answers });
  }

  return (
    <form className="modal-box w-9/10 max-w-200 flex flex-col max-h-9/10 p-0" onSubmit={handleSubmit}>
      <div className="border-b border-b-base-content/20 py-3 px-4 mb-5 relative">
        <p className="text-base-content/60 text-sm mb-1">You applied to</p>
        <h3 className="font-bold text-xl/5.5">{application.jobPost.title}</h3>
        <Link 
          className="font-medium text-base-content/75 hover:text-primary"
          href={`/profile/${application.jobPost.employer.id}`}
        >
          {application.jobPost.employer.name}
        </Link>
        <button className="btn btn-circle btn-sm absolute top-3 right-3" onClick={onClose} type="button">
          <FaXmark className="text-base" />
        </button>
      </div>
      {formData.answers.length > 0 && (
        <div className="overflow-auto px-5 mb-5">
          {formData.answers.map((answer, idx) => {
            const question = application.jobPost.applicationQuestions.find(question => question.id === answer.questionId)!;

            return (
              <div className="mb-5" key={idx}>
                <div className="flex items-center text-[0.9rem]/5 mb-2">
                  {question.type === JobApplicationQuestionType.Text && (
                    <IoText className="text-base-content/60 mr-3 shrink-0" />
                  )}
                  {question.type === JobApplicationQuestionType.TextArea && (
                    <BsTextParagraph className="text-base-content/60 mr-3 shrink-0" />
                  )}
                  {question.type === JobApplicationQuestionType.Number && (
                    <TbNumber123 className="text-base-content/60 mr-2.25 shrink-0 -translate-x-0.5 text-lg" />
                  )}
                  {question.type === JobApplicationQuestionType.Binary && (
                    <YesNo className="text-base-content/60 mr-3.5 text-xs shrink-0" />
                  )}
                  <p>
                    <span className="mr-2">{question.question}</span> 
                    {question.isRequired && (
                      <span className="text-red-500 inline-block scale-150 h-4 translate-y-0.75">*</span>
                    )}
                  </p>
                </div>
                {edit ? (
                  <>
                    {
                      (
                        question.type === JobApplicationQuestionType.Text ||
                        question.type === JobApplicationQuestionType.Number
                      ) && (
                        <input 
                          className={`input text-base w-full ${question.type === JobApplicationQuestionType.Number ? "max-w-36" : ""}`} 
                          onChange={e => setAnswer(idx, e.target.value)}
                          type={question.type.toLowerCase()} 
                          value={answer.answer} 
                        />
                      )
                    }
                    {question.type === JobApplicationQuestionType.TextArea && (
                      <textarea 
                        className="textarea text-base w-full" 
                        onChange={e => setAnswer(idx, e.target.value)}
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
                  </>
                ) : answer.answer ? (
                  <>
                    <p className="text-sm text-base-content/75">Answer: </p>
                    <p className="font-medium text-primary">
                      {answer.answer}
                    </p>
                  </>
                ) : (
                  <p className="text-base-content/45 font-medium">Unanswered</p>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div className="flex justify-end items-center flex-wrap-reverse px-5 pb-4 gap-3">
        <div className="mx-auto">
          {isPending && <span className="loading loading-ring text-primary" />}
          {!isPending && formState?.message && (
            <p className={`${formState.success ? "text-success bg-success/15" : "text-error bg-error/15"} w-fit rounded font-medium py-1 px-3`}>
              {formState.message}
            </p>
          )}
        </div>
        <div className="shrink-0 grow text-right">
          {edit ? ( 
            <>
              <button className="btn mr-3" onClick={cancel} type="button">Cancel</button>
              <button className="btn btn-primary" disabled={disableSubmit}>Save</button>
            </>
          ) : (
            <>
              {formData.answers.length > 0 && (
                <button 
                  className="btn btn-primary btn-outline mr-3" 
                  onClick={() => { setEdit(true); setFormState(null); }} 
                  type="button"
                >
                  Edit
                </button>
              )}
              <button className="btn btn-error" onClick={remove} type="button">Remove</button>
            </>
          )}
        </div>
      </div>
    </form>
  )
}

interface ApplicationsTabProps {
  applicationsData: { results: JobApplication[]; totalCount: number; };
  user: AuthenticatedUser;
}

export default function ApplicationsTab({ applicationsData, user }: ApplicationsTabProps) {
  const [applicationJobPostId, setApplicationJobPostId] = useState<number | null>(null); 
  const [applications, setApplications] = useState(applicationsData);

  const dialogRef = useRef<HTMLDialogElement>(null);

  const application = useMemo(() => {
    if (user?.type === "Applicant")
      return applications.results.find(application => application.jobPost.id === applicationJobPostId);
    return undefined; 
  }, [applications, applicationJobPostId])

  useEffect(() => {
    setApplications(applicationsData);
  }, [applicationsData])

  function updateApplication(updated: JobApplication) {
    if (application) {
      const idx = applications.results.indexOf(application);
      
      if (idx > -1) {
        const results = applications.results.slice();
        results[idx] = updated;
        setApplications({ ...applications, results });
      }
    }
  }

  if (applications.results.length > 0) {
    switch (user.type) {
      case "Applicant":
        return (
          <>
            {applications.results.map((application, idx) => (
              <div className="flex flex-col max-w-4xl" key={idx}>
                <JobPostCard brief className="rounded-b-none!" post={application.jobPost} user={user} />
                <div 
                  className="btn btn-block border-t-0 border rounded-b-xl border-base-content/20 rounded-t-none bg-transparent"
                  onClick={() => { dialogRef.current?.showModal(); setApplicationJobPostId(application.jobPost.id); }}
                >
                  <button>View Application</button>
                </div>
              </div>
            ))}
            <dialog className="modal w-screen overflow-clip" ref={dialogRef}>
              {application && (
                <ApplicationDialogContent 
                  application={application} 
                  onClose={() => { dialogRef.current?.close(); setApplicationJobPostId(null); }}
                  onDelete={() => {
                    dialogRef.current?.close();
                    setApplications({ 
                      results: applications.results.filter(a => a !== application),
                      totalCount: applications.totalCount - 1
                    });
                  }}
                  onUpdate={updateApplication}
                />
              )}
              <form className="modal-backdrop" method="dialog" onSubmit={() => setApplicationJobPostId(null)}>
                <button>close</button>
              </form>
            </dialog>
          </>
        );
      case "Employer":
        return applications.results.map((application, idx) => (
          <JobApplicationCard application={application} className="max-w-4xl" key={idx} showJobPost user={user} />
        ));
    }
  } else {
    return <p className="text-lg font-medium opacity-50">No applications</p>;
  }
  
  return null;
}
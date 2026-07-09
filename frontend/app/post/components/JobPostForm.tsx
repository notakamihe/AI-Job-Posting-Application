"use client"

import { createJobPost, updateJobPost } from "@/actions/api/jobPost";
import SkillSearch from "@/components/SkillSearch";
import { EmploymentMedium, EmploymentType, FormState, JobApplicationQuestionType, JobPost, JobPostFormData } from "@/types";
import { useResizeObserver } from "@/utils/hooks/useResizeObserver";
import { preventSubmitOnEnter } from "@/utils/utils";
import { useNavigationGuard } from "next-navigation-guard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useMemo, useActionState, useEffect, startTransition } from "react";
import { FaPlus, FaSave } from "react-icons/fa";
import { MdRemove, MdRemoveCircle } from "react-icons/md";

function Asterisk() {
  return <span className="text-red-500 inline-block translate-y-0.75 ml-1.5 scale-150 h-4">*</span>;
}

function toFormData(post?: JobPost) {
  return {
    title: post?.title ?? "",
    summary: post?.summary ?? "",
    payLowEnd: post?.payLowEnd?.toString() ?? "",
    payHighEnd: post?.payHighEnd?.toString() ?? "",
    medium: post?.medium ?? "",
    employmentType: post?.employmentType ?? "",
    schedule: post?.schedule ?? "",
    qualifications: post?.qualifications.map(qualification => ({ 
      id: qualification.id, 
      description: qualification.description 
    })) ?? [],
    responsibilities: post?.responsibilities.map(responsibility => ({ 
      id: responsibility.id, 
      description: responsibility.description 
    })) ?? [],
    skillsWanted: post?.skillsWanted.map(skill => ({ id: skill.id, name: skill.name })) ?? [],
    additionalDetails: post?.additionalDetails ?? "",
    applicationQuestions: post ? post.applicationQuestions.map(question => ({ 
      id: question.id, 
      question: question.question,
      type: question.type,
      isRequired: question.isRequired
    })) : []
  };
}

export default function JobPostForm({ post } : { post?: JobPost; }) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<FormState<JobPost> | null, JobPostFormData>(
    (state, formData) => post ? updateJobPost(state, post.id, formData) : createJobPost(state, formData), 
    null
  );

  const [formData, setFormData] = useState<JobPostFormData>(toFormData(post));
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof JobPostFormData, string>>>(validate(formData));
  const [hideMessage, setHideMessage] = useState(false);
  const [savedFormData, setSavedFormData] = useState(formData);
  const [tab, setTab] = useState(0);

  const formRef = useRef<HTMLFormElement>(null);
  const formActionsContainerRef = useRef<HTMLDivElement>(null);

  const isDirty = useMemo(() => formData !== savedFormData, [formData]);
  
  useNavigationGuard({ 
    enabled: isDirty && (!!post || !state?.success), 
    confirm: () => window.confirm("You have unsaved changes that will be lost.") 
  });

  const { height } = useResizeObserver(formActionsContainerRef);

  const disableSubmit = useMemo(() => {
    if (post) {
      if (!isDirty)
        return true;
    } else {
      if (state?.success)
        return true;
    }

    if (!formRef.current?.checkValidity())
      return true;
    if (Object.values(validate(formData)).some(e => e))
      return true;

    if (!formData.title.trim() || !formData.summary.trim() || !formData.employmentType || !formData.schedule.trim())
      return true;
    if (formData.qualifications.some(qualification => !qualification.description.trim()))
      return true;
    if (formData.responsibilities.some(responsibility => !responsibility.description.trim()))
      return true;
    if (formData.applicationQuestions.some(question => !question.question.trim()))
      return true;

    return false;
  }, [post, isDirty, formData, state])

  useEffect(() => {
    setSavedFormData(toFormData(post));
  }, [post])

  useEffect(() => {
    setHideMessage(false);

    if (state?.success && state.data) {
      const formData = toFormData(state.data);
      
      setFormData(formData);
      setSavedFormData(formData);

      if (!post)
        router.push(`/post/${state.data.id}`);
    }
  }, [state])

  function handleBlur(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFormErrors(validate(formData));
    e.target.dataset.touched = "true";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const name = e.target.name as keyof JobPostFormData;
    const newFormData = { ...formData, [name]: e.target.value };

    modifyFormData(newFormData);

    if (e.target.dataset.touched)
      setFormErrors(validate(newFormData));
  }

  function handleQualificationChange(
    idx: number, 
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const qualifications = formData.qualifications.slice();
    qualifications[idx] = { ...qualifications[idx], description: e.target.value };
    modifyFormData({ ...formData, qualifications: qualifications });
  }

  function handleQuestionChange(
    idx: number, 
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const applicationQuestions = formData.applicationQuestions.slice();
    
    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox")
      applicationQuestions[idx] = { ...applicationQuestions[idx], [e.target.name]: e.target.checked };
    else
      applicationQuestions[idx] = { ...applicationQuestions[idx], [e.target.name]: e.target.value };

    modifyFormData({ ...formData, applicationQuestions });
  }

  function handleResponsibilityChange(
    idx: number, 
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const responsibilities = formData.responsibilities.slice();
    responsibilities[idx] = { ...responsibilities[idx], description: e.target.value };
    modifyFormData({ ...formData, responsibilities });
  }
  
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!isPending)
      startTransition(() => formAction(formData));
  }

  function modifyFormData(formData: JobPostFormData) {
    setHideMessage(true);
    setFormData(formData);
  }

  function revert() {
    setFormData(savedFormData);
    setFormErrors(validate(savedFormData));
  }

  function validate(formData: JobPostFormData) {
    let errors: Partial<Record<keyof JobPostFormData, string>> = {};

    if (!!formData.payLowEnd && !!formData.payHighEnd && Number(formData.payLowEnd) > Number(formData.payHighEnd))
      errors.payLowEnd = "Invalid pay range.";

    return errors;
  }

  return (
    <div className="grow flex flex-col">
      <h1 className="text-center font-bold text-2xl pt-5 md:pt-7">{post ? "Edit" : "Create"} Job Post</h1>
      <div className="tabs tabs-border flex-nowrap justify-center sticky top-0 z-10 bg-base-100 pt-1 pb-3 md:hidden">
        <label className="tab capitalize text-base px-3 hover:text-primary active:text-primary has-checked:text-primary has-checked:font-bold">
          <input checked={tab === 0} onChange={() => setTab(0)} type="radio" />Post Information
        </label>
        <label className="tab capitalize text-base px-3 hover:text-primary active:text-primary has-checked:text-primary has-checked:font-bold">
          <input checked={tab === 1} onChange={() => setTab(1)} type="radio" />Application
        </label>
      </div>
      <form className="grow flex flex-col" onKeyDown={preventSubmitOnEnter} onSubmit={handleSubmit} ref={formRef}>
        <div className="flex grow justify-center w-full mx-auto px-5 md:mt-5 md:px-10">
          <div className="hidden mr-7 border-r border-r-base-content/20 md:block">
            <div className="flex flex-col sticky top-0 pt-6 translate-x-px">
              <label className="w-40 tab text-base justify-start border border-r-transparent border-base-content/20 mb-3 py-1.5 px-3 rounded-l has-checked:text-primary has-checked:font-bold has-checked:border-r-base-100">
                <input checked={tab === 0} onChange={() => setTab(0)} type="radio" />Post Information
              </label>
              <label className="w-40 tab text-base justify-start border border-r-transparent border-base-content/20 py-1.5 px-3 rounded-l has-checked:text-primary has-checked:font-bold has-checked:border-r-base-100">
                <input checked={tab === 1} onChange={() => setTab(1)} type="radio" />Application
              </label>
            </div>
          </div>
          <div className="grow pb-5 max-w-6xl md:pb-7">
            <div className={tab === 0 ? "block" : "hidden"}>
              <div>
                <div className="mb-5">
                  <label className="text-sm block mb-1" htmlFor="title">Title<Asterisk /></label>
                  <input 
                    className="input text-base w-full" 
                    id="title" 
                    maxLength={200}
                    name="title" 
                    onChange={handleChange}
                    placeholder="Software Engineer" 
                    type="text" 
                    value={formData.title}
                  />
                </div>
                <div className="mb-5">
                  <label className="text-sm block mb-1" htmlFor="summary">Summary<Asterisk /></label>
                  <textarea 
                    className="textarea text-base w-full" 
                    id="summary" 
                    name="summary" 
                    onChange={handleChange}
                    placeholder="Describe the position" 
                    rows={5}
                    value={formData.summary}
                  />
                </div>
                <div className="flex flex-wrap gap-5 mb-5">
                  <div className="flex-1 basis-92 min-w-min">
                    <div className="min-w-min">
                      <p className="text-[0.95rem] font-medium">Pay (hourly)</p>
                      <div className="flex flex-wrap gap-x-5">
                        <div className="flex-1 min-w-40 group/payLowEnd">
                          <label className="text-sm block peer" htmlFor="payLowEnd">
                            Low
                            <span className={`mt-1 input w-full has-user-invalid:input-error ${formErrors.payLowEnd ? "input-error" : ""}`}>
                              <span className="opacity-50">$</span>
                              <input 
                                className="grow text-base" 
                                id="payLowEnd" 
                                min={0}
                                name="payLowEnd"
                                onBlur={handleBlur} 
                                onChange={handleChange}
                                step="any"
                                type="number"
                                value={formData.payLowEnd}
                              />
                            </span>
                          </label>
                          <p className="text-xs text-error h-5.5 pt-1">
                            {formErrors.payLowEnd && (
                              <span className="group-has-user-invalid/payLowEnd:hidden">Invalid pay range.</span>
                            )}
                            <span className="hidden group-has-user-invalid/payLowEnd:inline">
                              Pay must be nonnegative.
                            </span>
                          </p>
                        </div>
                        <div className="flex-1 min-w-40">
                          <label className="text-sm block peer" htmlFor="payHighEnd">
                            High
                            <span className="mt-1 input w-full has-user-invalid:input-error">
                              <span className="opacity-50">$</span>
                              <input 
                                className="grow text-base" 
                                id="payHighEnd" 
                                min={0}
                                name="payHighEnd" 
                                onBlur={handleBlur}
                                onChange={handleChange}
                                step="any"
                                type="number"
                                value={formData.payHighEnd}
                              />
                            </span>
                          </label>
                          <p className="invisible text-xs text-error h-5.5 pt-1 peer-has-user-invalid:visible">
                            Pay must be nonnegative.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-5 min-w-min">
                      <div className="flex-1 min-w-fit">
                        <label className="block text-sm mb-1" htmlFor="employmentType">
                          Employment Type<Asterisk />
                        </label>
                        <select 
                          className="select w-full text-base [&:has(option[hidden]:checked)]:text-base-content/40 *:text-base-content"
                          id="employmentType" 
                          name="employmentType" 
                          onChange={handleChange}
                          value={formData.employmentType}
                        >
                          <option hidden value="">Select type</option>
                          {Object.values(EmploymentType).map(value => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 min-w-fit">
                        <label className="block text-sm mb-1" htmlFor="medium">Medium</label>
                        <select 
                          className="select w-full text-base [&:has(option[hidden]:checked)]:text-base-content/40 *:text-base-content"
                          id="medium" 
                          name="medium"
                          onChange={handleChange}
                          value={formData.medium}
                        >
                          <option hidden value="">Select medium</option>
                          <option value=""></option>
                          {Object.values(EmploymentMedium).map(value => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex-2 flex flex-col min-w-fit">
                    <label className="block text-sm mb-1" htmlFor="schedule">Schedule<Asterisk /></label>
                    <textarea 
                      className="textarea text-base w-full grow" 
                      id="schedule" 
                      name="schedule"
                      onChange={handleChange}
                      placeholder="Monday to Friday from 9 a.m.-5 p.m."
                      value={formData.schedule}
                    />
                  </div>
                </div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold mb-5">Qualifications</h2>
                  <div>
                    {formData.qualifications.map((qualification, idx) => (
                      <div className="flex items-center mb-3 gap-3 pb-3 border-b border-b-base-content/20" key={idx}>
                        <input 
                          className="input grow md:text-base" 
                          maxLength={500}
                          name="description"
                          onChange={e => handleQualificationChange(idx, e)}
                          placeholder="Enter qualification"
                          type="text" 
                          value={qualification.description} 
                        />
                         <button 
                          className="btn border-base-content/20 bg-base-100 btn-xs btn-circle"
                          onClick={() => modifyFormData({ 
                            ...formData, 
                            qualifications: formData.qualifications.filter(q => q !== qualification)
                          })}
                          type="button"
                        > 
                          <MdRemove className="text-lg opacity-60" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    className="btn text-base text-base-content/60 border-base-content/20 w-full" 
                    onClick={() => modifyFormData({ 
                      ...formData, 
                      qualifications: [...formData.qualifications, { description: "" }] 
                    })}
                    type="button"
                  >
                    <FaPlus className="mr-1" />
                    <span className="mt-px">Add Qualification</span>
                  </button>
                </div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold mb-5">Responsibilities</h2>
                  <div>
                    {formData.responsibilities.map((responsibility, idx) => (
                      <div className="flex items-center mb-3 gap-3 pb-3 border-b border-b-base-content/20" key={idx}>
                        <input 
                          className="input grow md:text-base" 
                          maxLength={500}
                          name="description"
                          onChange={e => handleResponsibilityChange(idx, e)}
                          placeholder="Enter responsiblity"
                          type="text" 
                          value={responsibility.description} 
                        />
                        <button 
                          className="btn border-base-content/20 bg-base-100 btn-xs btn-circle"
                          onClick={() => modifyFormData({ 
                            ...formData, 
                            responsibilities: formData.responsibilities.filter(r => r !== responsibility)
                          })}
                          type="button"
                        > 
                          <MdRemove className="text-lg opacity-60" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    className="btn text-base text-base-content/60 border-base-content/20 w-full"
                    onClick={() => modifyFormData({ 
                      ...formData, 
                      responsibilities: [...formData.responsibilities, { description: "" }] 
                    })}
                    type="button"
                  >
                    <FaPlus className="mr-1" />
                    <span className="mt-px">Add Responsibility</span>
                  </button>
                </div>
              </div>
              <div className="mb-5">
                <h2 className="text-xl font-bold mb-3">Skills Wanted</h2>
                <div className="flex flex-col items-start gap-x-7 gap-y-4 lg:flex-row">
                  <SkillSearch 
                    onAdd={skill => modifyFormData({ ...formData, skillsWanted: [skill, ...formData.skillsWanted] })}
                    skills={formData.skillsWanted} 
                  />
                  <div className="flex flex-wrap gap-2.5">
                    {formData.skillsWanted.map((skill, idx) => (
                      <span className="px-2 py-1 text-primary bg-primary/10 rounded inline-flex items-center" key={idx}>
                        <button 
                          className="mr-1 rounded-full cursor-pointer" 
                          onClick={() => modifyFormData({ 
                            ...formData, 
                            skillsWanted: formData.skillsWanted.filter(s => s !== skill) 
                          })}
                          type="button"
                        >
                          <MdRemoveCircle />
                        </button>
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="additionalDetails">Additional Details</label>
                <textarea 
                  className="textarea text-base w-full" 
                  id="additionalDetails"
                  name="additionalDetails"
                  onChange={handleChange}
                  placeholder="Benefits included"
                  value={formData.additionalDetails}
                />
              </div>
            </div>
            <div className={"w-full " + (tab === 1 ? "block" : "hidden")}>
              <h2 className="text-xl font-bold mb-5 lg:mb-0">Questions</h2>
              <div>
                {formData.applicationQuestions.length > 0 && (
                  <div className="hidden sticky top-0 bg-base-100 z-10 py-2 pr-9 gap-x-5 lg:flex">
                    <p className="grow text-sm">Question<Asterisk /></p>
                    <p className="text-sm w-50">Type</p>
                    <p className="text-sm w-14.5">Required</p>
                  </div>
                )}
                {formData.applicationQuestions.map((question, idx) => (
                  <div className="flex items-center mt-1 mb-3 gap-3 pb-3 border-b border-b-base-content/20" key={idx}>
                    <div className="flex flex-col grow gap-x-5 gap-y-3 lg:flex-row">
                      <input 
                        className="input grow w-full md:text-base" 
                        name="question"
                        onChange={e => handleQuestionChange(idx, e)}
                        placeholder="Enter question"
                        type="text" 
                        value={question.question} 
                      />
                      <div className="flex gap-x-5 gap-y-3 items-center flex-wrap justify-end shrink-0">
                        <select  
                          className="select text-base grow min-w-0 basis-[fit-content] [&:has(option[hidden]:checked)]:text-base-content/40 *:text-base-content lg:w-50"
                          name="type"
                          onChange={e => handleQuestionChange(idx, e)}
                          value={question.type}
                        >
                          {Object.values(JobApplicationQuestionType).map(value => (
                            <option key={value} value={value}>
                              {value === JobApplicationQuestionType.TextArea ? "Extended Response" : value}
                            </option>
                          ))}
                        </select>
                        <div className="flex lg:w-14.5">
                          <input 
                            checked={question.isRequired}
                            className="checkbox checkbox-primary mx-auto"
                            id={`question-${idx}`}
                            name="isRequired"
                            onChange={e => handleQuestionChange(idx, e)}
                            type="checkbox"
                          />
                          <label className="ml-3 mt-0.5 text-sm lg:hidden" htmlFor={`question-${idx}`}>Required</label>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="btn border-base-content/20 bg-base-100 btn-xs btn-circle"
                      onClick={() => modifyFormData({ 
                        ...formData, 
                        applicationQuestions: formData.applicationQuestions.filter(q => q !== question)
                      })}
                      type="button"
                    > 
                      <MdRemove className="text-lg opacity-60" />
                    </button>
                  </div>
                ))}
                <button 
                  className="btn text-base text-base-content/60 border-base-content/20 w-full mt-3 sticky z-10" 
                  onClick={() => modifyFormData({ 
                    ...formData, 
                    applicationQuestions: [
                      ...formData.applicationQuestions, 
                      { question: "", type: JobApplicationQuestionType.Text, isRequired: false }
                    ] 
                  })}
                  style={{ bottom: height + 12 }}
                  type="button"
                >
                  <FaPlus className="mr-1" />
                  <span className="mt-px">Add Question</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div 
          className="flex flex-col items-center sticky gap-x-5 gap-y-3 bottom-0 bg-base-100 p-3 border-t border-t-base-content/20 sm:flex-row sm:justify-between"
          ref={formActionsContainerRef}
        >
          <div>
            {isPending && <span className="loading loading-ring loading-lg text-primary sm:ml-2" />}
            {!isPending && state?.message && !hideMessage && (
              <span className={`${state?.success ? "bg-success/15 text-success": "bg-error/15 text-error"} inline-block rounded font-medium py-0.5 px-3 sm:ml-1`}>
                {state.message}
              </span>
            )}
          </div>
          <div>
            {post && ( 
              <button className="btn mr-3" disabled={isPending || !isDirty} onClick={revert} type="button">
                Revert
              </button>
            )}
            <button className="btn btn-primary" disabled={disableSubmit}>
              <FaSave />Save
            </button>
            {post && <Link className="btn btn-neutral ml-3" href={`/post/${post.id}`}>Done</Link>}
          </div>
        </div>
      </form>
    </div>
  )
}
import SkillSearch from "@/components/SkillSearch";
import { industries, employerSizeOptions } from "@/utils/constants";
import { FaLocationDot, FaXmark, FaFilterCircleXmark } from "react-icons/fa6";
import { MdFilterList } from "react-icons/md";
import { DiscoverFilterFormData, EmploymentMedium, EmploymentType, Skill } from "@/types";
import Rating from "@/components/Rating";
import { useState } from "react";

interface DiscoverFilterFormProps {
  disableClear: boolean;
  filters?: ("JobPost" | "Employer" | "Applicant")[];
  formData: DiscoverFilterFormData;
  onClear: () => Promise<void>;
  onFilter: () => Promise<void>;
  onFormDataChange: (formData: DiscoverFilterFormData) => void;
}

export default function DiscoverFilterForm({ 
  disableClear,
  filters, 
  formData, 
  onClear, 
  onFilter, 
  onFormDataChange
}: DiscoverFilterFormProps) {
  const [isPending, setIsPending] = useState(false);

  function addApplicantSkill(skill: Skill) {
    const skills = [...formData.applicant.skills, skill];
    onFormDataChange({ ...formData, applicant: { ...formData.applicant, skills } });
  }

  function addJobPostSkill(skill: Skill) {
    const skills = [...formData.jobPost.skills, skill];
    onFormDataChange({ ...formData, jobPost: { ...formData.jobPost, skills } });
  }

  function changeEmployerMinRating(rating: number) {
    onFormDataChange({ 
      ...formData, 
      employer: { ...formData.employer, minRating: formData.employer.minRating === rating ? 0 : rating } 
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); 

    if (!isPending) {
      setIsPending(true);
      onFilter().finally(() => setIsPending(false));
    }
  }

  function removeApplicantSkill(skill: Skill) {
    const skills = formData.applicant.skills.filter(s => s !== skill);
    onFormDataChange({ ...formData, applicant: { ...formData.applicant, skills } });
  }
  
  function removeJobPostSkill(skill: Skill) {
    const skills = formData.jobPost.skills.filter(s => s !== skill);
    onFormDataChange({ ...formData, jobPost: { ...formData.jobPost, skills } });
  }

  function toggleFilterSection(section: "JobPost" | "Employer" | "Applicant") {
    onFormDataChange({ ...formData, type: formData.type.includes(section) ? [] : [section] });
  }
  
  return (
    <form className="flex flex-col h-full w-full overflow-hidden" onSubmit={handleSubmit}>
      <div className="w-full overflow-auto px-1 pb-1 scrollbar-thin">
        <div className="mb-4">
          <label className="block text-[0.8125rem] mb-1" htmlFor="location">Location</label>
          <div className="input input-sm w-full">
            <span className="opacity-50">
              <FaLocationDot />
            </span>
            <input 
              className="grow text-sm" 
              id="location" 
              onChange={e => onFormDataChange({ ...formData, location: e.target.value })}
              placeholder="Los Angeles, California, United States" 
              type="text"
              value={formData.location}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full">
          {
            (formData.type.length === 0 || formData.type.includes("JobPost")) && 
            (!filters || filters.includes("JobPost")) && (
              <div className="w-full">
                <div className="w-full">
                  <button 
                    className={`btn rounded-full h-auto py-1 leading-none ${formData.type.includes("JobPost") ? "btn-primary" : ""}`}
                    onClick={() => toggleFilterSection("JobPost")}
                    type="button"
                  >
                    Job Posts
                  </button>
                </div>
                {formData.type.includes("JobPost") && (
                  <div className="mt-3">
                    <div>
                      <div className="flex flex-wrap gap-x-4 gap-y-3 mb-3">
                        <div className="flex-1">
                          <label className="block text-[0.8125rem] mb-1" htmlFor="before">Before</label>
                          <input
                            className="input input-sm text-sm w-full" 
                            id="before" 
                            onChange={e => onFormDataChange({ 
                              ...formData, 
                              jobPost: { ...formData.jobPost, before: e.target.value } 
                            })}
                            type="date"
                            value={formData.jobPost.before}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[0.8125rem] mb-1" htmlFor="after">After</label>
                          <input 
                            className="input input-sm text-sm w-full" 
                            id="after" 
                            onChange={e => onFormDataChange({ 
                              ...formData, 
                              jobPost: { ...formData.jobPost, after: e.target.value } 
                            })}
                            type="date" 
                            value={formData.jobPost.after}
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-[0.8125rem] mb-1">Min Pay</p>
                        <div className="input input-sm w-full">
                          <span className="opacity-50">$</span>
                          <input 
                            className="grow text-sm" 
                            id="min-pay" 
                            onChange={e => onFormDataChange({ 
                              ...formData, 
                              jobPost: { ...formData.jobPost, minPay: e.target.value } 
                            })}
                            type="number" 
                            value={formData.jobPost.minPay}
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-[0.8125rem] mb-1">Skills Wanted</p>
                        <SkillSearch dropdown onAdd={addJobPostSkill} skills={formData.jobPost.skills} size="sm" />
                        {
                          formData.jobPost.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {formData.jobPost.skills.map((skill, idx) => (
                                <span 
                                  className="inline-flex items-center text-sm text-primary bg-primary/10 py-0.5 px-2 rounded font-medium" 
                                  key={idx}
                                >
                                  {skill.name}
                                  <span 
                                    className="cursor-pointer" 
                                    onClick={() => removeJobPostSkill(skill)}
                                  >
                                    <FaXmark className="text-sm ml-1" />
                                  </span>
                                </span>
                              ))}
                            </div>
                          )
                        }
                      </div>
                      <div className="mb-3">
                        <label className="block text-[0.8125rem] mb-1" htmlFor="type">Type</label>
                        <select 
                          className="select w-full h-auto py-1 [&:has(option[hidden]:checked)]:text-gray-400 *:text-base-content"
                          id="type" 
                          onChange={e => onFormDataChange({ 
                            ...formData, 
                            jobPost: { ...formData.jobPost, type: e.target.value } 
                          })}
                          value={formData.jobPost.type}
                        >
                          <option hidden value="">Select type</option>
                          <option value=""></option>
                          {Object.entries(EmploymentType).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[0.8125rem] mb-1" htmlFor="medium">Medium</label>
                        <select 
                          className="select w-full h-auto py-1 [&:has(option[hidden]:checked)]:text-gray-400 *:text-base-content"
                          id="medium" 
                          onChange={e => onFormDataChange({ 
                            ...formData, 
                            jobPost: { ...formData.jobPost, medium: e.target.value } 
                          })}
                          value={formData.jobPost.medium}
                        >
                          <option hidden value="">Select medium</option>
                          <option value=""></option>
                          {Object.entries(EmploymentMedium).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          }
          {
            (formData.type.length === 0 || formData.type.includes("Applicant")) && 
            (!filters || filters.includes("Applicant")) && (
              <div className="w-full">
                <div className="w-full">
                  <button 
                    className={`btn rounded-full h-auto py-1 leading-none ${formData.type.includes("Applicant") ? "btn-primary" : ""}`}
                    onClick={() => toggleFilterSection("Applicant")}
                    type="button"
                  >
                    Applicants
                  </button>
                </div>
                {formData.type.includes("Applicant") && (
                  <div className="mt-3">
                    <div>
                      <div className="flex flex-wrap gap-x-5 gap-y-3 items-center mb-3">
                        <div>
                          <input 
                            checked={formData.applicant.readyToWork}
                            className="checkbox checkbox-primary checkbox-sm rounded"
                            id="ready-to-work"
                            onChange={e => onFormDataChange({ 
                              ...formData, 
                              applicant: { ...formData.applicant, readyToWork: e.target.checked } 
                            })}
                            type="checkbox" 
                          />
                          <label htmlFor="ready-to-work" className="ml-3 align-middle text-sm">
                            Ready to Work?
                          </label>
                        </div>
                        <div className="grow basis-xs">
                          <label className="text-[0.8125rem] block mb-1" htmlFor="preferred-occupation">
                            Preferred Occupation
                          </label>
                          <input 
                            className="input input-sm text-sm w-full" 
                            id="preferred-occupation" 
                            onChange={e => onFormDataChange({ 
                              ...formData, 
                              applicant: { ...formData.applicant, preferredOccupation: e.target.value } 
                            })}
                            placeholder="Data Scientist" 
                            type="text" 
                            value={formData.applicant.preferredOccupation}
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-[0.8125rem] mb-1">Skills</p>
                        <SkillSearch dropdown onAdd={addApplicantSkill} skills={formData.applicant.skills} size="sm" />
                        {formData.applicant.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {formData.applicant.skills.map((skill, idx) => (
                              <span 
                                className="inline-flex items-center text-sm text-primary bg-primary/10 py-0.5 px-2 rounded font-medium" 
                                key={idx}
                              >
                                {skill.name}
                                <span 
                                  className="cursor-pointer" 
                                  onClick={() => removeApplicantSkill(skill)}
                                >
                                  <FaXmark className="text-sm ml-1" />
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mb-3">
                        <label className="text-[0.8125rem] block mb-1" htmlFor="industry">Industry</label>
                        <select 
                          id="industry" 
                          className="select w-full h-auto py-1 [&:has(option[hidden]:checked)]:text-gray-400 *:text-base-content"
                          onChange={e => onFormDataChange({ 
                            ...formData, 
                            applicant: { ...formData.applicant, industry: e.target.value } 
                          })}
                          value={formData.applicant.industry}
                        >
                          <option hidden value="">Select industry</option>
                          <option value=""></option>
                          {industries.map(industry => (
                            <option key={industry} value={industry}>{industry}</option>)
                          )}
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-3">  
                        <div className="flex-1 basis-48">
                          <label className="text-[0.8125rem] block mb-1" htmlFor="min-work-experience">
                            Min years of work experience
                          </label>
                          <input 
                            className="input input-sm text-sm w-full" 
                            id="min-work-experience" 
                            onChange={e => onFormDataChange({ 
                              ...formData, 
                              applicant: { ...formData.applicant, minWorkExperienceYears: e.target.value } 
                            })}
                            type="number" 
                            value={formData.applicant.minWorkExperienceYears}
                          />
                        </div>
                        <div className="flex-2 basis-48">
                          <label className="text-[0.8125rem] block mb-1" htmlFor="min-education-training-level">
                            Min level of education/training
                          </label>
                          <select 
                            id="min-education-training-level" 
                            className="select w-full h-8 [&:has(option[hidden]:checked)]:text-gray-400 *:text-base-content"
                            onChange={e => onFormDataChange({ 
                              ...formData, 
                              applicant: { ...formData.applicant, minEducationTrainingLevel: e.target.value } 
                            })}
                            value={formData.applicant.minEducationTrainingLevel}
                          >
                            <option hidden value="">Select level</option>
                            <option value=""></option>
                            <option value="CertificateOrLicense">Certificate/License</option>
                            <option value="Associate">Associate</option>
                            <option value="Bachelor">Bachelor</option>
                            <option value="Master">Master</option>
                            <option value="Doctorate">Doctorate</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          }
          {
            (formData.type.length === 0 || formData.type.includes("Employer")) && 
            (!filters || filters.includes("Employer")) && (
              <div className="w-full">
                <div className="w-full">
                  <button
                    className={`btn rounded-full h-auto py-1 leading-none ${formData.type.includes("Employer")? "btn-primary" : ""}`}
                    onClick={() => toggleFilterSection("Employer")}
                    type="button"
                  >
                    Employers
                  </button>
                </div>
                {formData.type.includes("Employer") && (
                  <div className="mt-3">
                    <div className="mb-3">
                      <label className="block text-[0.8125rem] mb-1" htmlFor="industry">Industry</label>
                      <select 
                        id="industry" 
                        className="select w-full h-auto py-1 [&:has(option[hidden]:checked)]:text-gray-400 *:text-base-content"
                        onChange={e => onFormDataChange({
                          ...formData,
                          employer: { ...formData.employer, industry: e.target.value }
                        })}
                        value={formData.employer.industry}
                      >
                        <option hidden value="">Select industry</option>
                        <option value=""></option>
                        {industries.map(industry => <option key={industry} value={industry}>{industry}</option>)}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-[0.8125rem] mb-1" htmlFor="size">Size</label>
                      <select 
                        id="size" 
                        className="select w-full h-auto py-1 [&:has(option[hidden]:checked)]:text-gray-400 *:text-base-content"
                        onChange={e => onFormDataChange({ 
                          ...formData, 
                          employer: { ...formData.employer, size: e.target.value } 
                        })}
                        value={formData.employer.size}
                      >
                        <option hidden value="">Select size</option>
                        <option value=""></option>
                        {Object.keys(employerSizeOptions).map((key, idx) => <option key={idx} value={key}>{key}</option>)}
                      </select>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm">Minimum rating</p>
                      <Rating 
                        onChange={e => changeEmployerMinRating(Math.max(1, Number(e.target.value)))}
                        size="sm"
                        value={formData.employer.minRating}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          }
        </div>
      </div>
      <div className="mt-5 flex justify-between px-1">
        <span className={`loading loading-ring loading-lg text-primary mr-auto ${isPending ? "visible" : "invisible"}`} />
        <div>
          <button className="btn btn-outline btn-primary mr-3">
            <MdFilterList className="text-lg" />Filter
          </button>
          <button 
            className="btn btn-outline btn-neutral" 
            disabled={disableClear}
            onClick={() => { setIsPending(true); onClear().finally(() => setIsPending(false)); }} 
            type="button"
          >
            <FaFilterCircleXmark />Clear
          </button>
        </div>
      </div>
    </form>
  )
}
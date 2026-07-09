"use client";

import { register } from "@/actions/api/auth";
import { RegisterFormData } from "@/types";
import { industries, employerSizeOptions } from "@/utils/constants";
import { useNavigationGuard } from "next-navigation-guard";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef, useActionState, startTransition } from "react";
import { FaChevronLeft, FaChevronRight, FaStoreAlt, FaBriefcase } from "react-icons/fa";

function Asterisk() {
  return <span className="text-red-500 inline-block translate-y-0.75 ml-1.5 scale-150 h-4">*</span>;
}

type RegisterFormErrors = Partial<Record<keyof RegisterFormData, string>>;

const initialFormData = {
  email: "",
  password: "",
  confirmPassword: "",
  phoneNumber: "",
  location: "",
  industry: "",
  employerName: "", 
  employerWebsite: "", 
  employerSize: "", 
  employerAbout: "",
  applicantFirstName: "",
  applicantMiddleName: "",
  applicantLastName: "",
  applicantLink1: "",
  applicantLink2: "",
  applicantPreferredOccupation: "",
  applicantReadyToWork: true
};

export default function RegisterForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(register, null);

  const [disableNext, setDisableNext] = useState(true);
  const [formData, setFormData] = useState<RegisterFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<RegisterFormErrors>({});
  const [hideMessage, setHideMessage] = useState(false);
  const [step, setStep] = useState(0);

  const formRef = useRef<HTMLFormElement>(null);

  const isDirty = formData !== initialFormData;
  useNavigationGuard({ enabled: isDirty, confirm: () => window.confirm("You have unsaved changes that will be lost.") });

  useEffect(() => {
    router.refresh();
  }, [])

  useEffect(() => {
    let isIncomplete = 
      !formData.email.trim() || 
      !formData.password.trim() || 
      !formData.confirmPassword.trim() || 
      !formData.phoneNumber.trim();

    if (step >= 1)
      isIncomplete ||= !formData.type;

    if (step === 2) {
      switch (formData.type) {
        case "Employer":
          isIncomplete ||= !formData.employerName.trim() || !formData.employerSize;
          break;
        case "Applicant":
          isIncomplete ||= !formData.applicantFirstName.trim() || !formData.applicantLastName.trim();
          break;
      }
    }

    setDisableNext(isIncomplete || Object.values(validate(formData)).some(v => v) || !formRef.current?.checkValidity());
  }, [step, formData])

  function handleBlur(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.name === "password") {
      const confirmPassword = e.target.form?.elements.namedItem("confirmPassword") as HTMLInputElement;
      
      if (confirmPassword.dataset.touched)
        setFormErrors(validate(formData));
    } else if (e.target.name === "confirmPassword") {
      const password = e.target.form?.elements.namedItem("password") as HTMLInputElement;
      
      if (password.dataset.touched)
        setFormErrors(validate(formData));
    }

    e.target.dataset.touched = "true";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const name = e.target.name as keyof RegisterFormData;
    let value;
    
    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox")
      value = e.target.checked;
    else
      value = name === "phoneNumber" ? e.target.value.replace(/[^\d+]/g, "") : e.target.value;

    const newFormData = { ...formData, [name]: value };

    setHideMessage(true);
    setFormData(newFormData);

    if (e.target.dataset.touched) {
      if (e.target.name === "password") {
        const confirmPassword = e.target.form?.elements.namedItem("confirmPassword") as HTMLInputElement;
        
        if (confirmPassword.dataset.touched)
          setFormErrors(validate(newFormData));
      } else if (e.target.name === "confirmPassword") {
        const password = e.target.form?.elements.namedItem("password") as HTMLInputElement;
        
        if (password.dataset.touched)
          setFormErrors(validate(newFormData));
      }
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!isPending) {
      setHideMessage(false);
      startTransition(() => formAction(formData));
    }
  }

  function validate(formData: RegisterFormData) {
    let errors: RegisterFormErrors = {};

    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match.";

    return errors;
  }

  return (
    <form className="mx-auto w-full max-w-6xl flex flex-col gap-7 grow" onSubmit={handleSubmit} ref={formRef}>
      <div className="flex place-content-between relative">
        {step > 0 && (
          <button 
            className="btn btn-square absolute left-0 top-0" 
            onClick={() => { setStep(step - 1); setHideMessage(true); }} 
            type="button"
          >
            <FaChevronLeft />
          </button>
        )}
        <ul className="steps mx-auto text-sm font-bold">
          {Array.from({ length: 3 }, (_, i) => <li className={`step ${step >= i ? "step-primary" : ""}`} key={i}></li>)}
        </ul>
        <div className="absolute right-0 top-0">
          <button 
            className={`btn btn-square ${step >= 2 ? "hidden" : ""}`} 
            disabled={disableNext} 
            onClick={() => { setStep(step + 1); setHideMessage(true); }} 
            type="button"
          >
            <FaChevronRight />
          </button>
          <button 
            className={`hidden btn btn-primary ${step >= 2 ? "md:flex" : ""}`} 
            disabled={step < 2 || disableNext || state?.success}
          >
            Submit
          </button>
        </div>
      </div>
      <div className="grow flex flex-col justify-center gap-y-5">
        <div className="my-auto">
          <div className={step === 0 ? "w-full block my-auto" : "hidden"}>
            <div>
              <label htmlFor="email" className="block text-sm mb-1">Email<Asterisk /></label>
              <input 
                className="input text-base w-full peer user-invalid:input-error" 
                id="email" 
                maxLength={256}
                name="email"
                onChange={handleChange}
                placeholder="email@example.com" 
                value={formData.email}
                type="email" 
              />
              <p className="invisible text-xs text-error pt-1 min-h-5 peer-user-invalid:visible">Email is invalid.</p>
            </div>
            <div className="flex flex-auto gap-x-4 flex-wrap group">
              <div className="grow basis-55 peer">
                <label htmlFor="password" className="block text-sm mb-1">Password<Asterisk /></label>
                <input 
                  className="input text-base w-full peer user-invalid:input-error" 
                  id="password" 
                  name="password"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$"
                  placeholder="Enter password" 
                  type="password" 
                  value={formData.password}
                />
                <p className="invisible text-xs text-error pt-1 mb-px h-5 peer-user-invalid:h-auto peer-user-invalid:visible">
                  Password must be 6+ characters, and contain both an upper and lowercase letter, number, and symbol.
                </p>
              </div>
              <div className={`grow basis-55 ${formErrors.confirmPassword ? "peer-has-valid:[&>input]:input-error peer-has-valid:[&>p]:visible" : ""}`}>
                <label htmlFor="confirmPassword" className="block text-sm mb-1">
                  Confirm Password<Asterisk />
                </label>
                <input 
                  className="input text-base w-full" 
                  id="confirmPassword" 
                  name="confirmPassword"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  type="password" 
                  value={formData.confirmPassword}
                />
                <p className="text-xs text-error pt-1 mb-px h-5 invisible">{formErrors.confirmPassword}</p>
              </div>
            </div>
            <div className="flex gap-x-4 flex-wrap">
              <div className="flex flex-auto gap-x-4 flex-wrap">  
                <div className="flex-1 basis-64">
                  <label htmlFor="phone" className="block text-sm mb-1">Phone Number<Asterisk /></label>
                  <input
                    className="tabular-nums input text-base w-full peer user-invalid:input-error"
                    id="phone"
                    maxLength={16}
                    name="phoneNumber"
                    onChange={handleChange}
                    pattern="^\+\d{9,15}$"
                    placeholder="+11234567890"
                    value={formData.phoneNumber}
                    type="tel"
                  />
                  <p className="invisible text-xs text-error pt-1 mb-px h-5 peer-user-invalid:visible">
                    Phone number is invalid.
                  </p>
                </div>
                <div className="flex-1 basis-64 mb-5">
                  <label htmlFor="industry" className="block text-sm mb-1">Industry</label>
                  <select 
                    className="select w-full text-base"
                    id="industry" 
                    name="industry"
                    onChange={handleChange}
                    value={formData.industry}
                  >
                    <option disabled={true} value="">Select industry</option>
                    {industries.map(industry => <option key={industry} value={industry}>{industry}</option>)}
                  </select>
                </div>
                <div className="flex-1 basis-64">
                  <label htmlFor="location" className="block text-sm mb-1">Location</label>
                  <input 
                    className="input text-base w-full" 
                    id="location" 
                    maxLength={200}
                    name="location"
                    onChange={handleChange}
                    placeholder="Los Angeles, California, United States"
                    value={formData.location}
                    type="text" 
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={step === 1 ? "w-full h-full flex flex-col md:h-auto md:my-auto" : "hidden"}>
            <p className="text-center text-gray-500 mb-5 md:mb-7">Choose the type of account you wish to create</p>
            <div className="flex flex-col gap-x-10 gap-y-5 grow md:flex-row md:justify-center">
              <label className="text-base-content/50 bg-base-content/8 w-full rounded-2xl p-4 flex justify-center place-items-center text-center text-base font-medium flex-col cursor-pointer has-checked:text-primary has-checked:bg-primary/15 hover:text-primary hover:bg-primary/15 max-md:flex-1 md:w-60 md:h-60">
                <input 
                  className="sr-only"
                  checked={formData.type === "Employer"}
                  onChange={handleChange}
                  name="type"
                  type="radio" 
                  value="Employer"
                />
                Employer
                <FaStoreAlt className="max-md:size-[15vh] md:text-9xl"  />
              </label>
              <label className="text-base-content/50 bg-base-content/8 w-full rounded-2xl p-4 flex justify-center place-items-center text-center text-base font-medium flex-col cursor-pointer has-checked:text-primary has-checked:bg-primary/15 hover:text-primary hover:bg-primary/15 max-md:flex-1 md:w-60 md:h-60">
                <input 
                  className="sr-only"
                  checked={formData.type === "Applicant"}
                  onChange={handleChange}
                  name="type"
                  type="radio" 
                  value="Applicant"
                />
                Applicant
                <FaBriefcase className="max-md:size-[15vh] md:text-9xl"  />
              </label>
            </div>
          </div>
          <div className={step === 2 && formData.type == "Employer" ? "w-full block my-auto" : "hidden"}>
            <div className="mb-5">
              <label htmlFor="name" className="block text-sm mb-1">Name<Asterisk /></label>
              <input 
                className="input text-base w-full" 
                id="name" 
                maxLength={250}
                name="employerName"
                onChange={handleChange}
                placeholder="Enter the employer name" 
                type="text" 
                value={formData.employerName}
              />
            </div>
            <div className="flex flex-col gap-5 md:flex-row">
              <div className="flex-auto">
                <div className="mb-2">
                  <label htmlFor="website" className="block text-sm mb-1">Website</label>
                  <input 
                    className="input text-base w-full peer user-invalid:input-error" 
                    id="website" 
                    name="employerWebsite"
                    onChange={handleChange}
                    placeholder="https://www.example.com"
                    type={formData.type !== "Employer" || step < 2 ? "text" : "url"} 
                    value={formData.employerWebsite}
                  />
                  <p className="invisible text-xs text-error pt-1 h-5 peer-user-invalid:visible">
                    Website is an invalid URL.
                  </p>
                </div>
                <div>
                  <p className="block text-sm mb-3 text-center font-medium">How large are you?</p>
                  <div className="flex gap-3 flex-wrap justify-center">
                    <div className="flex gap-3 flex-wrap justify-center">
                      {Object.keys(employerSizeOptions).slice(0, 4).map((key, idx) => (
                        <label 
                          className="has-not-checked:not-hover:border-base-content/45 has-not-checked:not-hover:bg-base-content/5 has-not-checked:not-hover:text-base-content/60 shrink-0 px-2 py-1 border rounded inline-block text-sm cursor-pointer font-bold bg-primary/10 text-primary border-primary"
                          key={idx}
                        >
                          <input 
                            checked={formData.employerSize === key} 
                            className="sr-only"
                            name="employerSize" 
                            onChange={handleChange} 
                            type="radio" 
                            value={key} 
                          /> 
                          {key}
                        </label> 
                      ))}
                    </div>
                    <div className="flex gap-3 flex-wrap justify-center">
                      {Object.keys(employerSizeOptions).slice(4).map((key, idx) => (
                        <label 
                          className="has-not-checked:not-hover:border-base-content/45 has-not-checked:not-hover:bg-base-content/5 has-not-checked:not-hover:text-base-content/60 shrink-0 px-2 py-1 border rounded inline-block text-sm cursor-pointer font-bold bg-primary/10 text-primary border-primary"
                          key={idx}
                        >
                          <input 
                            checked={formData.employerSize === key} 
                            className="sr-only"
                            name="employerSize" 
                            onChange={handleChange} 
                            type="radio" 
                            value={key} 
                          /> 
                          {key}
                        </label> 
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-auto shrink-0 basis-1/2 flex flex-col">
                <label htmlFor="about" className="block text-sm mb-1">About</label>
                <textarea 
                  className="textarea text-base w-full grow min-w-35 md:min-w-0" 
                  id="about" 
                  name="employerAbout"
                  onChange={handleChange}
                  placeholder="Describe yourself"
                  value={formData.employerAbout}
                />
              </div>
            </div>
          </div>
          <div className={step === 2 && formData.type == "Applicant" ? "block my-auto" : "hidden"}>
            <div className="mb-5">
              <p className="text-sm font-bold mb-1">Name</p>
              <div className="flex gap-5 flex-wrap">
                <div className="flex-auto">
                  <label className="block text-sm mb-1" htmlFor="firstName">First<Asterisk /></label>
                  <input 
                    className="input w-full text-base" 
                    id="firstName"
                    maxLength={50}
                    name="applicantFirstName"
                    onChange={handleChange}
                    placeholder="John" 
                    value={formData.applicantFirstName}
                    type="text"
                  />
                </div>
                <div className="flex-auto">
                  <label className="block text-sm mb-1" htmlFor="middleName">Middle</label>
                  <input 
                    className="input w-full text-base" 
                    id="middleName"
                    maxLength={50}
                    name="applicantMiddleName"
                    onChange={handleChange}
                    placeholder="William" 
                    value={formData.applicantMiddleName}
                    type="text"
                  />
                </div>
                <div className="flex-auto">
                  <label className="block text-sm mb-1" htmlFor="lastName">Last<Asterisk /></label>
                  <input 
                    className="input w-full text-base" 
                    id="lastName"
                    maxLength={50}
                    name="applicantLastName"
                    onChange={handleChange}
                    placeholder="Doe" 
                    value={formData.applicantLastName}
                    type="text"
                  />
                </div>
              </div>
            </div>
            <div className="mb-2">
              <p className="font-bold text-sm mb-1">Links</p>
              <div className="flex gap-x-5 flex-wrap">
                <div className="flex-auto">
                  <input 
                    className="input w-full text-base peer user-invalid:input-error"
                    id="link1" 
                    name="applicantLink1" 
                    onChange={handleChange}
                    placeholder="https://www.example.com"
                    type={formData.type !== "Applicant" || step < 2 ? "text" : "url"}
                    value={formData.applicantLink1}
                  />
                  <p className="invisible text-xs text-error pt-1 mb-1.25 h-5 peer-user-invalid:visible">
                    Link is an invalid URL.
                  </p>
                </div>
                <div className="flex-auto">
                  <input 
                    className="input w-full text-base peer user-invalid:input-error"
                    id="link2" 
                    name="applicantLink2" 
                    onChange={handleChange}
                    placeholder="https://www.example.com"
                    type={formData.type !== "Applicant" || step < 2 ? "text" : "url"}
                    value={formData.applicantLink2}
                  />
                  <p className="invisible text-xs text-error pt-1 mb-px h-5 peer-user-invalid:visible">
                    Link is an invalid URL.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex mx-auto justify-between items-end max-w-2xl gap-x-5 gap-y-2 flex-wrap">
              <div className="text-right mb-2">
                <input 
                  className="checkbox checkbox-primary"
                  id="readyToWork"
                  name="applicantReadyToWork"
                  onChange={handleChange}
                  checked={formData.applicantReadyToWork}
                  type="checkbox" 
                />
                <label htmlFor="readyToWork" className="text-sm ml-3">Ready to Work?</label>
              </div>
              <div className="flex-auto max-w-md">
                <label htmlFor="preferredOccupation" className="block text-sm mb-1">Preferred Occupation</label>
                <input 
                  className="input text-base w-full" 
                  id="preferredOccupation" 
                  maxLength={100}
                  name="applicantPreferredOccupation"
                  onChange={handleChange}
                  placeholder="Data Scientist"
                  type="text" 
                  value={formData.applicantPreferredOccupation}
                />
              </div>
            </div>
          </div>
          <p className="text-center mt-7 min-h-7 md:mt-10">
            {isPending ? (
              <span className="loading loading-ring loading-lg text-primary" />
            ) : state?.message && !state.success && !hideMessage && (
              <span className="text-error bg-error/15 rounded font-medium py-0.5 px-3 inline-block">
                {state.message}
              </span>
            )}
          </p>
        </div>
        {step >= 2 && (
          <div className="text-center">
            <button className="btn btn-primary md:hidden" disabled={disableNext || state?.success}>
              Submit
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
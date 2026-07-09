"use client"

import { updateUserProfile } from "@/actions/api/user";
import SkillSearch from "@/components/SkillSearch";
import { 
  ApplicantDetail, 
  ApplicantProfileFormData, 
  ApplicantProfileFormDataBase, 
  AuthenticatedUser, 
  CertificateOrLicenseFormData, 
  EducationEntryFormData, 
  FormState, 
  User, 
  WorkExperienceEntryFormData 
} from "@/types";
import { industries, months } from "@/utils/constants";
import { preventSubmitOnEnter } from "@/utils/utils";
import { useNavigationGuard } from "next-navigation-guard";
import Link from "next/link";
import { useState, useRef, useEffect, useMemo, useActionState, startTransition } from "react";
import { FaEyeSlash, FaEye, FaPlus, FaSave } from "react-icons/fa";
import { MdRemove, MdRemoveCircle } from "react-icons/md";

function Asterisk() {
  return <span className="text-red-500 inline-block translate-y-0.75 ml-1.5 scale-150 h-4">*</span>;
}

interface MonthYearInputProps {
  error?: string;
  month: React.ComponentProps<"select">;
  year: React.ComponentProps<"input">;
}

function MonthYearInput({ error, month, year }: MonthYearInputProps) {
  const { id, ...rest } = month;

  return (
    <>
      <div className="join flex w-full peer">
        <select 
          className={`select join-item min-w-0 w-inherit text-base pt-px ${error ? "input-error" : ""} [&:has(option[hidden]:checked)]:text-base-content/40 *:text-base-content sm:hidden`}
          {...rest}
        >
          <option hidden value={0}>Select month</option>
          <option value={0}></option>
          {months.map((month, idx) => <option key={idx} value={idx + 1}>{month.slice(0, 3)}</option>)}
        </select>
        <select 
          className={`select join-item hidden min-w-32 w-inherit text-base pt-px ${error ? "input-error" : ""} [&:has(option[hidden]:checked)]:text-base-content/40 *:text-base-content sm:flex`}
          id={id}
          {...rest}
        >
          <option hidden value={0}>Select month</option>
          <option value={0}></option>
          {months.map((month, idx) => <option key={idx} value={idx + 1}>{month}</option>)}
        </select>
        <input 
          className={`input join-item text-base min-w-10 max-w-20 text-center ${error ? "input-error" : ""} max-[25rem]:not-any-pointer-fine:text-left min-[25rem]:not-any-pointer-fine:pr-5`} 
          max={2100}
          min={1900}
          placeholder="Year" 
          type="number" 
          {...year}
        />
      </div>
      <p className="text-xs text-error pt-1 min-h-5.5">{error}</p>
    </>
  )
}

type ApplicantFormErrors = Partial<Record<keyof ApplicantProfileFormDataBase, string>> & {
  workExperience: Partial<Record<keyof WorkExperienceEntryFormData, string>>[];
  education: Partial<Record<keyof EducationEntryFormData, string>>[];
  certificationsAndLicenses: Partial<Record<keyof CertificateOrLicenseFormData, string>>[];
};

type ApplicantFormTouched = Partial<Record<keyof ApplicantProfileFormDataBase, boolean>> & {
  workExperience: Partial<Record<keyof WorkExperienceEntryFormData, boolean>>[];
  education: Partial<Record<keyof EducationEntryFormData, boolean>>[];
  certificationsAndLicenses: Partial<Record<keyof CertificateOrLicenseFormData, boolean>>[];
};

export function toFormData(applicant: ApplicantDetail) {
  return {
    type: "Applicant" as const,
    location: applicant.location ?? "",
    industry: applicant.industry ?? "",
    firstName: applicant.firstName,
    middleName: applicant.middleName ?? "",
    lastName: applicant.lastName,
    link1: applicant.link1 ?? "",
    link2: applicant.link2 ?? "",
    preferredOccupation: applicant.preferredOccupation ?? "",
    about: applicant.about ?? "",
    readyToWork: applicant.readyToWork,
    isPrivate: applicant.isPrivate,
    workExperience: applicant.workExperience.map(entry => ({
      id: entry.id,
      employer: entry.employer ?? "",
      position: entry.position,
      startMonth: entry.startMonth ? entry.startMonth.toString() : "0",
      startYear: entry.startYear.toString(),
      endMonth: entry.endMonth ? entry.endMonth.toString() : "0",
      endYear: entry.endYear?.toString() ?? "",
      description: entry.description ?? ""
    })),
    education: applicant.education.map(entry => ({
      id: entry.id,
      institution: entry.institution,
      institutionLocation: entry.institutionLocation ?? "",
      startMonth: entry.startMonth ? entry.startMonth.toString() : "0",
      startYear: entry.startYear.toString(),
      endMonth: entry.endMonth ? entry.endMonth.toString() : "0",
      endYear: entry.endYear?.toString() ?? "",
      degree: entry.degree ?? "",
      major: entry.major ?? ""
    })),
    certificationsAndLicenses: applicant.certificationsAndLicenses.map(entry => ({
      id: entry.id,
      name: entry.name,
      issuer: entry.issuer,
      issuedMonth: entry.issuedMonth ? entry.issuedMonth.toString() : "0",
      issuedYear: entry.issuedYear.toString(),
      expirationMonth: entry.expirationMonth ? entry.expirationMonth.toString() : "0",
      expirationYear: entry.expirationYear?.toString() ?? "",
      description: entry.description ?? ""
    })),
    skills: applicant.skills.map(skill => ({ id: skill.id, name: skill.name }))
  }
}

export default function ApplicantEditProfile({ applicant, user }: { applicant: ApplicantDetail, user: AuthenticatedUser }) {
  const [state, formAction, isPending] = useActionState<FormState<User> | null, ApplicantProfileFormData>(
    (state, formData) => updateUserProfile(state, applicant.id, formData), 
    null
  );

  const [formData, setFormData] = useState<ApplicantProfileFormData>(toFormData(applicant));
  const [formErrors, setFormErrors] = useState<ApplicantFormErrors>({
    workExperience: formData.workExperience.map(entry => validateWorkExperienceEntry(entry)),
    education: formData.education.map(entry => validateEducationEntry(entry)),
    certificationsAndLicenses: formData.certificationsAndLicenses.map(certificateOrLicense => 
      validateCertificateOrLicense(certificateOrLicense)
    ),
  });
  const [hideMessage, setHideMessage] = useState(false);
  const [savedFormData, setSavedFormData] = useState(formData);
  const [touched, setTouched] = useState<ApplicantFormTouched>({
    workExperience: formData.workExperience.map(() => ({})),
    education: formData.education.map(() => ({})),
    certificationsAndLicenses: formData.certificationsAndLicenses.map(() => ({})),
  });

  const formRef = useRef<HTMLFormElement>(null);

  const isDirty = useMemo(() => formData !== savedFormData, [formData]);
  useNavigationGuard({ enabled: isDirty, confirm: () => window.confirm("You have unsaved changes that will be lost.") });

  const disableSubmit = useMemo(() => {
    if (!isDirty)
      return true;

    if (!formRef.current?.checkValidity())
      return true;
    if (!formData.firstName.trim() || !formData.lastName.trim())
      return true;

    const isWorkExperienceIncomplete = formData.workExperience
      .some(entry => !entry.position.trim() || !entry.startYear.trim() || isNaN(Number(entry.startYear)));

    if (isWorkExperienceIncomplete)
      return true;

    const isEducationIncomplete = formData.education
      .some(entry => !entry.institution.trim() || !entry.startYear.trim() || isNaN(Number(entry.startYear)))

    if (isEducationIncomplete)
      return true;

    const areCertificationsAndLicensesIncomplete = formData.certificationsAndLicenses
      .some(certificateOrLicense => 
        !certificateOrLicense.name.trim() ||
        !certificateOrLicense.issuer.trim() ||
        !certificateOrLicense.issuedYear.trim() ||
        isNaN(Number(certificateOrLicense.issuedYear))
      );

    if (areCertificationsAndLicensesIncomplete)
      return true;
    
    const workExperienceErrors = formData.workExperience.map(entry => validateWorkExperienceEntry(entry));
    
    if (workExperienceErrors.some(entry => Object.values(entry).some(e => e)))
      return true;
    
    if (formData.education.map(entry => validateEducationEntry(entry)).some(entry => Object.values(entry).some(e => e)))
      return true;

    const certificationsAndLicensesErrors = formData.certificationsAndLicenses
      .map(entry => validateCertificateOrLicense(entry));
    
    if (certificationsAndLicensesErrors.some(certificateOrLicense => Object.values(certificateOrLicense).some(e => e)))
      return true;

    return false;
  }, [isDirty, formData]);

  useEffect(() => {
    setSavedFormData(toFormData(applicant));
  }, [applicant])

  useEffect(() => {
    setHideMessage(false);

    if (state?.success && state.data?.type === "Applicant") {
      const formData = toFormData({ ...applicant, ...state.data });
      setFormData(formData);
      setSavedFormData(formData);
    }
  }, [state])

  function addCertificationOrLicense() {
    const newCertificateOrLicense = {
      name: "",
      issuer: "",
      issuedMonth: "0",
      issuedYear: "",
      expirationMonth: "0",
      expirationYear: "",
      description: ""
    };

    modifyFormData({ 
      ...formData, 
      certificationsAndLicenses: [newCertificateOrLicense, ...formData.certificationsAndLicenses] 
    });
    setFormErrors({ ...formErrors, certificationsAndLicenses: [{}, ...formErrors.certificationsAndLicenses] });
    setTouched({ ...touched, certificationsAndLicenses: [{}, ...touched.certificationsAndLicenses] });
  }

  function addEducationEntry() {
    const newEntry = {
      institution: "",
      institutionLocation: "",
      startMonth: "0",
      startYear: "",
      endMonth: "0",
      endYear: "",
      degree: "",
      major: ""
    };

    modifyFormData({ ...formData, education: [newEntry, ...formData.education] });
    setFormErrors({ ...formErrors, education: [{}, ...formErrors.education] });
    setTouched({ ...touched, education: [{}, ...touched.education] });
  }

  function addWorkExperienceEntry() {
    const newEntry = {
      position: "",
      employer: "",
      startMonth: "0",
      startYear: "",
      endMonth: "0",
      endYear: "",
      description: ""
    };

    modifyFormData({ ...formData, workExperience: [newEntry, ...formData.workExperience] });
    setFormErrors({ ...formErrors, workExperience: [{}, ...formErrors.workExperience] });
    setTouched({ ...touched, workExperience: [{}, ...touched.workExperience] });
  }

  function handleCertificateOrLicenseBlur(
    idx: number,
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const name = e.target.name as keyof CertificateOrLicenseFormData;
    const certificateOrLicenseErrors = formErrors.certificationsAndLicenses.slice();
    const certificateOrLicenseTouched = touched.certificationsAndLicenses.slice();

    certificateOrLicenseErrors[idx] = validateCertificateOrLicense(formData.certificationsAndLicenses[idx]);
    certificateOrLicenseTouched[idx] = { ...certificateOrLicenseTouched[idx], [name]: true };

    setFormErrors({ ...formErrors, certificationsAndLicenses: certificateOrLicenseErrors });
    setTouched({ ...touched, certificationsAndLicenses: certificateOrLicenseTouched });
  }

  function handleCertificateOrLicenseChange(
    idx: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const name = e.target.name as keyof CertificateOrLicenseFormData;
    const certificationsAndLicenses = formData.certificationsAndLicenses.slice();
    certificationsAndLicenses[idx] = { ...certificationsAndLicenses[idx], [name]: e.target.value };

    modifyFormData({ ...formData, certificationsAndLicenses });

    if (touched.certificationsAndLicenses[idx][name]) {
      const certificateOrLicenseErrors = formErrors.certificationsAndLicenses.slice();
      certificateOrLicenseErrors[idx] = validateCertificateOrLicense(certificationsAndLicenses[idx]);
      setFormErrors({ ...formErrors, certificationsAndLicenses: certificateOrLicenseErrors });
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox")
      modifyFormData({ ...formData, [e.target.name]: e.target.checked });
    else
      modifyFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleEducationBlur(
    idx: number,
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const name = e.target.name as keyof EducationEntryFormData;
    const educationErrors = formErrors.education.slice();
    const educationTouched = touched.education.slice();

    educationErrors[idx] = validateEducationEntry(formData.education[idx]);
    educationTouched[idx] = { ...educationTouched[idx], [name]: true };

    setFormErrors({ ...formErrors, education: educationErrors });
    setTouched({ ...touched, education: educationTouched });
  }

  function handleEducationChange(
    idx: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const name = e.target.name as keyof EducationEntryFormData;
    const education = formData.education.slice();
    education[idx] = { ...education[idx], [name]: e.target.value };

    modifyFormData({ ...formData, education });
    
    if (touched.education[idx][name]) {
      const educationErrors = formErrors.education.slice();
      educationErrors[idx] = validateEducationEntry(education[idx]);
      setFormErrors({ ...formErrors, education: educationErrors });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!isPending)
      startTransition(() => formAction(formData));
  }

  function handleWorkExperienceBlur(
    idx: number, 
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const name = e.target.name as keyof WorkExperienceEntryFormData;
    const workExperienceErrors = formErrors.workExperience.slice();
    const workExperienceTouched = touched.workExperience.slice();

    workExperienceErrors[idx] = validateWorkExperienceEntry(formData.workExperience[idx]);
    workExperienceTouched[idx] = { ...workExperienceTouched[idx], [name]: true };

    setFormErrors({ ...formErrors, workExperience: workExperienceErrors });
    setTouched({ ...touched, workExperience: workExperienceTouched });
  }

  function handleWorkExperienceChange(
    idx: number, 
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const name = e.target.name as keyof WorkExperienceEntryFormData;
    const workExperience = formData.workExperience.slice();
    workExperience[idx] = { ...workExperience[idx], [name]: e.target.value };
    
    modifyFormData({ ...formData, workExperience });
    
    if (touched.workExperience[idx][name]) {
      const workExperienceErrors = formErrors.workExperience.slice();
      workExperienceErrors[idx] = validateWorkExperienceEntry(workExperience[idx]);
      setFormErrors({ ...formErrors, workExperience: workExperienceErrors });
    }
  }

  function modifyFormData(formData: ApplicantProfileFormData) {
    setHideMessage(true);
    setFormData(formData);
  }

  function removeCertificationOrLicense(idx: number) {
    const certificationsAndLicenses = formData.certificationsAndLicenses.filter(entry => {
      return entry !== formData.certificationsAndLicenses[idx]
    });
    const errors = formErrors.certificationsAndLicenses.slice();
    const newTouched = touched.certificationsAndLicenses.slice();

    errors.splice(idx, 1);
    newTouched.splice(idx, 1);

    modifyFormData({ ...formData, certificationsAndLicenses });
    setFormErrors({ ...formErrors, certificationsAndLicenses: errors });
    setTouched({ ...touched, certificationsAndLicenses: newTouched });
  }

  function removeEducationEntry(idx: number) {
    const education = formData.education.filter(entry => entry !== formData.education[idx]);
    const errors = formErrors.education.slice();
    const newTouched = touched.education.slice();

    errors.splice(idx, 1);
    newTouched.splice(idx, 1);

    modifyFormData({ ...formData, education });
    setFormErrors({ ...formErrors, education: errors });
    setTouched({ ...touched, education: newTouched });
  }

  function removeWorkExperienceEntry(idx: number) {
    const workExperience = formData.workExperience.filter(entry => entry !== formData.workExperience[idx]);
    const errors = formErrors.workExperience.slice();
    const newTouched = touched.workExperience.slice();

    errors.splice(idx, 1);
    newTouched.splice(idx, 1);

    modifyFormData({ ...formData, workExperience });
    setFormErrors({ ...formErrors, workExperience: errors });
    setTouched({ ...touched, workExperience: newTouched });
  }

  function revert() {
    setFormData(savedFormData);
    setFormErrors({
      workExperience: savedFormData.workExperience.map(entry => validateWorkExperienceEntry(entry)),
      education: savedFormData.education.map(entry => validateEducationEntry(entry)),
      certificationsAndLicenses: savedFormData.certificationsAndLicenses.map(certificateOrLicense => 
        validateCertificateOrLicense(certificateOrLicense)
      )
    });
    setTouched({
      workExperience: savedFormData.workExperience.map(() => ({})),
      education: savedFormData.education.map(() => ({})),
      certificationsAndLicenses: savedFormData.certificationsAndLicenses.map(() => ({}))
    });
  }

  function validateCertificateOrLicense(formData: CertificateOrLicenseFormData) {
    let errors: Partial<Record<keyof CertificateOrLicenseFormData, string>> = {};
    
    const issuedYear = Number(formData.issuedYear);
    const expirationYear = Number(formData.expirationYear);

    if (formData.issuedYear) {
      if (isNaN(issuedYear) || issuedYear < 1900 || issuedYear > 2100)
        errors.issuedYear = "Year must be between 1900 and 2100";
    }

    if (formData.expirationYear) {
      if (isNaN(expirationYear) || expirationYear < 1900 || expirationYear > 2100)
        errors.expirationYear = "Year must be between 1900 and 2100";
    }

    if (!errors.expirationYear && !errors.issuedYear) {
      if (formData.issuedYear && formData.expirationYear && !isNaN(issuedYear) && !isNaN(expirationYear)) {
        if (issuedYear > expirationYear) {
          errors.issuedYear = "Invalid date range.";
        } else if (issuedYear === expirationYear) {
          const issuedMonth = Number(formData.issuedMonth);
          const expirationMonth = Number(formData.expirationMonth);
  
          if (issuedMonth && expirationMonth && issuedMonth > expirationMonth)
            errors.issuedMonth = "Invalid date range.";
        }
      }
    }

    return errors;
  }

  function validateEducationEntry(formData: EducationEntryFormData) {
    let errors: Partial<Record<keyof EducationEntryFormData, string>> = {};

    const startYear = Number(formData.startYear);
    const endYear = Number(formData.endYear);

    if (formData.startYear) {
      if (isNaN(startYear) || startYear < 1900 || startYear > 2100)
        errors.startYear = "Year must be between 1900 and 2100";
    }
    
    if (formData.endYear) {
      if (isNaN(endYear) || endYear < 1900 || endYear > 2100)
        errors.endYear = "Year must be between 1900 and 2100";
    }

    if (!errors.startYear && !errors.endYear) {
      if (formData.startYear && formData.endYear && !isNaN(startYear) && !isNaN(endYear)) {
        if (startYear > endYear) {
          errors.startYear = "Invalid date range.";
        } else if (startYear === endYear) {
          const startMonth = Number(formData.startMonth);
          const endMonth = Number(formData.endMonth);
  
          if (startMonth && endMonth && startMonth > endMonth)
            errors.startMonth = "Invalid date range.";
        }
      }
    }

    return errors;
  }

  function validateWorkExperienceEntry(formData: WorkExperienceEntryFormData) {
    let errors: Partial<Record<keyof WorkExperienceEntryFormData, string>> = {};

    const startYear = Number(formData.startYear);
    const endYear = Number(formData.endYear);

    if (formData.startYear) {
      if (isNaN(startYear) || startYear < 1900 || startYear > 2100)
        errors.startYear = "Year must be between 1900 and 2100";
    }
    
    if (formData.endYear) {
      if (isNaN(endYear) || endYear < 1900 || endYear > 2100)
        errors.endYear = "Year must be between 1900 and 2100";
    }

    if (!errors.startYear && !errors.endYear) {
      if (formData.startYear && formData.endYear && !isNaN(startYear) && !isNaN(endYear)) {
        if (startYear > endYear) {
          errors.startYear = "Invalid date range.";
        } else if (startYear === endYear) {
          const startMonth = Number(formData.startMonth);
          const endMonth = Number(formData.endMonth);
  
          if (startMonth && endMonth && startMonth > endMonth)
            errors.startMonth = "Invalid date range.";
        }
      }
    }

    return errors;
  }

  return (
    <form onKeyDown={preventSubmitOnEnter} onSubmit={handleSubmit} ref={formRef}>
      <div className="max-w-6xl w-full mx-auto px-5 pb-5 md:px-10 md:pb-10">
        <div className="mb-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <input 
                checked={formData.readyToWork}
                className="checkbox checkbox-primary"
                id="ready-to-work"
                name="readyToWork"
                onChange={handleChange}
                type="checkbox" 
              />
              <label htmlFor="ready-to-work" className="ml-3 align-middle inline-block mt-px">Ready to Work?</label>
            </div>
            <div className="flex items-center">
              <p className="text-sm text-base-content/60 mr-3 w-32 text-right inline-block">
                {formData.isPrivate ? (
                  <><span className="font-bold">Private:</span> Profile is only visible to you</>
                ) : (
                  <><span className="font-bold">Public:</span> Profile is visible to everyone</>
                )}
              </p>
              <label className={`btn btn-square ${!formData.isPrivate ? "btn-primary" : ""}`}>
                <input
                  checked={formData.isPrivate}
                  className="hidden"
                  name="isPrivate"
                  onChange={handleChange}
                  type="checkbox"
                />
                {formData.isPrivate ? <FaEyeSlash /> : <FaEye />}
              </label>
            </div>
          </div>
          <div className="mb-5">
            <p className="text-sm font-bold mb-px">Name</p>
            <div className="flex flex-wrap gap-5">
              <div className="flex-1 min-w-fit">
                <label className="text-sm block mb-1" htmlFor="firstName">First<Asterisk /></label>
                <input 
                  className="w-full input text-base"
                  id="firstName"
                  maxLength={50}
                  name="firstName"
                  onChange={handleChange}
                  type="text" 
                  value={formData.firstName} 
                />
              </div>
              <div className="flex-1 min-w-fit">
                <label className="text-sm block mb-1" htmlFor="middleName">Middle</label>
                <input 
                  className="w-full input text-base"
                  id="middleName"
                  maxLength={50}
                  name="middleName"
                  onChange={handleChange}
                  type="text" 
                  value={formData.middleName} 
                />
              </div>
              <div className="flex-1 min-w-fit">
                <label className="text-sm block mb-1" htmlFor="lastName">Last<Asterisk /></label>
                <input 
                  className="w-full input text-base"
                  id="lastName"
                  maxLength={50}
                  name="lastName"
                  onChange={handleChange}
                  type="text" 
                  value={formData.lastName} 
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 mb-5">
            <div className="flex-1 min-w-fit">
              <label className="text-sm block mb-1" htmlFor="location">Location</label>
              <input 
                className="w-full input text-base"
                onChange={handleChange}
                maxLength={200}
                name="location"
                id="location" 
                placeholder="Los Angeles, California, United States"
                type="text" 
                value={formData.location}
              />
            </div>
            <div className="flex-1 min-w-fit">
              <label className="text-sm block mb-1" htmlFor="location">Industry</label>
              <select 
                className="select w-full text-base [&:has(option[hidden]:checked)]:text-base-content/40 *:text-base-content"
                id="industry" 
                name="industry"
                onChange={handleChange}
                value={formData.industry}
              >
                <option hidden value="">Select industry</option>
                <option value=""></option>
                {industries.map(industry => <option key={industry} value={industry}>{industry}</option>)}
              </select>
            </div>      
            <div className="flex-1 min-w-fit">
              <label className="text-sm block mb-1" htmlFor="preferred-occupation">Preferred Occupation</label>
              <input 
                className="w-full input text-base"
                id="preferred-occupation" 
                maxLength={100}
                name="preferredOccupation"
                onChange={handleChange}
                placeholder="Data Scientist"
                type="text" 
                value={formData.preferredOccupation}
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold mb-1">Links</p>
            <div className="flex flex-wrap gap-x-5">
              <div className="flex-1 min-w-fit">
                <input 
                  className="input text-base w-full peer user-invalid:input-error"
                  id="link1" 
                  name="link1"
                  onChange={handleChange}
                  placeholder="https://www.example.com"
                  type="url" 
                  value={formData.link1} 
                />
                <p className="invisible text-xs text-error pt-1 h-6 peer-user-invalid:visible">
                  Invalid URL.
                </p>
              </div>
              <div className="flex-1 min-w-fit">
                <input 
                  className="input text-base w-full peer user-invalid:input-error"
                  id="link2" 
                  name="link2"
                  onChange={handleChange}
                  placeholder="https://www.example.com"
                  type="url" 
                  value={formData.link2} 
                />
                <p className="invisible text-xs text-error pt-1 h-6 peer-user-invalid:visible">
                  Invalid URL.
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm block mb-1" htmlFor="about">About</label>
            <textarea 
              className="textarea text-base w-full" 
              id="about" 
              name="about"
              onChange={handleChange}
              placeholder="Describe yourself"
              rows={4}
              value={formData.about}
            />
          </div>
        </div>
        <div className="mb-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">Work Experience</h2>
            <button className="btn btn-outline btn-primary" onClick={addWorkExperienceEntry} type="button">
              <FaPlus />Add
            </button>
          </div>
          <div>
            {formData.workExperience.map((entry, idx) => (
              <div className="border border-base-content/20 p-4 rounded-xl mb-5 relative" key={idx}>
                <button 
                  className="btn border-base-content/20 bg-base-100 btn-xs btn-circle absolute top-0 right-0 translate-x-1/2! -translate-y-1/2!"
                  onClick={() => removeWorkExperienceEntry(idx)}
                  type="button"  
                >
                  <MdRemove className="text-lg" />
                </button>
                <div className="mb-3">
                  <label className="text-sm block mb-1" htmlFor={`work-experience-position-${idx}`}>
                    Position<Asterisk />
                  </label>
                  <input 
                    className="w-full input text-base"
                    id={`work-experience-position-${idx}`} 
                    maxLength={200}
                    name="position"
                    onChange={e => handleWorkExperienceChange(idx, e)} 
                    placeholder="Software Engineer"
                    type="text" 
                    value={entry.position} 
                  />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-3">
                  <div className="grow">
                    <label className="text-sm block mb-1" htmlFor={`work-experience-employer-${idx}`}>
                      Employer
                    </label>
                    <input 
                      className="input text-base w-full"
                      id={`work-experience-employer-${idx}`} 
                      maxLength={250}
                      name="employer"
                      onChange={e => handleWorkExperienceChange(idx, e)}
                      placeholder="Microsoft"
                      type="text" 
                      value={entry.employer} 
                    />
                  </div>
                  <div className="flex justify-center flex-1 gap-x-5 gap-y-3 min-w-fit mx-auto">
                    <div>
                      <label className="text-sm block mb-1" htmlFor={`work-experience-start-${idx}`}>
                        Start<Asterisk />
                      </label>
                      <MonthYearInput 
                        error={formErrors.workExperience[idx].startYear || formErrors.workExperience[idx].startMonth}
                        month={{  
                          id: `work-experience-start-${idx}`,
                          name: "startMonth",
                          onBlur: e => handleWorkExperienceBlur(idx, e),
                          onChange: e => handleWorkExperienceChange(idx, e),
                          value: entry.startMonth
                        }}
                        year={{
                          name: "startYear",
                          onBlur: e => handleWorkExperienceBlur(idx, e),
                          onChange: e => handleWorkExperienceChange(idx, e),
                          value: entry.startYear
                        }}
                      />
                    </div>  
                    <div>
                      <label className="text-sm block mb-1" htmlFor={`work-experience-end-${idx}`}>
                        End
                      </label>
                      <MonthYearInput 
                        error={formErrors.workExperience[idx].endYear}
                        month={{  
                          id: `work-experience-end-${idx}`,
                          name: "endMonth",
                          onBlur: e => handleWorkExperienceBlur(idx, e),
                          onChange: e => handleWorkExperienceChange(idx, e),
                          value: entry.endMonth
                        }}
                        year={{
                          name: "endYear",
                          onBlur: e => handleWorkExperienceBlur(idx, e),
                          onChange: e => handleWorkExperienceChange(idx, e),
                          value: entry.endYear
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm block mb-1" htmlFor={`work-experience-description-${idx}`}>
                    Description
                  </label>
                  <textarea 
                    className="textarea text-base w-full" 
                    id={`work-experience-description-${idx}`}
                    name="description"
                    onChange={e => handleWorkExperienceChange(idx, e)}
                    placeholder="Describe the position, including any responsibilites and accomplishments"
                    rows={3}
                    value={entry.description}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">Education</h2>
            <button className="btn btn-outline btn-primary" onClick={addEducationEntry} type="button">
              <FaPlus />Add
            </button>
          </div>
          <div>
            {formData.education.map((entry, idx) => (
              <div className="border border-base-content/20 p-4 rounded-xl mb-5 relative" key={idx}>
                <button 
                  className="btn border-base-content/20 bg-base-100 btn-xs btn-circle absolute top-0 right-0 translate-x-1/2! -translate-y-1/2!"
                  onClick={() => removeEducationEntry(idx)} 
                  type="button"
                >
                  <MdRemove className="text-lg"/>
                </button>
                <div>
                  <label className="text-sm block mb-1" htmlFor={`education-institution-${idx}`}>
                    Institution<Asterisk />
                  </label>
                  <input 
                    className="w-full input text-base mb-3"
                    id={`education-institution-${idx}`} 
                    maxLength={200}
                    name="institution"
                    onChange={e => handleEducationChange(idx, e)} 
                    placeholder="Harvard University"
                    type="text" 
                    value={entry.institution} 
                  />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-3">
                  <div className="grow">
                    <label className="text-sm block mb-1" htmlFor={`education-location-${idx}`}>Location</label>
                    <input 
                      className="w-full input text-base"
                      id={`education-location-${idx}`} 
                      maxLength={200}
                      name="institutionLocation"
                      onChange={e => handleEducationChange(idx, e)} 
                      placeholder="Cambrdige, Massachusetts, United States"
                      type="text" 
                      value={entry.institutionLocation} 
                    />
                  </div>
                  <div className="flex justify-center gap-x-5 gap-y-3 min-w-fit mx-auto">
                    <div>
                      <label className="text-sm block mb-1" htmlFor={`education-start-${idx}`}>
                        Start<Asterisk />
                      </label>
                      <MonthYearInput 
                        error={formErrors.education[idx].startYear || formErrors.education[idx].startMonth}
                        month={{  
                          id: `education-start-${idx}`,
                          name: "startMonth",
                          onBlur: e => handleEducationBlur(idx, e),
                          onChange: e => handleEducationChange(idx, e),
                          value: entry.startMonth
                        }}
                        year={{
                          name: "startYear",
                          onBlur: e => handleEducationBlur(idx, e),
                          onChange: e => handleEducationChange(idx, e),
                          value: entry.startYear
                        }}
                      />
                    </div>  
                    <div>
                      <label className="text-sm block mb-1" htmlFor={`education-end-${idx}`}>
                        End
                      </label>
                      <MonthYearInput 
                        error={formErrors.education[idx].endYear}
                        month={{  
                          id: `education-end-${idx}`,
                          name: "endMonth",
                          onBlur: e => handleEducationBlur(idx, e),
                          onChange: e => handleEducationChange(idx, e),
                          value: entry.endMonth
                        }}
                        year={{
                          name: "endYear",
                          onBlur: e => handleEducationBlur(idx, e),
                          onChange: e => handleEducationChange(idx, e),
                          value: entry.endYear
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-5">
                  <div className="flex-1 min-w-fit">
                    <label className="text-sm block mb-1" htmlFor={`education-major-${idx}`}>Major</label>
                    <input 
                      className="input text-base w-full" 
                      id={`education-major-${idx}`} 
                      maxLength={100}
                      name="major"
                      onChange={e => handleEducationChange(idx, e)}
                      placeholder="Computer Science"
                      type="text" 
                      value={entry.major} 
                    />
                  </div>
                  <div className="flex-1 min-w-fit">
                    <label className="text-sm block mb-1" htmlFor={`education-degree-${idx}`}>Degree</label>
                    <input 
                      className="input text-base w-full" 
                      id={`education-degree-${idx}`} 
                      maxLength={100}
                      name="degree"
                      onChange={e => handleEducationChange(idx, e)}
                      placeholder="Bachelor of Science"
                      type="text" 
                      value={entry.degree} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">Certifications & Licenses</h2>
            <button className="btn btn-outline btn-primary" onClick={addCertificationOrLicense} type="button">
              <FaPlus />Add
            </button>
          </div>
          <div>
            {formData.certificationsAndLicenses.map((certificateOrLicense, idx) => (
              <div className="border border-base-content/20 p-4 rounded-xl mb-5 relative" key={idx}>
                <button 
                  className="btn border-base-content/20 bg-base-100 btn-xs btn-circle absolute top-0 right-0 translate-x-1/2! -translate-y-1/2!"
                  onClick={() => removeCertificationOrLicense(idx)}
                  type="button"
                > 
                  <MdRemove className="text-lg" />
                </button>
                <div className="mb-3">
                  <label className="text-sm block mb-1" htmlFor={`certification-or-license-name-${idx}`}>
                    Name<Asterisk />
                  </label>
                  <input 
                    className="input text-base w-full"
                    id={`certification-or-license-name-${idx}`}
                    maxLength={200}
                    name="name"
                    onChange={e => handleCertificateOrLicenseChange(idx, e)} 
                    placeholder="CompTIA+ Security" 
                    type="text" 
                    value={certificateOrLicense.name} 
                  />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-3">
                  <div className="grow">
                    <label className="text-sm block mb-1" htmlFor={`certification-or-license-name-${idx}`}>
                      Issuer<Asterisk />
                    </label>
                    <input 
                      className="input text-base w-full"
                      id={`certification-or-license-issuer-${idx}`}
                      maxLength={200}
                      name="issuer"
                      onChange={e => handleCertificateOrLicenseChange(idx, e)} 
                      placeholder="Computing Technology Industry Association (CompTIA)" 
                      type="text" 
                      value={certificateOrLicense.issuer} 
                    />
                  </div>
                  <div className="flex justify-center gap-x-5 gap-y-3 min-w-fit mx-auto">
                    <div>
                      <label className="text-sm block mb-1" htmlFor={`certificate-or-license-issued-${idx}`}>
                        Issued<Asterisk />
                      </label>
                      <MonthYearInput 
                        error={
                          formErrors.certificationsAndLicenses[idx].issuedYear || 
                          formErrors.certificationsAndLicenses[idx].issuedMonth
                        }
                        month={{  
                          id: `certificate-or-license-issued-${idx}`,
                          name: "issuedMonth",
                          onBlur: e => handleCertificateOrLicenseBlur(idx, e),
                          onChange: e => handleCertificateOrLicenseChange(idx, e),
                          value: certificateOrLicense.issuedMonth
                        }}
                        year={{
                          name: "issuedYear",
                          onBlur: e => handleCertificateOrLicenseBlur(idx, e),
                          onChange: e => handleCertificateOrLicenseChange(idx, e),
                          value: certificateOrLicense.issuedYear
                        }}
                      />
                    </div>  
                    <div>
                      <label className="text-sm block mb-1" htmlFor={`certificate-or-license-expiration-${idx}`}>
                        Expiration
                      </label>
                      <MonthYearInput 
                        error={formErrors.certificationsAndLicenses[idx].expirationYear}
                        month={{  
                          id: `certificate-or-license-expiration-${idx}`,
                          name: "expirationMonth",
                          onBlur: e => handleCertificateOrLicenseBlur(idx, e),
                          onChange: e => handleCertificateOrLicenseChange(idx, e),
                          value: certificateOrLicense.expirationMonth
                        }}
                        year={{
                          name: "expirationYear",
                          onBlur: e => handleCertificateOrLicenseBlur(idx, e),
                          onChange: e => handleCertificateOrLicenseChange(idx, e),
                          value: certificateOrLicense.expirationYear
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm block mb-1" htmlFor={`certification-or-license-description-${idx}`}>
                    Description
                  </label>
                  <textarea 
                    className="textarea text-base w-full" 
                    id={`certification-or-license-description-${idx}`} 
                    name="description"
                    onChange={e => handleCertificateOrLicenseChange(idx, e)} 
                    placeholder="Describe the certification/license"
                    rows={3} 
                    value={certificateOrLicense.description}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-5">Skills</h2>
          <div className="flex flex-col items-start gap-x-10 gap-y-5 md:flex-row">
            <SkillSearch 
              onAdd={skill => modifyFormData({ ...formData, skills: [skill, ...formData.skills] })}
              skills={formData.skills} 
            />
            <div className="flex flex-wrap gap-2.5">
              {formData.skills.map((skill, idx) => (
                <span 
                  className="px-2 py-1 text-primary bg-primary/10 rounded inline-flex items-center font-medium" 
                  key={idx}
                >
                  <button 
                    className="mr-1 rounded-full cursor-pointer" 
                    onClick={() => modifyFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) })} 
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
      </div>
      <div className="flex flex-col justify-between items-center flex-wrap sticky bottom-0 p-3 gap-x-5 gap-y-3 bg-base-100 z-1 border-t border-t-base-content/20 text-right md:flex-row">
        {isPending && <span className="loading loading-ring loading-lg text-primary ml-2" />}
        {!isPending && state?.message && !hideMessage && (
          <span className={`${state.success ? "bg-success/15 text-success": "bg-error/15 text-error"} inline-block rounded font-medium py-0.5 px-3 ml-1`}>
            {state.message}
          </span>
        )}
        <div className="flex justify-end grow">
          <button className="btn mr-3" disabled={isPending || !isDirty} onClick={revert} type="button">Revert</button>
          <button className="btn btn-primary mr-3" disabled={disableSubmit}>
            <FaSave />Save
          </button>
          <Link className="btn btn-neutral" href={`/profile${user.id !== applicant.id ? "/" + applicant.id : ""}`}>
            Done
          </Link>
        </div>
      </div>
    </form>
  )
}
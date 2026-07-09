import { Skill } from ".";
import { ApplicantJobApplication, AuthenticatedJobPost, JobPost, JobPostBase } from "./job";
import { ApplicantReview } from "./review";

export type AuthenticatedApplicant = ApplicantWithAuthInfo & AuthInfo;
export type AuthenticatedEmployer = EmployerWithAuthInfo & AuthInfo;

export type AuthenticatedUser = 
  { type: undefined; } & UserBase & AuthInfo | 
  AuthenticatedApplicant | 
  AuthenticatedEmployer;

interface AuthInfo {
  email: string;
  phoneNumber: string;
  roles: ("Admin" | "User")[]; 
}

export interface CertificateOrLicense {
  id?: number,
  name: string;
  issuer: string;
  issuedMonth: number | null;
  issuedYear: number;
  expirationMonth: number | null;
  expirationYear: number | null;
  description: string | null;
}

export interface CertificateOrLicenseFormData {
  id?: number,
  name: string;
  issuer: string;
  issuedMonth: string;
  issuedYear: string;
  expirationMonth: string;
  expirationYear: string;
  description: string;
}

export interface EducationEntry {
  id?: number;
  institution: string;
  major: string | null;
  startMonth: number | null;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  institutionLocation: string | null;
  degree: string | null;
}

export interface EducationEntryFormData {
  id?: number,
  institution: string;
  institutionLocation: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  degree: string;
  major: string;
}

export interface ProfileFormDataBase {
  location: string;
  industry: string;
}

export interface ApplicantProfileFormDataBase extends ProfileFormDataBase {
  type: "Applicant";
  firstName: string;
  middleName: string;
  lastName: string;
  link1: string;
  link2: string;
  preferredOccupation: string;
  about: string;
  readyToWork: boolean;
  isPrivate: boolean;
}

export interface ApplicantProfileFormData extends ApplicantProfileFormDataBase {
  workExperience: WorkExperienceEntryFormData[];
  education: EducationEntryFormData[];
  certificationsAndLicenses: CertificateOrLicenseFormData[];
  skills: { id?: number, name: string; }[];
}

export interface EmployerProfileFormData extends ProfileFormDataBase {
  type: "Employer";
  name: string;
  website: string;
  size: string;
  about: string;
}

export type User = { type: undefined; } & UserBase | Applicant | Employer;

export interface UserBase {
  location: string | null;
  industry: string | null;
  id: string;
}

export interface Applicant extends UserBase {
  type: "Applicant";
  firstName: string;
  middleName: string | null;
  lastName: string;
  link1: string | null;
  link2: string | null;
  preferredOccupation: string | null;
  isPrivate: boolean;
  readyToWork: boolean;
  about: string | null;
  workExperience: WorkExperienceEntry[];
  education: EducationEntry[];
  certificationsAndLicenses: CertificateOrLicense[];
  skills: Skill[];
  following: Employer[];
}

export interface ApplicantDetail extends Applicant {
  reviews: ApplicantReview[];
}

interface ApplicantWithAuthInfo extends ApplicantDetail {
  applications: ApplicantJobApplication[];
  saved: JobPost[];
}

export interface BaseAuthenticatedUser extends UserBase {
  type: undefined;
  email: string; 
  phoneNumber: string;
}

export interface Employer extends UserBase {
  type: "Employer";
  name: string;
  website: string | null;
  about: string | null;
  sizeRangeLowEnd: number | null;
  sizeRangeHighEnd: number | null;
  jobPosts: JobPostBase[];
  averageRating: number | null;
}

interface EmployerWithAuthInfo extends Employer {
  jobPosts: AuthenticatedJobPost[];
};

export type UserDetail = { type: undefined; } & UserBase | ApplicantDetail | Employer;

export interface WorkExperienceEntry {
  id?: number;
  position: string;
  employer: string | null;
  startMonth: number | null;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  description: string | null;
}

export interface WorkExperienceEntryFormData {
  id?: number,
  employer: string;
  position: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  description: string; 
}
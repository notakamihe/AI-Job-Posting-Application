import { Skill } from ".";
import { Applicant, Employer } from "./user";

export enum EmploymentMedium {
  Onsite = "On-site",
  Hybrid = "Hybrid",
  Remote = "Remote"
}

export enum EmploymentType {
  FullTime = "Full-time",
  PartTime = "Part-time",
  Contract = "Contract",
  Freelance = "Freelance",
  Internship = "Internship",
  Seasonal = "Seasonal",
  Apprenticeship = "Apprenticeship"
}

export interface JobApplicationBase {
  answers: JobApplicationQuestionAnswer[];
}

export interface ApplicantJobApplication extends JobApplicationBase {
  jobPost: JobPost;
}

export interface JobPostJobApplication extends JobApplicationBase {
  applicant: Applicant;
}

export interface JobApplication extends JobPostJobApplication {
  jobPost: JobPost;
}

export interface JobApplicationQuestion {
  id: number;
  question: string;
  type: JobApplicationQuestionType;
  isRequired: boolean;
}

export interface JobApplicationQuestionAnswer {
  question: JobApplicationQuestion;
  answer: string;
}

interface JobApplicationQuestionFormData {
  id?: number;
  question: string;
  type: string;
  isRequired: boolean;
}

export enum JobApplicationQuestionType {
  Text = "Text",
  Number = "Number",
  TextArea = "TextArea",
  Binary = "Binary"
}

export interface JobPostBase {
  id: number;
  title: string;
  summary: string;
  postedAt: string;
  payLowEnd: number | null;
  payHighEnd: number | null;
  medium: EmploymentMedium | null;
  schedule: string;
  employmentType: EmploymentType;
  qualifications: { id: number; description: string; }[];
  responsibilities: { id: number; description: string; }[];
  skillsWanted: Skill[];
  additionalDetails: string | null;
  applicationQuestions: JobApplicationQuestion[];
}

export interface JobPost extends JobPostBase {
  employer: Employer;
}

export interface AuthenticatedJobPost extends JobPost {
  applications: JobPostJobApplication[];
}

export interface JobPostFormData {
  title: string;
  summary: string;
  payLowEnd: string;
  payHighEnd: string;
  medium: string;
  employmentType: string;
  schedule: string;
  qualifications: { id?: number; description: string; }[];
  responsibilities: { id?: number; description: string; }[];
  skillsWanted: { id?: number; name: string; }[];
  additionalDetails: string;
  applicationQuestions: JobApplicationQuestionFormData[];
}
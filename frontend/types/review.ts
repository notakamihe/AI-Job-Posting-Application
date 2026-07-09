import { Employer, Applicant } from "./user";

export interface ReviewBase {
  id: number;
  rating: number;
  title: string;
  description: string;
}

export interface ApplicantReview extends ReviewBase { 
  employer: Employer; 
};

export interface EmployerReview extends ReviewBase { 
  reviewer: Applicant; 
};

export interface Review extends EmployerReview {
  employer: Employer; 
}

export interface ReviewFormData {
  employerId: string;
  rating: number;
  title: string;
  description: string;
}
import { JobPost } from "./job";
import { User } from "./user";

export interface DiscoverFilterFormData {
  location: string;
  jobPost: {
    before: string;
    after: string;
    minPay: string;
    type: string;
    medium: string;
    skills: Skill[]
  };
  applicant: {
    readyToWork: boolean;
    preferredOccupation: string;
    industry: string;
    minWorkExperienceYears: string;
    minEducationTrainingLevel: string;
    skills: Skill[];
  };
  employer: { industry: string; size: string; minRating: number; };
  type: ("JobPost" | "Employer" | "Applicant")[];
}

export type EntityQueryResult = { type: "JobPost" } & JobPost | User;

export interface Skill {
  id?: number;
  name: string;
}

export * from "./api";
export * from "./auth";
export * from "./chat";
export * from "./job";
export * from "./review";
export * from "./user";
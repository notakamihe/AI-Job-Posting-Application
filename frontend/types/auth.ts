export interface ChangePasswordFormData {
  password: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  location: string;
  industry: string;
  type?: "Employer" | "Applicant";
  employerName: string;
  employerWebsite: string;
  employerSize: string;
  employerAbout: string;
  applicantFirstName: string;
  applicantMiddleName: string;
  applicantLastName: string;
  applicantLink1: string;
  applicantLink2: string;
  applicantPreferredOccupation: string;
  applicantReadyToWork: boolean;
}
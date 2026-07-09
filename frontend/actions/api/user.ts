"use server"

import { JobApplication, UserDetail, User,  Applicant, Review, AuthenticatedUser, FormState, ApplicantProfileFormData, EmployerProfileFormData, ProblemDetails } from "@/types";
import { API_URL } from "@/utils/api";
import { employerSizeOptions } from "@/utils/constants";
import { revalidateTag } from "next/cache";
import { fetchWithAuth } from "./auth";
import { cache } from "react";
import { redirect, RedirectType } from "next/navigation";

export interface JobApplicationFormData {
  answers: { questionId: number; answer: string; }[];
}

export async function applyToJob(applicantId: string, jobPostId: number, formData: JobApplicationFormData) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${applicantId}/applications/${jobPostId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: formData.answers.filter(answer => answer.answer) })
    });

    if (response.ok) {
      const application: JobApplication = await response.json();

      revalidateTag("post");
      revalidateTag("user");
      return { success: true, message: "Application saved successfully.", data: application };
    } else {
      throw new Error(JSON.stringify(await response.json()));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to apply to job." }
  }
}

export async function deleteUser(id: string) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${id}`, { method: "DELETE" });

    if (!response.ok)
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to delete user." };
  }

  redirect("/discover", RedirectType.replace);
}

export async function followEmployer(applicantId: string, employerId: string) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${applicantId}/follow/${employerId}`, { 
      method: "PUT" 
    });

    if (response.ok) {
      revalidateTag("user");
      return { success: true, message: "Successfully followed employer." };
    } else {
      throw new Error(JSON.stringify(await response.json()));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to follow employer." };
  }
}

async function getAuthUser(): Promise<AuthenticatedUser | null> {
  const response = await fetchWithAuth(`${API_URL}/api/Users/me`, { method: "GET", next: { tags: ["user"] } });
  
  if (response.ok)
    return await response.json();

  return null;
}

export const cachedGetAuthUser = cache(getAuthUser);

export async function getFollowers(employerId: string): Promise<{ results: Applicant[]; totalCount: number; }> {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${employerId}/followers`, { method: "GET" });

    if (response.ok)
      return await response.json();
    else
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error);
    return { results: [], totalCount: 0 };
  }
}

export async function getJobApplications(userId: string): Promise<{ results: JobApplication[]; totalCount: number; }> {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${userId}/applications`, { method: "GET" });

    if (response.ok)
      return await response.json();
    else
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error);
    return { results: [], totalCount: 0 };
  }
}

export async function getReviews(userId: string): Promise<{ results: Review[]; totalCount: number; }> {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${userId}/reviews`, { method: "GET" });

    if (response.ok)
      return await response.json();
    else
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error);
    return { results: [], totalCount: 0 };
  }
}

export async function getUser(id: string) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${id}`, { method: "GET", next: { tags: ["user"] } });
  
    if (response.ok) {
      const user: UserDetail = await response.json();
      return user;
    } else {
      const error: ProblemDetails = await response.json();

      if (error.type.endsWith("private-user"))
        return null;
      else
        throw new Error(JSON.stringify(error));
    }
  } catch (error: unknown) {
    console.error(error);
    return undefined;
  }
}

export async function getUsers(ids: string[]) {
  const searchParams = new URLSearchParams();

  for (const id of ids)
    searchParams.append("id", id);

  const response = await fetch(`${API_URL}/api/Users?${searchParams.toString()}`, { method: "GET" });

  if (response.ok) {
    const users: User[] = await response.json();
    return users;
  }

  return [];
}

export async function removeJobApplication(applicantId: string, jobPostId: number) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${applicantId}/applications/${jobPostId}`, { 
      method: "DELETE" 
    });

    if (response.ok) {
      revalidateTag("post");
      revalidateTag("user");
      return { success: true, message: "Successfully remove job application." };
    } else {
      throw new Error(JSON.stringify(await response.json()));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to remove job application." }
  }
}

export async function saveJobPost(applicantId: string, jobPostId: number) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${applicantId}/save/${jobPostId}`, { method: "PUT" });

    if (response.ok) {
      revalidateTag("user");
      return { success: true, message: "Successfully saved job post." };
    } else {
      throw new Error(JSON.stringify(await response.json()));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to save job post." }
  }
}

export async function unfollowEmployer(applicantId: string, employerId: string) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${applicantId}/follow/${employerId}`, { 
      method: "DELETE" 
    });

    if (response.ok) {
      revalidateTag("user");
      return { success: true, message: "Successfully unfollowed employer." };
    } else {
      throw new Error(JSON.stringify(await response.json()));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to unfollow employer." };
  }
}

export async function unsaveJobPost(applicantId: string, jobPostId: number) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${applicantId}/save/${jobPostId}`, { method: "DELETE" });

    if (response.ok) {
      revalidateTag("user");
      return { success: true, message: "Successfully unsaved job post." };
    } else {
      throw new Error(JSON.stringify(await response.json()));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to unsave job post." };
  }
}

export async function updateUserEmail(id: string, email: string) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${id}/email`, { 
      method: "PUT", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      revalidateTag("user");
      return { success: true, message: "Email updated successfully." };
    } else {
      const error: ProblemDetails = await response.json();

      if (response.status === 400) {
        const keys = error.errors ? Object.keys(error.errors) : [];
  
        if (keys.length > 0)
          return { success: false, message: error.errors![keys[0]][0] };
        if (error.detail)
          return { success: false, message: error.detail };
      }

      throw new Error(JSON.stringify(error));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to update email." };
  }
}

export async function updateUserPhoneNumber(id: string, phoneNumber: string) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Users/${id}/phone`, { 
      method: "PUT", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber })
    });

    if (response.ok) {
      revalidateTag("user");
      return { success: true, message: "Phone number updated successfully." };
    } else {
			const error: ProblemDetails = await response.json();

			if (error.detail)
				return { success: false, message: error.detail };

      throw new Error(JSON.stringify(await response.json()));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to update phone number." };
  }
}

export type ProfileFormData = ApplicantProfileFormData | EmployerProfileFormData;

export async function updateUserProfile(previousState: FormState<User> | null, id: string, formData: ProfileFormData) {
  try {
    let body;

    if (formData.type === "Applicant") {
      body = {
        type: "Applicant", 
        location: formData.location, 
        industry: formData.industry,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        link1: formData.link1 || null,
        link2: formData.link2 || null,
        preferredOccupation: formData.preferredOccupation,
        readyToWork: formData.readyToWork,
        isPrivate: formData.isPrivate,
        about: formData.about,
        workExperience: formData.workExperience.map(entry => ({
          id: entry.id,
          employer: entry.employer,
          position: entry.position,
          startMonth: Number(entry.startMonth) > 0 ? Number(entry.startMonth) : null,
          startYear: Number(entry.startYear),
          endMonth: Number(entry.endMonth) > 0 ? Number(entry.endMonth) : null,
          endYear: entry.endYear ? Number(entry.endYear) : null,
          description: entry.description
        })),
        education: formData.education.map(entry => ({
          id: entry.id,
          institution: entry.institution,
          institutionLocation: entry.institutionLocation,
          startMonth: Number(entry.startMonth) > 0 ? Number(entry.startMonth) : null,
          startYear: Number(entry.startYear),
          endMonth: Number(entry.endMonth) > 0 ? Number(entry.endMonth) : null,
          endYear: entry.endYear ? Number(entry.endYear) : null,
          major: entry.major,
          degree: entry.degree
        })),
        certificationsAndLicenses: formData.certificationsAndLicenses.map(entry => ({
          id: entry.id,
          name: entry.name,
          issuer: entry.issuer,
          issuedMonth: Number(entry.issuedMonth) > 0 ? Number(entry.issuedMonth) : null,
          issuedYear: Number(entry.issuedYear),
          expirationMonth: Number(entry.expirationMonth) > 0 ? Number(entry.expirationMonth) : null,
          expirationYear: entry.expirationYear ? Number(entry.expirationYear) : null,
          description: entry.description
        })),
        skills: formData.skills.map(skill => ({ id: skill.id, name: skill.name }))
      };
    } else {
      body = {
        type: "Employer", 
        location: formData.location, 
        industry: formData.industry,
        name: formData.name,
        website: formData.website || null,
        sizeRangeLowEnd: employerSizeOptions[formData.size].low,
        sizeRangeHighEnd: employerSizeOptions[formData.size].high,
        about: formData.about
      };
    }

    const response = await fetchWithAuth(`${API_URL}/api/Users/${id}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const updated: UserDetail = await response.json();
      revalidateTag("user");
      return { success: true, message: "Profile successfully updated!", data: updated };
    } else {
      throw new Error(JSON.stringify(await response.json()));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to update profile." };
  }
}
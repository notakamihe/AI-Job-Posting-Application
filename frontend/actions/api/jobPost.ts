"use server"

import { FormState, JobPost, JobPostJobApplication, JobPostFormData } from "@/types";
import { API_URL } from "@/utils/api";
import { revalidateTag } from "next/cache";
import { fetchWithAuth } from "./auth";

export async function createJobPost(previousState: FormState<JobPost> | null, formData: JobPostFormData) {
  const body = {
    title: formData.title,
    summary: formData.summary,
    payLowEnd: formData.payLowEnd ? Number(formData.payLowEnd) : null,
    payHighEnd: formData.payHighEnd ? Number(formData.payHighEnd) : null,
    medium: formData.medium || null,
    employmentType: formData.employmentType,
    schedule: formData.schedule,
    qualifications: formData.qualifications,
    responsibilities: formData.responsibilities,
    skillsWanted: formData.skillsWanted,
    additionalDetails: formData.additionalDetails,
    applicationQuestions: formData.applicationQuestions
  };

  try {
    const response = await fetchWithAuth(`${API_URL}/api/JobPosts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const created: JobPost = await response.json();
      return { success: true, message: "Job post created successfully!", data: created };
    } else {
      throw new Error(JSON.stringify(await response.json()))
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to create job post." };
  } 
}

export async function deleteJobPost(id: number) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/JobPosts/${id}`, { method: "DELETE" });

    if (!response.ok)
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to delete job post." };
  }
}

export async function getApplicationsByJobPost(id: number): Promise<{ 
  results: JobPostJobApplication[]; 
  totalCount: number 
}> {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/JobPosts/${id}/applications`, { method: "GET" });
  
    if (response.ok)
      return await response.json();
    else
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error);
    return { results: [], totalCount: 0 };
  }
}

export async function getJobPost(id: number): Promise<JobPost | null> {
  try {
    const response = await fetch(`${API_URL}/api/JobPosts/${id}`, { method: "GET", next: { tags: ["post"] } });
  
    if (response.ok)
      return await response.json();
    else
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error)
    return null;
  }
}

export async function getSimilarJobPosts(id: number): Promise<JobPost[]> {
  try {
    const response = await fetch(`${API_URL}/api/JobPosts/${id}/similar`, { 
      method: "GET",  
      next: { tags: ["jobPost"] } 
    });
  
    if (response.ok)
      return await response.json();
    else
      throw new Error(JSON.stringify(await response.json()));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function updateJobPost(previousState: FormState<JobPost> | null, id: number, formData: JobPostFormData) {
  const body = {
    title: formData.title,
    summary: formData.summary,
    payLowEnd: formData.payLowEnd ? Number(formData.payLowEnd) : null,
    payHighEnd: formData.payHighEnd ? Number(formData.payHighEnd) : null,
    medium: formData.medium || null,
    employmentType: formData.employmentType,
    schedule: formData.schedule,
    qualifications: formData.qualifications,
    responsibilities: formData.responsibilities,
    skillsWanted: formData.skillsWanted,
    additionalDetails: formData.additionalDetails,
    applicationQuestions: formData.applicationQuestions
  };
  
  try {
    const response = await fetchWithAuth(`${API_URL}/api/JobPosts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    if (response.ok) {
      const updated: JobPost = await response.json();
      revalidateTag("post");
      return { success: true, message: "Job post successfully updated!", data: updated };
    } else {
      throw new Error(JSON.stringify(await response.json()));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to update job post." }
  }
}
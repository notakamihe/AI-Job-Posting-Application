"use server"

import { DiscoverFilterFormData, EntityQueryResult, PaginatedResults } from "@/types";
import { API_URL } from "@/utils/api";
import { getValidToken } from "./auth";
import { employerSizeOptions } from "@/utils/constants";

function appendDiscoverFilterParams(searchParams: URLSearchParams, formData: Partial<DiscoverFilterFormData>) {
  if (formData.location)
    searchParams.append("location", formData.location);

  if (formData.type) {
    for (const type of formData.type)
      searchParams.append("type", type);

    if (formData.type.includes("JobPost") && formData.jobPost) {
      if (formData.jobPost.before)
        searchParams.append("jobPost.before", formData.jobPost.before)
      if (formData.jobPost.after)
        searchParams.append("jobPost.after", formData.jobPost.after)
      if (formData.jobPost.minPay && !isNaN(Number(formData.jobPost.minPay)))
        searchParams.append("jobPost.minPay", formData.jobPost.minPay)
      if (formData.jobPost.type)
        searchParams.append("jobPost.type", formData.jobPost.type);
      if (formData.jobPost.medium)
        searchParams.append("jobPost.medium", formData.jobPost.medium);
      
      for (const skill of formData.jobPost.skills)
        searchParams.append("jobPost.skillWanted", skill.name);
    }

    if (formData.type.includes("Applicant") && formData.applicant) {
      if (formData.applicant.readyToWork)
        searchParams.append("applicant.isReadyToWork", "true");
      if (formData.applicant.preferredOccupation)
        searchParams.append("applicant.preferredOccupation", formData.applicant.preferredOccupation);
      if (formData.applicant.industry)
        searchParams.append("applicant.industry", formData.applicant.industry);
      if (formData.applicant.minWorkExperienceYears && !isNaN(Number(formData.applicant.minWorkExperienceYears)))
        searchParams.append("applicant.minWorkExperienceYears", formData.applicant.minWorkExperienceYears);
      if (formData.applicant.minEducationTrainingLevel)
        searchParams.append("applicant.minEducationOrTrainingLevel", formData.applicant.minEducationTrainingLevel);

      for (const skill of formData.applicant.skills)
        searchParams.append("applicant.skill", skill.name);
    }

    if (formData.type.includes("Employer") && formData.employer) {
      if (formData.employer.industry)
        searchParams.append("employer.industry", formData.employer.industry);

      if (formData.employer.size) {
        if (employerSizeOptions[formData.employer.size].low !== null)
          searchParams.append("employer.minSize", employerSizeOptions[formData.employer.size].low!.toString())
        if (employerSizeOptions[formData.employer.size].high !== null)
          searchParams.append("employer.maxSize", employerSizeOptions[formData.employer.size].high!.toString())
      }

      if (formData.employer.minRating > 0)
        searchParams.append("employer.minRating", formData.employer.minRating.toString());
    }
  }
}

export async function getDiscoverResults(
  formData?: DiscoverFilterFormData, 
  page?: number,
  pageSize?: number
): Promise<PaginatedResults<EntityQueryResult>> {
  const searchParams = new URLSearchParams();

  if (formData)
    appendDiscoverFilterParams(searchParams, formData);
  if (page)
    searchParams.append("page", page.toString())
  if (pageSize)
    searchParams.append("pageSize", pageSize.toString())

  try {
    const token = await getValidToken();
    const response = await fetch(`${API_URL}/api/Discover?${searchParams.toString()}`, { 
      method: "GET", 
      headers: { "Authorization": "Bearer " + token }  
    });
    
    if (response.ok)
      return await response.json();
    else
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error);
    return { results: [], page: 1, pageCount: 0, totalCount: 0 };
  }
}

export async function getSearchResults(
  term: string, 
  formData?: Partial<DiscoverFilterFormData>, 
  page?: number, 
  pageSize?: number
): Promise<PaginatedResults<EntityQueryResult>> {
  const searchParams = new URLSearchParams();
  searchParams.append("term", term);

  if (formData)
    appendDiscoverFilterParams(searchParams, formData);
  if (page)
    searchParams.append("page", page.toString());
  if (pageSize)
    searchParams.append("pageSize", pageSize.toString());

  try {
    const token = await getValidToken();
    const response = await fetch(`${API_URL}/api/Discover/search?${searchParams.toString()}`, { 
      method: "GET",
      headers: { "Authorization": "Bearer " + token }
    });
    
    if (response.ok)
      return await response.json();
    else
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error);
    return { results: [], page: 1, pageCount: 0, totalCount: 0 };
  }
}
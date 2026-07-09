"use server"

import { Skill } from "@/types";
import { API_URL } from "@/utils/api";

interface SkillsQueryParams  { 
  contains?: string; 
  exclude?: string[], 
  limit?: number; 
}

export async function getSkills(params?: SkillsQueryParams): Promise<Skill[]> {
  const searchParams = new URLSearchParams();

  if (params?.contains)
    searchParams.append("contains", params.contains);

  if (params?.exclude) {
    for (const skill of params.exclude)
      searchParams.append("exclude", skill);
  }

  if (params?.limit)
    searchParams.append("limit", params.limit.toString());

  try {
    const response = await fetch(`${API_URL}/api/Skills?${searchParams.toString()}`, { method: "GET" });
  
    if (response.ok)
      return await response.json();
    else
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error);
    return [];
  }
}
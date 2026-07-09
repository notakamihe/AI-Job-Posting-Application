"use server"

import { API_URL } from "@/utils/api";
import { fetchWithAuth } from "./auth";
import { Chat } from "@/types";

export async function getChats(userIds: string[] = []): Promise<Chat[]> {
  try {
    const searchParams = new URLSearchParams();

    for (const id of userIds)
      searchParams.append("withUser", id);

    const response = await fetchWithAuth(`${API_URL}/api/Chats?${searchParams.toString()}`);
  
    if (response.ok)
      return await response.json();
    else
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error);
    return [];
  }
}
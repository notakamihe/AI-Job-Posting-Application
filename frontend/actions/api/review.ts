"use server"

import { FormState, Review, ReviewFormData } from "@/types";
import { API_URL } from "@/utils/api";
import { revalidateTag } from "next/cache";
import { fetchWithAuth } from "./auth";

export async function createReview(previousState: FormState | null, formData: ReviewFormData) {
  const data = { 
    employerId: formData.employerId,
    rating: formData.rating,
    title: formData.title,
    description: formData.description
  };

  try {
    const response = await fetchWithAuth(`${API_URL}/api/Reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const review: Review = await response.json();
      revalidateTag("user");
      return { success: true, data: review };
    } else {
      throw new Error(JSON.stringify(await response.json()));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to add review" };
  }
}

export async function deleteReview(id: number) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Reviews/${id}`, { method: "DELETE" });

    if (response.ok) {
      revalidateTag("user");
      return { success: true, message: "Successfully deleted review." };
    } else {
      throw new Error(JSON.stringify(await response.json()));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to delete review." };
  }
}

export async function updateReview(previousState: FormState | null, id: number, formData: ReviewFormData) {
  const data = { 
    employerId: formData.employerId,
    rating: formData.rating,
    title: formData.title,
    description: formData.description
  };

  try {
    const response = await fetchWithAuth(`${API_URL}/api/Reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      revalidateTag("user");
      return { success: true, message: "Review updated successfully." };
    } else {
      throw new Error(JSON.stringify(await response.json()));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to update review." };
  }
}
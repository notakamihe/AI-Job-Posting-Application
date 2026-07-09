"use server"

import { ChangePasswordFormData, FormState, ProblemDetails, RegisterFormData } from "@/types";
import { API_URL } from "../../utils/api";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { employerSizeOptions } from "@/utils/constants";

export async function changePassword(formData: ChangePasswordFormData) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Auth/changePassword`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: formData.password, newPassword: formData.newPassword })
    });
    
    if (response.ok) {
      return { success: true, message: "Successfully changed password!" };
    } else {
      const error: ProblemDetails = await response.json();

			if (response.status === 400) {
				const keys = error.errors ? Object.keys(error.errors) : [];
	
				if (keys.length > 0)
					return { success: false, message: error.errors![keys[0]][0] };
				else if (error.detail)
					return { success: false, message: error.detail };
			}
      
			throw new Error(JSON.stringify(error));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to change password." };
  }
}

export async function deleteAccount(password: string) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/Auth/deleteAccount`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (response.ok) {
      revalidateTag("user");
    } else {
      const error: ProblemDetails = await response.json();

      if (error.detail)
        return { success: false, message: error.detail };
      else
        throw new Error(JSON.stringify(error));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to delete account." };
  }

  redirect("/", RedirectType.replace);
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let response = await fetch(url, { ...options, headers: { ...options.headers, "Authorization": "Bearer " + token } });

  if (response.status === 401) {
    let isStreaming = false;
    
    try {
      cookieStore.set("streamingCheck", "", { httpOnly: true, secure: true });
    } catch (error: unknown) { 
      isStreaming = true;
    }

    if (!isStreaming) {
      const refreshToken = cookieStore.get("refreshToken")?.value;
    
      if (token && refreshToken) {
        const newTokens = await refresh(token, refreshToken);
      
        if (newTokens) {
          cookieStore.set("token", newTokens.accessToken, { 
            httpOnly: true, 
            secure: true, 
            sameSite: "lax", 
            maxAge: 60 * 60 * 24 * 7 
          });
          cookieStore.set("refreshToken", newTokens.refreshToken, { 
            httpOnly: true, 
            secure: true, 
            sameSite: "lax", 
            maxAge: 60 * 60 * 24 * 7 
          });
    
          response = await fetch(url, { 
            ...options, 
            headers: { ...options.headers, "Authorization": "Bearer " + newTokens.accessToken }
          });
        }
      }
    }
  }
  
  return response;
}

export async function forgotPassword(previousState: FormState | null, formData: FormData) {
  const email = formData.get("email");

  try {
    const response = await fetch(`${API_URL}/api/Auth/forgotPassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    
    if (response.ok) {
      return { success: true, message: "Your password reset request has been successfully sent. Check your email." };
    } else {
      const error: ProblemDetails = await response.json();

      if (error.detail)
        return { success: false, message: error.detail };

      throw new Error(JSON.stringify(error));
    }
  } catch (error: unknown) {
    console.error(error)
    return { success: false, message: "Failed to send password reset request." }
  }
}

export async function getValidToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const response = await fetch(`${API_URL}/api/Auth/verify`, {
    method: "POST",
    headers: { "Authorization": "Bearer " + token }
  });

  if (response.ok)
    return token;

  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (token && refreshToken) {
    const newTokens = await refresh(token, refreshToken);

    if (newTokens) {
      cookieStore.set("token", newTokens.accessToken, { 
        httpOnly: true, 
        secure: true, 
        sameSite: "lax", 
        maxAge: 60 * 60 * 24 * 7 
      });
      cookieStore.set("refreshToken", newTokens.refreshToken, { 
        httpOnly: true, 
        secure: true, 
        sameSite: "lax", 
        maxAge: 60 * 60 * 24 * 7 
      });

      return newTokens.accessToken;
    }
  }

  return undefined;
}

export async function login(previousState: FormState | null, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    const response = await fetch(`${API_URL}/api/Auth/login`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const { accessToken, refreshToken } = await response.json();
      
      const cookieStore = await cookies();
      cookieStore.set("token", accessToken, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
      cookieStore.set("refreshToken", refreshToken, { 
        httpOnly: true, 
        secure: true, 
        sameSite: "lax", 
        maxAge: 60 * 60 * 24 * 7 
      });
    } else {
      const error: ProblemDetails = await response.json();

      if (error.detail)
        return { success: false, message: error.detail };
      else
        throw new Error(JSON.stringify(error));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to log in." }
  }
  
  redirect("/discover", RedirectType.replace);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("refreshToken");
  
  revalidateTag("user");
  redirect("/login");
}

export async function refresh(
  accessToken: string, 
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; } | null> {  
  try {
    const response = await fetch(`${API_URL}/api/Auth/refresh`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken })
    });
  
    if (response.ok)
      return await response.json();
    else
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error);
    return null;
  }
}

export async function register(previousState: FormState | null, formData: RegisterFormData) {
  let body: object = {
    type: formData.type,
    email: formData.email,
    password: formData.password,
    phoneNumber: formData.phoneNumber.replace(/[^\d+]/g, ""),
    location: formData.location,
    industry: formData.industry,
  };

  switch (formData.type) {
    case "Employer":
      body = {
        ...body,
        name: formData.employerName,
        website: formData.employerWebsite || null,
        about: formData.employerAbout,
        sizeRangeLowEnd: employerSizeOptions[formData.employerSize].low,
        sizeRangeHighEnd: employerSizeOptions[formData.employerSize].high
      };
      break;
    case "Applicant":
      body = {
        ...body,
        firstName: formData.applicantFirstName,
        middleName: formData.applicantMiddleName,
        lastName: formData.applicantLastName,
        link1: formData.applicantLink1 || null,
        link2: formData.applicantLink2 || null,
        preferredOccupation: formData.applicantPreferredOccupation,
        readyToWork: formData.applicantReadyToWork,
        isPrivate: false
      };
      break;
  }

  try {
    const response = await fetch(`${API_URL}/api/Auth/register`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
      const { accessToken, refreshToken } = await response.json();
      
      const cookieStore = await cookies();
      cookieStore.set("token", accessToken, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
      cookieStore.set("refreshToken", refreshToken, { 
        httpOnly: true, 
        secure: true, 
        sameSite: "lax", 
        maxAge: 60 * 60 * 24 * 7 
      });
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
    return { success: false, message: "Failed to register." };
  }

  redirect(formData.type === "Employer" ? "/discover" : "/profile", RedirectType.replace);
}

export async function resetPassword(previousState: FormState | null, formData: FormData) {
  const email = formData.get("email");
  const token = formData.get("token");
  const password = formData.get("password");

  try {
    const response = await fetch(`${API_URL}/api/Auth/resetPassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, resetCode: token, newPassword: password })
    });

    if (response.ok) {
      return { success: true, message: "Password has be reset successfully." };
    } else {
      const error: ProblemDetails = await response.json();

      if (response.status === 400)
        return { success: false, message: error.detail, invalidResetRequest: true };
      
      throw new Error(JSON.stringify(error));
    }
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to reset password." };
  }
}

export async function verifyResetPasswordToken(email: string, token: string) {
  try {
    const response = await fetch(`${API_URL}/api/Auth/verifyPasswordResetToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token })
    });

    if (response.ok)
      return { success: true };
    else
      throw new Error(JSON.stringify(await response.json()));
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to verify token" };
  }
}
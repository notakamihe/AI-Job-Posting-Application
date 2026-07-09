import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL } from "./utils/api";
import { refresh } from "./actions/api/auth";

export async function middleware(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const response = await fetch(`${API_URL}/api/Auth/verify`, {
    method: "POST",
    headers: { "Authorization": "Bearer " + token }
  });

  if (!response.ok) {
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
  
        return NextResponse.redirect(request.url);
      }
    }  
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
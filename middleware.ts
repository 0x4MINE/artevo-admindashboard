// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Decrypt } from "./lib/auth/session";

const publicRoutes = ["/login"];
const protectedRoutes = ["/dashboard"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionToken = request.cookies.get("session")?.value;
  
  // Check if this is an API request
  const isApiRequest = pathname.startsWith("/api");
  
  let session;
  try {
    session = await Decrypt(sessionToken);
  } catch (error) {
    // Session decryption failed
    console.error("Session decryption failed:", error);
    
    if (isApiRequest) {
      return NextResponse.json(
        { 
          error: "Session invalid", 
          code: "SESSION_INVALID",
          message: "Your session is invalid. Please log in again." 
        },
        { status: 401 }
      );
    }
    
    // Clear invalid session and redirect
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  }

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  // Check if session exists but is expired
  if (sessionToken && (!session || !session.userId)) {
    if (isApiRequest) {
      return NextResponse.json(
        { 
          error: "Session expired", 
          code: "SESSION_EXPIRED",
          message: "Your session has expired. Please log in again." 
        },
        { status: 401 }
      );
    }
    
    // Clear expired session and redirect
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  }

  if (isProtected && !session?.userId) {
    if (isApiRequest) {
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          code: "UNAUTHORIZED",
          message: "Please log in to access this resource." 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublic && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// this is used to prevent user to access pages that they are not authorized to
const isProtectedRoute = createRouteMatcher([
    "/doctors(.*)",
    "/onboarding(.*)",
    "/doctor(.*)",
    "/admin(.*)",
    "/video-call(.*)",
    "/appointments(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    // if user is not logged in it will direct to sign in page
    if (!userId && isProtectedRoute(req)) {
        const { redirectToSignIn } = await auth();
        return redirectToSignIn();
    }

    return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

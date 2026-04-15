import { auth, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
    "/doctors(.*)",
    "/onboarding(.*)",
    "/doctor(.*)",
    "/admin(.*)",
    "/video-call(.*)",
    "/appointments(.*)",
]);

// these are used to prevent the user to access pages that user is not authorized
export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    // if user is not loged In then it will push them to sign in page
    if (!userId && isProtectedRoute(req)) {
        const { redirectToSignIn } = await auth();
        return redirectToSignIn();
    }

    return NextResponse.next();
});


export const config = {
    matcher: [
        //skip next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",

        // always run for api routes
        "/(api|tcp)(.*)",
    ],
};

// this is where we are writing the code which will allow only a specific user to go into our app
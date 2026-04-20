import React from 'react'
import { Button } from "./ui/button";
import {
    Calendar,
    CreditCard,
    ShieldCheck,
    Stethoscope,
    User,
} from "lucide-react";
import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Badge } from './ui/badge';
import Image from "next/image";
import { checkUser } from '@/lib/checkUser';
import { checkAndAllocateCredits } from "@/actions/credits";

export default async function Header() {

    const user = await checkUser();
    if (user?.role === "PATIENT") {
        await checkAndAllocateCredits(user);
    }
    
    return (
        <header className='fixed top-0 w-full border-b bg-background/90 backdrop-blur-md z-30 supports-[backdrop-filter]:bg-background/80'>
            <nav className='container mx-auto px-4 h-16 flex items-center justify-between'>
                <Link href="/" className='flex items-center gap-2 cursor-pointer'>
                    <Image
                        src="/logo112.png"
                        alt="EduConnect Logo"
                        width={200}
                        height={60}
                        className='h-30 w-auto object-contain'
                    />
                </Link>

                {/* Action Buttons */}
                {/* like the user logged in to our website 
                    so if the user didn't decide anything - so we will redirect the user to sign in page
                */}
                <div className='flex items-center space-x-2'>
                    <Show when="signed-in">
                        {/* Admin Links */}

                        {/* admin user - so it will need admin dashboard */}
                        {user?.role === "ADMIN" && (
                            <Link href="/admin">
                                <Button
                                    variant='outline'
                                    className="hidden md:inline-flex items-center gap-2"
                                >
                                    <ShieldCheck className='h-4 w-4' />
                                    Admin Dashboard
                                </Button>
                                <Button variant='ghost' className='md:hidden w-10 h-10 p-0'>
                                    <ShieldCheck className='h-4 w-4' />
                                </Button>
                            </Link>
                        )}


                        {/* Mentor Links */}
                        {user?.role === "DOCTOR" && (
                            <Link href='/doctor'>
                                <Button
                                    variant='outline'
                                    className='hidden md:inline-flex items-center gap-2'
                                >
                                    <Stethoscope className='h-4 w-4' />
                                    Mentor Dashboard
                                </Button>
                                <Button variant='ghost' className='md:hidden w-10 h-10 p-0'>
                                    <Stethoscope className='h-4 w-4' />
                                </Button>
                            </Link>
                        )}
                        
                        {/* if user role is student - we will take the user to appointment page */}
                        {/* Student Links */}
                        {user?.role === "PATIENT" && (
                            <Link href="/appointments">
                                <Button
                                    variant='outline'
                                    className="hidden md:inline-flex items-center gap-2"
                                >
                                    <ShieldCheck className='h-4 w-4' />
                                    {/* only for students */}
                                    My Appointments
                                </Button>
                                <Button variant='ghost' className='md:hidden w-10 h-10 p-0'>
                                    <ShieldCheck className='h-4 w-4' />
                                </Button>
                            </Link>
                        )}
                        
                        
                        
                        {/* Unassigned Role */}
                        {user?.role === "UNASSIGNED" && (
                            <Link href="/onboarding">
                                <Button
                                    variant='outline'
                                    className="hidden md:inline-flex items-center gap-2"
                                >
                                    <ShieldCheck className='h-4 w-4' />
                                    Complete Profile
                                </Button>
                                <Button variant='ghost' className='md:hidden w-10 h-10 p-0'>
                                    <ShieldCheck className='h-4 w-4' />
                                </Button>
                            </Link>
                        )}
                    </Show>


                    {(!user || user?.role !== "ADMIN") && (
                        <Link href={user?.role === "PATIENT" ? "/pricing" : "/doctor"}>
                            <Badge
                                variant='outline'
                                className='h-9 bg-emerald-900/20 border-emerald-700/30 px-3 py-1 flex items-center gap-2'
                            >
                                <CreditCard className='' />
                                <span className=''>
                                    {user && user.role !== "ADMIN" ? (
                                        <>
                                            {user.credits}{" "}
                                            <span className=''>
                                                {user?.role === "PATIENT"
                                                    ? "Credits" 
                                                    : "Earned Credits"
                                                }
                                            </span>
                                        </>
                                    ) : (
                                        <>Pricing</>
                                    )}
                                </span>
                            </Badge>
                        </Link>
                    )}

                    <Show when="signed-out">
                        <SignInButton>
                            <Button variant='secondary'>Sign In</Button>
                        </SignInButton>
                    </Show>

                    <Show when="signed-in">
                        <UserButton 
                            appearance={{
                                elements: {
                                    avatarBox: "w-10 h-10",
                                    userButtonPopoverCard: "shadow-xl bg-zinc-950/95 border border-zinc-800 backdrop-blur-md",
                                    userButtonPopoverFooter: "bg-zinc-950/95 border-t border-zinc-800",
                                    userPreviewMainIdentifier: "font-semibold",
                                },
                            }}
                            userProfileProps={{
                                appearance: {
                                    variables: {
                                        colorModalBackdrop: "rgba(0, 0, 0, 0.78)",
                                    },
                                    elements: {
                                        modalBackdrop: "bg-black/70 backdrop-blur-[1px]",
                                        modalContent: "rounded-2xl overflow-hidden border border-zinc-700/70 bg-zinc-900/95 shadow-2xl",
                                        cardBox: "bg-transparent",
                                        card: "bg-zinc-900/95 border-0 shadow-none",
                                        navbar: "bg-gradient-to-b from-zinc-600/35 via-zinc-800/20 to-zinc-900/10 backdrop-blur-md border-r border-white/10",
                                        navbarButtons: "gap-1",
                                        navbarButton: "rounded-md text-zinc-200 hover:bg-white/10",
                                        navbarButtonIcon: "text-zinc-300",
                                        navbarButtonText: "text-zinc-200",
                                        // profilePage: "bg-zinc-900/95",
                                        footer: "bg-gradient-to-t from-orange-500/10 via-zinc-900/60 to-transparent border-t border-white/10",
                                        footerPages: "bg-transparent",
                                        footerPagesLink: "text-zinc-300 hover:text-white",
                                    },
                                },
                            }}
                            afterSignOutUrl="/"
                        />
                    </Show>
                </div>
            </nav>
        </header>
    );
}
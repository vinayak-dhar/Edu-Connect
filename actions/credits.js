"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { use } from "react";

// Define credit allocations per plan
const PLAN_CREDITS = {
    free_user: 0, // Basic plan: 2 credits
    standard: 10, // Standard plan: 10 credits per month
    premium: 24, // Premium plan: 24 credits per month
};

// Each appointment costs 2 credits
const APPOINTMENT_CREDIT_COST = 2;

/**
 * checks user's subscription and allocates monthly credits if needed
 * This should be called on app initialization (e.g., in a layout component)
 */
export async function checkAndAllocateCredits(user) {
    try {
        if (!user) {
            // if user is not present - return null
            return null;
        }

        // only allocate credits for patients
        if (user.role !== "PATIENT") {
            return user;
        }

        // check if user has a subscription
        // this has function will check the current subscription
        const { has } = await auth();

        // check which plan the user has
        const hashBasic = has({ plan: "free_user" });
        const hasStandard = has({ plan: "standard" });
        const hasPremium = has({ plan: "premium" });

        // check users current plan
        let currentPlan = null;
        let creditsToAllocate = 0;

        if (hasPremium) {
            currentPlan = "premium";
            creditsToAllocate = PLAN_CREDITS.premium;
        }
        else if (hasStandard) {
            currentPlan = "standard";
            creditsToAllocate = PLAN_CREDITS.standard;
        }
        else if (hashBasic) {
            currentPlan = "free_user";
            creditsToAllocate = PLAN_CREDITS.free_user;
        }

        // if user doesn't have any plan, just return the user
        if (!currentPlan) {
            return user;
        }

        // now in order to make this work - install the date library
        // npm i date-fns
        // check if we already allocated credits for this month
        const currentMonth = format(new Date(), "yyyy-MM");

        // if there's a transaction this month, check if it's for the same plan
        if (user.transactions.length > 0) {
            const latestTransaction = user.transactions[0];
            const transactionMonth = format(
                new Date(latestTransaction.createdAt),
                "yyyy-MM"
            );
            const transactionPlan = latestTransaction.packageId;

            // if we already allocated credits for this month and the plan is the same, just return
            if (
                transactionMonth === currentMonth &&
                transactionPlan === currentPlan
            ) {
                return user;
            }

            // Allocate credits and create transaction record
            const updatedUser = await db.$transaction(async (tx) => {
                // create transaction record
                await tx.creditTransaction.create({
                    data: {
                        userId: user.id,
                        amount: creditsToAllocate,
                        type: "CREDIT_PURCHASE",
                        packageId: currentPlan,
                    },
                });

                // Update user's credit balance
                const updatedUser = await tx.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        credits: {
                            increment: creditsToAllocate,
                        },
                    },
                });

                return updatedUser;
            });

            // return the updated user and flag indication revalidation if needed
            return { user: updatedUser, needsRevalidation: true };
        }
    } catch (error) {
        console.error(
            "Failed to check subscription and allocate credits:",
            error.message
        );
        return { user: null, needsRevalidation: false};
    }
}
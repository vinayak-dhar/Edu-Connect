    // currect user will in this
    import { currentUser } from "@clerk/nextjs/server";

    import { db } from "./prisma";

    // Sync Clerk user with your database
    export const checkUser = async () => {
        // this will get the current user
        const user = await currentUser();

        if (!user) {
            // if there user is not logged in 
            return null;
        }

        try {
            // if user is logged in 
            const loggedInUser = await db.user.findUnique({
                // it will find a unique key from the database
                // there will be no duplicate in this only one unique user 
                where: {
                    clerkUserId: user.id,
                },
                include: {
                    transactions: {
                        where: {
                            type: "CREDIT_PURCHASE",
                            // get transactions from current month
                            createdAt: {
                                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                            },
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                        take: 1,
                    },
                },
            });

            if (loggedInUser) {
                return loggedInUser;
            }

            // if user doesnot exist in the database the create the user
            const name = `${user.firstName} ${user.lastName}`;
            const newUser = await db.user.create({
                data: {
                    clerkUserId: user.id,
                    name,
                    imageUrl: user.imageUrl,
                    email: user.emailAddresses[0].emailAddress,
                    transactions: {
                        // when user is created, we need to add 2 credits to there account for login for the first time
                        create: {
                            type: "CREDIT_PURCHASE",
                            packageId: "free_user",
                            amount: 0,
                        },
                    },
                },
            });

            return newUser;
        } catch (error) {
            console.error(error.message);
        }   
    }
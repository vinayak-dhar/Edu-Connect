import { Inter } from "next/font/google"; // this is basically the inner font 
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import Header from "@/components/Header"; // this is the header component
import { ClerkProvider } from "@clerk/nextjs"; // this is the clerk provider which is for authentication
import { dark } from "@clerk/themes"; // this is the dark theme for clerk which is for authentication
import Link from "next/link";

// HERE WE WILL USE THE DEFAULT FONT
const inter = Inter({ subsets: ["latin"] });
// this is one of the default font --- inter

export const metadata = {
  title: "EduConnect - Mentors Appointment App",
  description: "Connect with Mentors anytime anywhere",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >

    </ClerkProvider>
  )
}
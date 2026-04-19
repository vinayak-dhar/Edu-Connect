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
      {/* the clerk provide dark themes so that we can use it in the dark theme */}
      {/* clerk is used basically for authentication */}
      {/* basically it will allow only specific users to enter to our application */}
      <html lang="en" suppressHydrationWarning>
        {/* this will supress warnings */}

        {/* this is the theme provider basically for the dark mode -> imported from the shadcn  */}
        {/* all components are adapting to the dark mode */}
        <head>
          <link rel="icon" href="/logo.png" sizes="any" />
        </head>
        <body className={`${inter.className}`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransiitionOnChange
          >
            {/* added header commponent */}
            <Header />
            <main className="min-h-screen">{children}</main>
            {/* the min-h-screen will make the view port always is atleast 100 vew port hieght */}
            <Toaster richColors />

            {/* added footer component */}
            <footer className="bg-muted/50 py-10 bg-gradient-to-r from-indigo-900/30 to-purple-900/30">
              {/* basic styling for footer -> footer in center */}
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                  <div>
                    <h3 className="text-purple-400 font-semibold mb-4">EduConnect</h3>
                    <p className="text-sky-300 text-sm">
                      Connect with expert mentors for personlized learning experiences.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/doctors" className="text-sky-300 hover:text-white transition-colors">Find Mentors</Link></li>
                      <li><Link href="/pricing" className="text-sky-300 hover:text-white transition-colors">Pricing</Link></li>
                      <li><Link href="/onboarding" className="text-sky-300 hover:text-white transition-colors">Get Started</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-semibold mb-4">Support</h4>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/contact-support" className="text-sky-300 hover:text-white transition-colors">Contact Support</Link></li>
                      <li><Link href="/email-support" className="text-sky-300 hover:text-white transition-colors">Email Support</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-semibold mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/privacy-policy" className="text-sky-300 hover:text-white transition-colors">Privacy Policy</Link></li>
                      <li><Link href="/terms-of-service" className="text-sky-300 hover:text-white transition-colors">Terms of Service</Link></li>
                    </ul>
                  </div>
                  <div className="border-t border-gray-700 pt-6 text-center">
                    <p className="text-white text-sm">Made by Vinayak Dhar</p>
                  </div>
                </div>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
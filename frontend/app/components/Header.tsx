import Link from "next/link";
import { FaBars, FaComments } from "react-icons/fa6";
import { Geist_Mono } from "next/font/google"
import NavBar from "./NavBar";
import { AuthenticatedUser } from "@/types";
import HeaderMenu from "./HeaderMenu";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Header({ user }: { user?: AuthenticatedUser | null; }) {
  return (
    <header className="flex justify-center items-center p-2 pl-4 border-b border-b-base-content/10 bg-base-100 z-30 gap-x-7 gap-y-1 min-h-14 flex-wrap">
      <Link className={`block text-xl font-bold text-center shrink-0 hover:text-primary ${geistMono.className}`} href="/">
        JOB POSTING APPLICATION
      </Link>
      <div className="flex items-center grow gap-5">
        <NavBar />
        {user !== undefined && (
          <div>
            {user ? (
              <div>
                {user.roles.includes("Admin") && (
                  <div className="badge border-primary text-primary font-medium mr-3">Admin</div>
                )}
                <Link className="inline-flex mr-3 btn btn-ghost btn-neutral p-2 max-sm:btn-sm" href="/chat">
                  <FaComments className="align-middle" fontSize={20} />
                </Link>
                {!user.roles.includes("Admin") && (
                  <Link 
                    className="btn btn-ghost text-primary hover:text-white btn-primary mr-3 max-sm:btn-sm" 
                    href="/profile"
                  >
                    Profile
                  </Link>
                )}
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-square px-2 max-sm:btn-sm">
                    <FaBars />
                  </div>
                  <HeaderMenu user={user} />
                </div>
              </div>
            ) : (
              <div>
                <Link href="/register" className="btn btn-primary mr-3">Sign Up</Link>
                <Link href="/login" className="btn btn-neutral">Log in</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
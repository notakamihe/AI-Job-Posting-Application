"use client"

import { logout } from "@/actions/api/auth";
import { AuthenticatedUser } from "@/types";
import Link from "next/link";
import { FaGear } from "react-icons/fa6";

export default function HeaderMenu({ user }: { user: AuthenticatedUser }) {
  function handleClick() {
    if (document.activeElement && document.activeElement instanceof HTMLElement) 
      document.activeElement.blur();
  }

  return (
    <ul className="dropdown-content menu bg-base-100 rounded z-1 w-44 p-2 border border-base-content/15" tabIndex={0}>
      {!user.roles.includes("Admin") && (
        <>
          {user.type === "Applicant" && (
            <li>
              <Link className="block text-right" href="/activity?tab=saved" onClick={handleClick}>Saved</Link>
            </li>
          )}
          <li>
            <Link className="block text-right" href="/activity?tab=applications" onClick={handleClick}>Applications</Link>
          </li>
          {user.type === "Applicant" && (
            <li>
              <Link className="block text-right" href="/activity?tab=reviews" onClick={handleClick}>Reviews</Link>
            </li>
          )}
          <div className="divider my-0" />
        </>
      )}
      {!user.roles.includes("Admin") && (
        <li>
          <Link className="flex justify-end items-center" href="/settings">
            <FaGear className="mr-0.5" />Account Settings
          </Link>
        </li>
      )}
      <li>
        <button className="block text-right" onClick={logout}>Log out</button>
      </li>
    </ul>
  )
}
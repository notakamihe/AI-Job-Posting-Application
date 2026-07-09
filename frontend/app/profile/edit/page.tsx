import { redirect } from "next/navigation";
import ApplicantEditProfile from "../components/ApplicantEditProfile";
import EmployerEditProfile from "../components/EmployerEditProfile";
import { Metadata } from "next";
import { cachedGetAuthUser } from "@/actions/api/user";

export const metadata: Metadata = { title: "Edit Profile" };

export default async function AuthEditProfilePage() {
  const user = await cachedGetAuthUser();

  if (!user)
    redirect("/login");

  if (user.roles.includes("Admin"))
    redirect("/discover");

  return (
    <div className="flex flex-col grow">
      <h1 className="text-center font-bold text-2xl mb-5 px-5 pt-5 md:px-10 md:pt-7">Edit Your Profile</h1>
      {user.type === "Applicant" && <ApplicantEditProfile applicant={user} user={user} />}
      {user.type === "Employer" && <EmployerEditProfile employer={user} user={user} />}
    </div>
  )
}

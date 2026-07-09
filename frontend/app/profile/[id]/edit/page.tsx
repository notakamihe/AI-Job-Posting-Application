import { cachedGetAuthUser, getUser } from "@/actions/api/user";
import { redirect } from "next/navigation";
import ApplicantEditProfile from "../../components/ApplicantEditProfile";
import EmployerEditProfile from "../../components/EmployerEditProfile";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Profile" };

export default async function EditProfilePage({ params }: { params: Promise<{ id: string; }> }) {
  const user = await cachedGetAuthUser();

  if (!user)
    redirect("/login");
  
  const { id } = await params;
  const profileUser = await getUser(id);
  
  if (!profileUser)
    redirect("/discover");

  if (user.id === profileUser.id)
    redirect("/profile/edit");

  if (!user.roles.includes("Admin"))
    redirect(`/profile/${profileUser.id}`);

  return (
    <div className="flex flex-col grow">
      <h1 className="text-center font-bold text-2xl mb-5 px-5 pt-5 md:px-10 md:pt-7">Edit Profile</h1>
      {profileUser.type === "Applicant" && <ApplicantEditProfile applicant={profileUser} user={user} />}
      {profileUser.type === "Employer" && <EmployerEditProfile employer={profileUser} user={user} />}
    </div>
  )
}
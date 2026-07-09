import { AuthenticatedUser, UserDetail } from "@/types";
import ApplicantProfile from "./ApplicantProfile";
import EmployerProfile from "./EmployerProfile";
import { getFollowers, getReviews } from "@/actions/api/user";
import { getChats } from "@/actions/api/chat";
import PrivateProfile from "./PrivateProfile";

interface UserProfileProps {
  profileUser: UserDetail | null;
  user: AuthenticatedUser | null;
}

export default async function UserProfile({ profileUser, user }: UserProfileProps) {
  const chats = user && profileUser ? await getChats([profileUser.id]) : [];
  const chat = chats.find(chat => chat.users.length === 2);

  if (!profileUser)
    return <PrivateProfile />;

  switch (profileUser.type) {
    case "Applicant":
      return <ApplicantProfile applicant={profileUser} chat={chat} user={user} />;
    case "Employer":
      const followers = await getFollowers(profileUser.id);
      const reviews = await getReviews(profileUser.id);
      
      return <EmployerProfile chat={chat} employer={profileUser} followers={followers} reviews={reviews} user={user} />;
  }

  return null;
}
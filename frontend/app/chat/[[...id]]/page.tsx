import { getUsers, cachedGetAuthUser } from "@/actions/api/user";
import { User } from "@/types";
import { redirect } from "next/navigation";
import ChatDetail from "./components/ChatDetail";
import NewChatForm from "./components/NewChatForm";
import { Metadata } from "next";

export async function generateMetadata({ 
  params 
}: {
  params: Promise<{ id: string | string[] | undefined }> 
}): Promise<Metadata | null> { 
  const { id: idParam = "" } = await params;
  const id = typeof idParam === "string" ? idParam : idParam[0];

  return id === "new" ? { title: "Start a New Chat" } : null;
}

export default async function ChatDetailPage({ params, searchParams }: { 
  params: Promise<{ id: string[] | undefined }>; 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await cachedGetAuthUser();
      
  if (!user)
    redirect("/login");
  
  const { id: idParam = "" } = await params;
  const id = typeof idParam === "string" ? idParam : idParam[0];

  if (id === "new") {
    const { withUser } = await searchParams;
    let newChatUsers: User[] = [];

    if (withUser !== undefined) {
      const users = (typeof withUser === "string" ? [withUser] : withUser);
      newChatUsers = await getUsers(users.filter(u => u !== user.id));
    }

    return <NewChatForm withUsers={newChatUsers} user={user} />;
  } 

  return <ChatDetail user={user} />;
}
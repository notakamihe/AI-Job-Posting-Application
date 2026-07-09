import { redirect } from "next/navigation";
import { Metadata } from "next";
import Chats from "./components/Chats";
import { cachedGetAuthUser } from "@/actions/api/user";
import { getChats } from "@/actions/api/chat";
import { Suspense } from "react";

export const metadata: Metadata = { 
  title: { template: "%s | Job Posting Application", default: "Chats" } 
};

async function LayoutContent({ children }: { children: React.ReactNode; }) {
  const user = await cachedGetAuthUser();
    
  if (!user)
    redirect("/login");
  
  const chats = await getChats();
  
  return <Chats chats={chats} user={user}>{children}</Chats>;
}

export default async function ChatLayout({ children }: { children: React.ReactNode; }) {
  return (
    <Suspense 
      fallback={
        <div className="flex h-full">
          <div className="flex flex-col pb-5 gap-3 grow flex-1 min-w-80">
            <div className="flex gap-5 justify-between px-5 pt-5">
              <div className="skeleton grow max-w-40 my-1"></div>
              <div className="skeleton w-12 h-12 rounded-full"></div>
            </div>
            <div className="skeleton flex-1 min-h-25 max-h-40 mx-5" />
            <div className="skeleton flex-1 min-h-25 max-h-40 mx-5" />
            <div className="skeleton flex-1 min-h-25 max-h-40 mx-5" />
            <div className="skeleton flex-1 min-h-25 max-h-40 mx-5" />
            <div className="skeleton flex-1 min-h-25 max-h-40 mx-5 [@media(max-height:53rem)]:hidden" />
          </div>
          <div className="hidden flex-3 p-5 pl-0 md:block">
            <div className="flex flex-col h-full border border-base-content/20 rounded">
              <div className="border-b border-base-content/20 px-5 py-3 mb-5">
                <div className="skeleton h-7 max-w-80 mx-auto" />
              </div>
              <div className="grow flex flex-col gap-5 px-5">
                <div className="w-6/10 flex-1 mr-10 skeleton self-start shrink-0 rounded-bl-none" />
                <div className="w-2/10 flex-1 ml-10 skeleton self-end shrink-0 rounded-br-none" />
                <div className="w-25/100 flex-1 mr-10 skeleton self-start shrink-0 rounded-bl-none [@media(max-height:29rem)]:hidden" />
                <div className="w-3/10 flex-1 ml-10 skeleton self-end shrink-0 rounded-br-none [@media(max-height:33rem)]:hidden" />
                <div className="w-5/10 flex-1 ml-10 skeleton self-end shrink-0 rounded-br-none [@media(max-height:36rem)]:hidden" />
                <div className="w-45/100 flex-1 mr-10 skeleton self-start shrink-0 rounded-bl-none [@media(max-height:40rem)]:hidden" />
                <div className="w-3/10 flex-1 mr-10 skeleton self-start shrink-0 rounded-bl-none [@media(max-height:45rem)]:hidden" />
                <div className="w-35/100 flex-1 ml-10 skeleton self-end shrink-0 rounded-br-none [@media(max-height:50rem)]:hidden" />
                <div className="w-4/10 flex-1 mr-10 skeleton self-start shrink-0 rounded-bl-none [@media(max-height:54rem)]:hidden" />
              </div>
              <div className="p-5">
                <div className="skeleton rounded-3xl h-14.5" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}
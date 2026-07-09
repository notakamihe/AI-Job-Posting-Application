"use client"

import { getUserNames } from "@/utils/utils";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FaAngleLeft, FaAngleRight, FaMinus } from "react-icons/fa";
import { FaXmark, FaArrowRightArrowLeft } from "react-icons/fa6";
import { AuthenticatedUser, EntityQueryResult, FormState, User } from "@/types";
import { useRouter } from "next/navigation";
import EntitySearch from "@/components/EntitySearch";
import ApplicantCard from "@/components/ApplicantCard";
import EmployerCard from "@/components/EmployerCard";
import { ChatContext } from "../../components/Chats";
import { HubConnectionState } from "@microsoft/signalr";
import ChatInputSection from "./ChatMessageInputSection";

export default function NewChatForm({ withUsers, user }: { withUsers: User[]; user: AuthenticatedUser; }) {
  const { 
    chats, 
    closeNewChat,
    connection, 
    connectionState,
    existingChatErrorId,
    setExistingChatErrorId, 
    setShowChatList,
  } = useContext(ChatContext)!;

  const router = useRouter();

  const allowMultipleUsers = user?.type === "Employer";

  const [formState, setFormState] = useState<FormState | null>(null);
  const [searchText, setSearchText] = useState("");
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [users, setUsers] = useState<User[]>(allowMultipleUsers ? withUsers : withUsers.slice(0, 1));

  const ref = useRef<HTMLInputElement>(null);

  const isAdmin = user.roles.includes("Admin");

  const existingChat = useMemo(() => {
    if (!user)
      return null;

    const newChatUsers = [user, ...users];
    return chats.find(chat =>
      newChatUsers.length === chat.users.length && 
      chat.users.every(user => newChatUsers.some(u => u.id === user.id))
    );
  }, [chats, user, users]);

  useEffect(() => {
    if (isAdmin)
      closeNewChat(true);
  }, [])

  useEffect(() => {
    setUsers(allowMultipleUsers ? withUsers : withUsers.slice(0, 1));
  }, [withUsers])

  useEffect(() => {
    setExistingChatErrorId(existingChat?.id ?? null);
  }, [existingChat, searchText, step])

  async function createChat(): Promise<void> {
    if (user && connection && connectionState === HubConnectionState.Connected) {
      setFormState(null);

      try {
        const result = await connection.invoke("CreateChat", users.map(user => user.id), { message: text });
  
        setUsers([]);
        setSearchText("");
        setText("");
        setShowChatList(false);
  
        router.push(`/chat/${result.id}`);
      } catch (error: unknown) {
        console.error(error);
        setFormState({ success: false, message: "Failed to create chat." });
      }
    }
  }

  function handleUserSelect(result: EntityQueryResult) {
    if (result.type === "Applicant" || result.type === "Employer") {
      if (allowMultipleUsers) {
        if (!users.find(u => u.id === result.id)) {
          setUsers([result, ...users]);
          setSearchText("");
        }
      } else {
        const users = [user, result];
        const existingChat = chats.find(chat => (
          users.length === chat.users.length && 
          chat.users.every(user => users.some(u => u?.id === user.id))
        ));

        if (existingChat) {
          setExistingChatErrorId(existingChat.id);
          return true;
        } else {
          setExistingChatErrorId(null);
          setUsers([result]);
        }
      }
      
      if (document.activeElement)
        (document.activeElement as HTMLElement).blur();
    }
  }

  const disableInput = users.length === 0 || !!existingChat;

  if (!isAdmin) {
    return (
      <div className="relative w-full h-full flex border border-base-content/20 rounded">
        <div className={`flex-col flex-1 p-5 relative overflow-hidden ${step === 0 ? "flex" : "hidden"} @2xl/chat:flex @2xl/chat:border-r @2xl/chat:border-r-base-content/20`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold @2xl/chat:px-0">New Chat</h2>
            <button className="btn btn-circle btn-sm @2xl/chat:hidden" disabled={disableInput} onClick={() => setStep(1)}>
              <FaAngleRight className="text-base" />
            </button>
          </div>
          <EntitySearch 
            allowSubmit={false}
            autoFocus
            numResults={5}
            onChange={e => setSearchText(e.target.value)}
            onSelect={handleUserSelect}
            placeholder="Enter a name"
            ref={ref}
            type={[user?.type === "Employer" ? "Applicant" : "Employer"]}
            value={searchText}
          />
          <div className="flex flex-col grow gap-3 overflow-auto scrollbar-thin mt-4">
            {users.map((participant, idx) => {
              return (participant.type === "Applicant" || participant.type === "Employer") && (
                <div className="relative group" key={idx}>
                  {participant.type === "Applicant" && (
                    <ApplicantCard applicant={participant} key={idx} linkNewTab user={user} />
                  )}
                  {participant.type === "Employer" && <EmployerCard employer={participant} key={idx} linkNewTab />}
                  {allowMultipleUsers ? (
                    <button 
                      className="absolute top-2.5 right-2.5 btn btn-circle btn-sm any-pointer-fine:invisible group-hover:visible"
                      onClick={() => setUsers(users.filter(u => u !== participant))}
                    >
                      <FaMinus />
                    </button>
                  ) : (
                    <button 
                      className="absolute top-2.5 right-2.5 btn btn-circle btn-sm any-pointer-fine:invisible group-hover:visible"
                      onClick={() => { setUsers([]); ref.current?.focus(); }}
                    >
                      <FaArrowRightArrowLeft />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {existingChatErrorId !== null && (
            <p className="text-center mt-5 mb-1">
              <span className={`font-medium px-3 py-1 rounded ${allowMultipleUsers ? "text-warning bg-warning/15" : "text-error bg-error/15"}`}>
                Chat already exists
              </span> 
            </p>
          )}
        </div>
        <div className={`relative flex-col justify-between flex-1 shrink-0 h-full overflow-hidden ${step === 1 ? "flex" : "hidden"} @2xl/chat:flex min-w-50`}>
          <div className={`relative px-5 py-3 border-b border-b-base-content/20 text-lg text-center font-medium ${users.length > 0 ? "visible" : "invisible"}`}>
            <span className="line-clamp-2">{getUserNames(users)}</span>
            <div className="absolute -bottom-4 absolute-center-x text-center @2xl/chat:hidden">
              <button className="btn btn-xs bg-base-100 border-base-content/20" onClick={() => setStep(0)}>
                <FaAngleLeft className="text-sm" />Back
              </button>
            </div>
          </div>
          <div className="p-3 pt-0 md:pt-0 md:p-5">
            <ChatInputSection 
              disableInput={disableInput}
              disableSend={connectionState !== HubConnectionState.Connected || !text.trim()}
              error={!formState?.success ? formState?.message : undefined}
              onChange={e => setText(e.target.value)}
              onSend={createChat}
              text={text}
            />
          </div>
        </div>
        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3">
          <button className="btn btn-sm btn-circle bg-base-100" onClick= {() => { setShowChatList(true); closeNewChat(); }}>
            <FaXmark />
          </button>
        </div>
      </div>
    );
  }
}
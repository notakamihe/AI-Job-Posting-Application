import { getUserNames, getUserName, timeAgo } from "@/utils/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, useState, useRef, useMemo, useEffect } from "react";
import { FaRobot } from "react-icons/fa";
import { FaEllipsisVertical, FaRightFromBracket } from "react-icons/fa6";
import { AuthenticatedUser } from "@/types";
import { ChatContext, ChatState } from "./Chats";
import { HubConnectionState } from "@microsoft/signalr";
import Formatted from "./Formatted";

interface ChatListItemProps {
  chat: ChatState;
  focus: boolean;
  selected: boolean;
  unread?: number;
  user: AuthenticatedUser;
}

export default function ChatListItem({ chat, focus, selected, unread, user }: ChatListItemProps) {
  const { connection, connectionState, setShowChatList } = useContext(ChatContext)!;

  const pathname = usePathname();

  const [isPending, setIsPending] = useState(false);
  const [routeChange, setRouteChange] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const isParticipant = useMemo(() => chat?.users.some(u => u.id === user.id), [chat?.users]);
  const chatbot = useMemo(() => chat?.users.find(user => user.id === "chatbot"), [chat?.users]);

  useEffect(() => {
    if (focus)
      ref.current?.scrollIntoView({ block: "nearest" });
  }, [focus])

  useEffect(() => {
    if (selected)
      ref.current?.scrollIntoView({ block: "nearest" });
  }, [selected])

  useEffect(() => {
    if (routeChange) {
      setShowChatList(false);
      setRouteChange(false);
    }
  }, [pathname])

  function handleClick(e: React.MouseEvent) {
    if (pathname === `/chat/${chat.id}`) {
      e.preventDefault();
      setShowChatList(false);
    } else {
      setRouteChange(true);
    }
  }

  function leave() {
    if (!isPending && connection && connectionState === HubConnectionState.Connected) {
      setIsPending(true);
      
      connection
        .invoke("LeaveChat", chat.id)
        .catch(err => console.error(err))
        .finally(() => setIsPending(false));
    }

    if (document.activeElement)
      (document.activeElement as HTMLElement).blur();
  }

  const whoIsTyping = chat.whoIsTyping.filter(u => u.id !== user.id);

  return (
    <li className="relative mt-3">
      <div className="absolute -top-15 -bottom-5 w-full pointer-events-none" ref={ref} />
      {isParticipant && !!unread && (
        <p className={`min-w-4 badge badge-xs text-xs absolute -translate-1/3 font-medium px-1 py-px rounded-full text-center z-10 ${selected ? "badge-primary" : " text-base-content/60 border-base-content/15"}`}>
          {unread}
        </p>
      )}
      <Link
        className={`relative flex border border-base-content/20 py-2 cursor-pointer rounded gap-1 ${selected ? "border-primary bg-primary/10 text-primary" : ""} ${focus ? "border-3 border-base-content/100" : ""}`}
        href={`/chat/${chat.id}`}
        onClick={handleClick}
      >
        <div className={`flex flex-col grow px-2.5 ${!chatbot ? "min-h-[2lh]" : ""}`}>
          <p className="font-bold line-clamp-3 leading-tight">
            {chatbot && (
              <FaRobot className={`inline -translate-y-0.5 mr-1.5 ${selected ? "text-primary" : "text-base-content"}`} />
            )}
            {getUserNames(chat.users.filter(u => u.id !== user.id))}
          </p>
          {whoIsTyping.length > 0 ? (
            <p className="text-sm line-clamp-3 opacity-80">
              {getUserName(whoIsTyping[whoIsTyping.length - 1])} is typing...
            </p>
          ) : (
            chat.messages.length > 0 ? (
              <>
                <p className="text-sm grow line-clamp-3 opacity-80">
                  <Formatted text={chat.messages[chat.messages.length - 1].message} />
                </p>
                <p className="italic text-xs opacity-65 font-medium mt-0.5">
                  {timeAgo(new Date(chat.messages[chat.messages.length - 1].sentAt))}
                </p>
              </>
            ) : (
              <p className="italic text-xs line-clamp-3 opacity-65 mt-2">
                No messages
              </p>
            )
          )}
        </div>
        {!chatbot && isParticipant && (
          <div className="w-6 shrink-0 pr-2">
            {isPending ? (
              <span className="loading loading-ring loading-sm text-primary -translate-1" />
            ) : (
              <div className="dropdown dropdown-bottom dropdown-end" onClick={e => { e.preventDefault(); }}>
                <div className="cursor-pointer focus:opacity-50" role="button" tabIndex={0}>
                  <FaEllipsisVertical className="text-sm translate-x-1" />
                </div>
                <div className="dropdown-content mt-1" onMouseDown={e => e.preventDefault()} tabIndex={0}>
                  <button className="btn btn-xs btn-circle" onClick={leave}>
                    <FaRightFromBracket className="text-sm" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Link>
    </li>
  )
}
"use client"

import { getValidToken } from "@/actions/api/auth";
import ApplicantCard from "@/components/ApplicantCard";
import EmployerCard from "@/components/EmployerCard";
import { EntityQueryResult, Chat, ChatMessage, User, AuthenticatedUser } from "@/types";
import { API_URL } from "@/utils/api";
import { HubConnection, HubConnectionState, HubConnectionBuilder } from "@microsoft/signalr";
import { FailedToNegotiateWithServerError } from "@microsoft/signalr/dist/esm/Errors";
import { redirect, RedirectType, useParams, useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState, useRef, useMemo, useEffect, Fragment, ReactNode, createContext } from "react";
import { FaRedo, FaRobot } from "react-icons/fa";
import { FaPlugCircleXmark, FaXmark } from "react-icons/fa6";
import { TbMessagePlus } from "react-icons/tb";
import ChatListItem from "./ChatListItem";
import { getUserNames } from "@/utils/utils";
import { LuMessageSquareDashed } from "react-icons/lu";
import Link from "next/link";

interface ChatContextType {
  chat: ChatState | null;
  chats: ChatState[];
  closeNewChat: (redirect?: boolean) => void;
  connection: HubConnection | null;
  connectionState: HubConnectionState;
  existingChatErrorId: number | null;
  pendingChatbotResponse: PendingChatbotResponse | null; 
  scrollToMessage: { id: number; focusAnchor?: "bottom" | "auto" } | null;
  setChats: Dispatch<SetStateAction<ChatState[]>>;
  setExistingChatErrorId: Dispatch<SetStateAction<number | null>>;
  setPendingChatbotResponse: Dispatch<SetStateAction<PendingChatbotResponse | null>>; 
  setScrollToMessage: Dispatch<SetStateAction<{ id: number; focusAnchor?: "bottom" | "auto" } | null>>;
  setShowChatList: Dispatch<SetStateAction<boolean>>;
  setShowChatUsersDetailSection: Dispatch<SetStateAction<boolean>>;
  showChatList: boolean;
  showChatUsersDetailSection: boolean;
}

interface ChatsProps {
  chats: Chat[];
  children: ReactNode;
  user: AuthenticatedUser;
}

export interface ChatState extends Chat {
  whoIsTyping: User[];
}

interface PendingChatbotResponse {
  respondingToId: number;
  message: { text: string; relevantItems: EntityQueryResult[] };
  error?: string;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export default function Chats({ chats: chatsData, children, user }: ChatsProps) {
  const params = useParams();
  const router = useRouter();

  const [chats, setChats] = useState<ChatState[]>(chatsData.map(chat => ({ ...chat, whoIsTyping: [] })));
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [connectionState, setConnectionState] = useState(HubConnectionState.Disconnected);
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
  const [existingChatErrorId, setExistingChatErrorId] = useState<number | null>(null);
  const [lastChat, setLastChat] = useState<number | undefined>(undefined);
  const [redirectTo, setRedirectTo] = useState("");
  const [pendingChatbotResponse, setPendingChatbotResponse] = useState<PendingChatbotResponse | null>(null);
  const [resetScrollToMessage, setResetScrollToMessage] = useState(false);
  const [scrollToMessage, setScrollToMessage] = useState<{ id: number; focusAnchor?: "bottom" | "auto" } | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [showChatUsersDetailSection, setShowChatUsersDetailSection] = useState(false);

  const chatIdRef = useRef<number | undefined>(undefined);
  const userIdRef = useRef<string | undefined>(user.id);

  const isAdmin = user.roles.includes("Admin");

  const id = params.id ? params.id[0] : undefined; 
  const newChat = useMemo(() => id === "new", [id]);
  const chat = useMemo(() => chats.find(chat => chat.id === Number(id)) ?? null, [chats, id]);

  useEffect(() => {
    setChats(chatsData.map(chat => ({ ...chat, whoIsTyping: [] })));
  }, [chatsData])

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
      setRedirectTo("");
    }
  }, [redirectTo])

  useEffect(() => {
    if (!connection)
      establishNewConnection();
  }, [connection])
  
  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => { 
          setConnectionState(connection.state); 
          setHasAttemptedConnection(true);
        })
        .catch(error => handleConnectError(connection, error));

      setConnectionState(connection.state); 

      connection.onreconnected(() => setConnectionState(connection.state));
      connection.onreconnecting(() => setConnectionState(connection.state));
      connection.onclose(() => setConnectionState(connection.state));

      connection.on("ChatbotMessageReceived", (chatId: number, message: ChatMessage, respondingToId: number) => {
        setChats(prev => {
          const idx = prev.findIndex(chat => chat.id === chatId);

          if (idx > -1) {
            prev = prev.slice();

            const messages = prev[idx].messages.slice();
            const respondingToIndex = messages.findIndex(m => m.id === respondingToId);

            if (respondingToIndex > -1)
              messages.splice(respondingToIndex + 1);
          
            messages.push(message);

            prev[idx] = { ...prev[idx], messages };
          }

          return prev;
        });
        setScrollToMessage({ id: message.id, focusAnchor: "bottom" })
      });

      connection.on("NewChat", chat => {
        setChats(prev => {
          prev = prev.slice();

          const chatbotChatIdx = prev.findLastIndex(chat => chat.users.some(u => u.id === "chatbot"));
          prev.splice(chatbotChatIdx + 1, 0, { ...chat, whoIsTyping: [] });   
          return prev;
        });
      });

      connection.on("LeftChat", (chatId: number, userId: string) => {
        setChats(prev => {
          const idx = prev.findIndex(chat => chat.id === chatId);

          if (idx > -1) {
            prev = prev.slice();
            prev[idx] = { 
              ...prev[idx], 
              messages: prev[idx].messages.map(message => ({ 
                ...message,
                readBy: message.readBy.filter(u => u.id !== userId) 
              })),
              users: prev[idx].users.filter(user => user.id !== userId) 
            };

            const duplicate = prev.some(chat => 
              chat !== prev[idx] && 
              chat.users.length === prev[idx].users.length &&
              chat.users.every(user => prev[idx].users.some(u => u.id === user.id))
            );

            if (prev[idx].users.length < 2 || userId === userIdRef.current || duplicate) {
              prev.splice(idx, 1);

              if (chatIdRef.current === chatId)
                setRedirectTo(`/chat/${prev.length > 0 ? prev[Math.min(idx, prev.length - 1)].id : ""}`);
            }
          }

          return prev;
        });
      });

      connection.on("MessageDeleted", (chatId: number, messageId: number) => {
        setChats(prev => {
          const idx = prev.findIndex(chat => chat.id === chatId);
          
          if (idx > -1) {
            prev = prev.slice();

            const messages = prev[idx].messages
              .filter(message => message.id !== messageId)
              .map(message => message.repliedTo?.id === messageId ? { ...message, repliedTo: null } : message);

            prev[idx] = { ...prev[idx], messages };
          }

          return prev;
        });
      });

      connection.on("MessageRead", (chatId: number, messageId: number, userId: string) => {
        setChats(prev => {
          const idx = prev.findIndex(chat => chat.id === chatId);
          
          if (idx > -1) {
            const user = prev[idx].users.find(user => user.id === userId);
            
            if (user) {
              prev = prev.slice();
              
              const messages = prev[idx].messages.map(msg => 
                msg.id === messageId && !msg.readBy.some(u => u.id === user.id)
                  ? { ...msg, readBy: [...msg.readBy, user] }
                  : msg
              );

              prev[idx] = { ...prev[idx], messages };
            }
          }

          return prev;
        });
      });

      connection.on("MessageReceived", (chatId: number, message: ChatMessage) => {
        setChats(prev => {
          const idx = prev.findIndex(chat => chat.id === chatId);

          if (idx > -1) {
            prev = prev.slice();
            
            const chat = prev.splice(idx, 1)[0];
            const chatbotChatIdx = prev.findLastIndex(chat => chat.users.some(u => u.id === "chatbot"));
            
            prev.splice(chatbotChatIdx + 1, 0, { ...chat, messages: [...chat.messages, message] });
          }

          return prev;
        });
        setScrollToMessage({ id: message.id });
      });

      connection.on("MessageUpdated", (chatId: number, messageId: number, message: ChatMessage) => {
        setChats(prev => {
          const idx = prev.findIndex(chat => chat.id === chatId);

          if (idx > -1) {
            prev = prev.slice();

            const messages = prev[idx].messages.map(msg => 
              msg.id === messageId 
                ? message 
                : msg.repliedTo?.id === messageId ? { ...msg, repliedTo: message } : msg
            );

            prev[idx] = { ...prev[idx], messages };
          }

          return prev;
        });
      });

      connection.on("TypingStarted", (chatId: number, userId: string) => {
        setChats(prev => {
          const idx = prev.findIndex(chat => chat.id === chatId);

          if (idx > -1) {
            prev = prev.slice();
            const user = prev[idx].users.find(u => u.id === userId);

            if (user && !prev[idx].whoIsTyping.some(u => u.id === userId))
              prev[idx] = { ...prev[idx], whoIsTyping: [...prev[idx].whoIsTyping, user] };
          }

          return prev;
        });
      });

      connection.on("TypingStopped", (chatId: number, userId: string) => {
        setChats(prev => {
          const idx = prev.findIndex(chat => chat.id === chatId);

          if (idx > -1) {
            prev = prev.slice();
            prev[idx] = { ...prev[idx], whoIsTyping: prev[idx].whoIsTyping.filter(user => user.id !== userId) };
            return prev;
          }

          return prev;
        });
      })

      return () => {
        connection.stop().catch(error => console.error(error));
      }
    }
  }, [connection])

  useEffect(() => {
    if (chat)
      document.title = `Chat with ${getUserNames(chat.users.filter(u => u.id !== user.id))} | Job Posting Application`;
  }, [chat?.users])
  
  useEffect(() => {
    chatIdRef.current = chat?.id;
    userIdRef.current = user.id;
  }, [chat?.id, user.id])

  useEffect(() => {
    if (scrollToMessage)
      setResetScrollToMessage(true);
  }, [scrollToMessage])

  useEffect(() => {
    if (resetScrollToMessage) {
      setResetScrollToMessage(false);
      setScrollToMessage(null);
    }
  }, [resetScrollToMessage])

  function closeNewChat(redirect?: boolean) {
    if (lastChat) {
      router.push(`/chat/${lastChat}`);
    } else if (chats.length > 0) {
      const recent = chats.reduce((prev, current) => {
        if (current.messages.length > 0) {
          if (prev.messages.length === 0)
            return current;

          const lastMessageSent = new Date(current.messages[current.messages.length - 1].sentAt);
          const recentLastMessageSent = new Date(prev.messages[prev.messages.length - 1].sentAt);
          
          if (lastMessageSent > recentLastMessageSent)
            return current;
        }

        return prev;
      });

      if (redirect)
        router.replace(`/chat/${recent.id}`);
      else
        router.push(`/chat/${recent.id}`);
    }
  }

  function establishNewConnection() {
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/chatHub`, { accessTokenFactory: async () => await getValidToken() ?? "" })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          handleConnectError(newConnection, retryContext.retryReason);
          return [0, 2000, 5000, 10000, 12000, 15000, 30000, null][retryContext.previousRetryCount];
        }
      })
      .build();

    setConnection(newConnection);
    setConnectionState(newConnection.state);
  }

  function handleConnectError(connection: HubConnection, error: any) {
    if (error instanceof FailedToNegotiateWithServerError && error.message.includes("401")) {
      getValidToken().then(result => {
        if (result) {
          if (connection.state !== HubConnectionState.Reconnecting)
            establishNewConnection();
        } else {
          connection.stop();
          redirect("/login", RedirectType.replace);
        }
      });
    } else {
      setHasAttemptedConnection(true);
    }

    setConnectionState(connection.state);
  }

  return (
    <ChatContext.Provider 
      value={{ 
        chat,
        chats, 
        closeNewChat,
        connection,
        connectionState,
        existingChatErrorId,
        pendingChatbotResponse,
        scrollToMessage,
        setChats, 
        setExistingChatErrorId,
        setPendingChatbotResponse,
        setScrollToMessage,
        setShowChatList,
        setShowChatUsersDetailSection,
        showChatUsersDetailSection,
        showChatList
      }}
    > 
      <div className="flex grow">
        <div className={`min-w-80 flex-col flex-1 pb-5 shrink-0 ${(chats.length === 0 || showChatList) && !newChat ? "flex" : "hidden"} md:flex`}>  
          <div className="sticky top-0 px-5 pt-5 pb-2 z-20 bg-base-100">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">{!isAdmin ? "Your " : ""}Chats</h1>
              {!isAdmin && (
                newChat ? (
                  <button className="btn btn-primary btn-circle" onClick={() => closeNewChat()}>
                    <TbMessagePlus className="text-lg" />
                  </button>
                ) : (
                  <Link 
                    className="btn btn-primary btn-circle btn-outline" 
                    href="/chat/new" 
                    onClick={() => setLastChat(chat?.id)}
                  >
                    <TbMessagePlus className="text-lg" />
                  </Link>
                )
              )}
            </div>
            {hasAttemptedConnection && connectionState !== HubConnectionState.Connected && (
              <div className="flex justify-center items-center rounded px-3 py-2 mt-3 bg-base-content gap-2">
                <FaPlugCircleXmark className="text-base-100 shrink-0" />
                <span className="text-base-100 text-sm font-medium">
                  Connection lost. 
                  {
                    connectionState !== HubConnectionState.Disconnected 
                      ? " Attempting to reconnect..." 
                      : " Please check your internet or try to restart the connection."
                  }
                </span>
                {connectionState !== HubConnectionState.Reconnecting && (
                  connectionState === HubConnectionState.Connecting ? (
                    <div className="loading loading-ring loading-sm text-base-100 shrink-0" />
                  ) : (
                    <button className="bg-base-100 p-1.25 rounded-full" onClick={establishNewConnection}>
                      <FaRedo className="text-base-content text-xs" />
                    </button>
                  )
                )}
              </div>
            )}
          </div>
          {chats.length > 0 ? (
            <ul className="flex flex-col grow px-5">
              {chats.map(c => (
                <ChatListItem 
                  chat={c}
                  focus={existingChatErrorId === c.id}
                  key={c.id}
                  selected={c.id === chat?.id && !newChat}
                  unread={
                    c.messages.filter(message => 
                      message.sentBy.id !== user.id && 
                      !message.readBy.some(u => u.id === user.id)
                    ).length
                  }
                  user={user}
                />
              ))}
            </ul>
          ) : (
            <div className="relative grow px-5">
              <div className="absolute absolute-center-y w-full text-center opacity-40 px-5 md:hidden">
                <LuMessageSquareDashed className="mx-auto text-9xl mb-5" />
                <p className="font-medium text-lg">
                  You don&apos;t have any chats. Click the add chat button to get started.
                </p>
              </div>
            </div>
          )}
        </div>
        <aside className={`@container/chat relative w-full overflow-hidden p-5 md:pl-0 flex-3 ${newChat ? "flex" : chats.length === 0 ? "hidden md:flex" : showChatUsersDetailSection ? "hidden lg:flex" : showChatList ? "hidden md:flex" : "flex"}`}>
          {children}
        </aside>
        {!newChat && chat && showChatUsersDetailSection && (
          <aside className={`flex-col relative w-full min-w-88 ${showChatList ? "hidden" : "flex"} md:flex md:flex-3 md:border-x md:border-x-base-content/20 lg:flex-1`}>
            <button 
              className="absolute top-2.5 right-2.5 btn btn-circle btn-sm"
              onClick={() => setShowChatUsersDetailSection(false)}
            >
              <FaXmark />
            </button>
            <h2 className="text-center p-3 font-bold text-xl border-b border-b-base-content/20">
              {chat.users.length} Participants
            </h2>
            <div className="grow gap-3 pl-4 py-4 overflow-hidden">
              <div className="flex flex-col h-full gap-3 overflow-auto pr-0.75 mr-0.75 scrollbar-thin gutter-stable pointer-coarse:pr-4">
                {chat.users.map((participant, idx) => participant.id === "chatbot" ? (
                  <div className="block border border-base-content/20 rounded p-3" key={idx}>
                    <p className="flex items-center gap-2.5 font-medium px-1">
                      <FaRobot className="-translate-y-0.5" /> AI Chatbot
                    </p>
                  </div>
                ) : (
                  <Fragment key={idx}>
                    {participant.type === "Applicant" && (
                      <ApplicantCard applicant={participant} linkNewTab size="sm" user={user} />
                    )}
                    {participant.type === "Employer" && <EmployerCard employer={participant} linkNewTab size="sm" />}
                  </Fragment>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </ChatContext.Provider>
  )
}
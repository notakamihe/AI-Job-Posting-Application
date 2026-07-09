"use client"

import Typing from "@/components/animations/Typing";
import SendEdit from "@/components/icons/SendEdit";
import { getUserNames, getUserName } from "@/utils/utils";
import { Fragment, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FaBars, FaRobot } from "react-icons/fa";
import { FaXmark, FaPencil, FaEye } from "react-icons/fa6";
import { LuMessageSquareDashed } from "react-icons/lu";
import { AuthenticatedUser, ChatMessage, EntityQueryResult, FormState } from "@/types";
import { API_URL } from "@/utils/api";
import { getValidToken } from "@/actions/api/auth";
import { ChatContext } from "../../components/Chats";
import ChatMessageBubble from "./ChatMessageBubble";
import { HubConnectionState } from "@microsoft/signalr";
import Wait from "@/components/animations/Wait";
import ChatInputSection from "./ChatMessageInputSection";
import Formatted from "../../components/Formatted";
import { useRouter } from "next/navigation";

interface MessageError {
  error: string; 
  retryAction?: () => Promise<void>;
}

async function createChatbotResponseMessage(
  chatId: number, 
  messageId: number, 
  onUpdate: (update: { text: string; relevantItems: EntityQueryResult[] }) => void
) {
  const token = await getValidToken();
  const response = await fetch(`${API_URL}/api/Chats/${chatId}/messages/${messageId}/chatbot`, { 
    method: "POST", 
    headers: { "Authorization": "Bearer " + token } 
  });

  if (response.ok && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let data = "", parsed = [];
    
    while (true) {
      if (!response.ok)
        throw new Error(await response.text());
      
      const { done, value } = await reader.read();
      
      if (done)
        return { success: true, data: parsed[parsed.length - 1] };
      
      const chunk = decoder.decode(value, { stream: true });
      data += chunk;

      try {
        parsed = JSON.parse(data + (!data.endsWith("]") ? "]" : ""));
      } catch (_) { }

      if (parsed.length > 0)
        onUpdate(parsed[parsed.length - 1]);
    }
  } else {
    throw new Error();
  }
}

export default function ChatDetail({ user }: { user: AuthenticatedUser; }) {
  const router = useRouter();

  const { 
    chat,
    chats, 
    connection, 
    connectionState,
    pendingChatbotResponse,
    scrollToMessage,
    setExistingChatErrorId,
    setPendingChatbotResponse,
    setScrollToMessage,
    setShowChatUsersDetailSection,
    setShowChatList,
    showChatList,
    showChatUsersDetailSection,
  } = useContext(ChatContext)!;
 
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messageErrors, setMessageErrors] = useState<Map<number, MessageError>>(new Map<number, MessageError>());
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [text, setText] = useState("");

  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isParticipant = useMemo(() => chat?.users.some(u => u.id === user.id), [chat?.users]);
  const chatbot = useMemo(() => chat?.users.find(user => user.id === "chatbot"), [chat?.users]);

  const replyingTo = useMemo(() => {
    return chat ? chat.messages.find(message => message.id === replyingToId) : null;
  }, [chat?.messages, replyingToId])

  const editing = useMemo(() => {
    return chat ? chat.messages.find(message => message.id === editingId) : null;
  }, [chat?.messages, editingId])

  const whoIsTyping = useMemo(() => {
    return chat?.whoIsTyping ? chat.whoIsTyping.filter(u => u.id !== user.id).slice(-3) : [];
  }, [chat?.whoIsTyping])

  const respondingToIndex = useMemo(() => {
    return chat ? chat.messages.findIndex(message => message.id === pendingChatbotResponse?.respondingToId) : -1;
  }, [pendingChatbotResponse?.respondingToId, chat?.messages]);

  const otherUsers = chat?.users.filter(u => u.id !== user.id) ?? [];
  
  useEffect(() => {
    setExistingChatErrorId(null);

    if (!chat && chats.length > 0) {
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

      router.replace(`/chat/${recent.id}`);
    }
    
    goToRecentMessage();
  }, [])

  useEffect(() => {
    if (!showChatList)
      goToRecentMessage();
  }, [showChatList])

  useEffect(() => {
    if (connection && connectionState === HubConnectionState.Connected && chat) {
      if (isTyping)
        connection.invoke("StartTyping", chat.id);
      else
        connection.invoke("StopTyping", chat.id);
    }
  }, [isTyping, connectionState])

  useEffect(() => { 
    setFormState(null);
  }, [editing?.id, text]);

  async function deleteMessage(message: ChatMessage): Promise<void> {
    if (chat && connection && connectionState === HubConnectionState.Connected)
      try {
        await connection.invoke("DeleteMessage", chat.id, message.id);
      } catch (error: unknown) {
        console.error(error);
        
        const errors = new Map(messageErrors);
        errors.set(message.id, { error: "Failed to delete message.", retryAction: () => deleteMessage(message) });
        setMessageErrors(errors);
      }
  }

  function goToRecentMessage() {
    if (chat) {
      const unread = chat.messages.find(message => 
        message.sentBy.id !== user.id && 
        !message.readBy.some(u => u.id === user.id)
      );

      if (unread)
        setScrollToMessage({ id: unread.id });
      else if (chat.messages.length > 0)
        setScrollToMessage({ id: chat.messages[chat.messages.length - 1].id });
    }
  }

  function handleMessageInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);

    clearTimeout(typingTimeout.current);
    setIsTyping(true);
    typingTimeout.current = setTimeout(() => setIsTyping(false), 1000);
  }

  function markAsRead(message: ChatMessage) {
    if (isParticipant && message.sentBy.id !== user.id && !message.readBy.some(u => u.id === user.id)) {
      if (chat && connection && connectionState === HubConnectionState.Connected)
        connection.invoke("ReadMessage", chat.id, message.id).catch(err => console.error(err));
    }
  }

  function selectMessageForEdit(message: ChatMessage) {
    setEditingId(message.id)
    setText(message.message);
    setReplyingToId(null);
  }

  async function sendMessage() {
    if (chat && connection && connectionState === HubConnectionState.Connected) {
      setMessageErrors(new Map<number, MessageError>());
      setFormState(null);

      if (editing) {
        try {
          await connection.invoke("UpdateMessage", chat.id, editing.id, { 
            message: text, 
            repliedTo: editing.repliedTo?.id 
          });

          setEditingId(null);
          setText("");

          if (chatbot)
            sendChatbotMessage(editing.id);
        } catch (error: unknown) {
          console.error(error);
          setFormState({ success: false, message: "Failed to update message." });
        }
      } else {
        try {
          const result = await connection.invoke("SendMessage", chat.id, { message: text, repliedTo: replyingTo?.id });

          setReplyingToId(null);
          setText("");

          if (chatbot)
            sendChatbotMessage(result.id);
        } catch (error: unknown) {
          console.error(error);
          setFormState({ success: false, message: "Failed to send message." });
        }
      }
    }
  }

  function sendChatbotMessage(respondingToId: number) {
    if (chat) {
      setPendingChatbotResponse({ respondingToId, message: { text: "", relevantItems: [] } });
      
      createChatbotResponseMessage(chat.id, respondingToId, update => {
        setPendingChatbotResponse({ respondingToId, message: update });
      })
        .then(() => setPendingChatbotResponse(null))
        .catch(err => {
          console.error(err);
          setPendingChatbotResponse(prev => prev ? ({ ...prev, error: "Failed to get chatbot message." }) : prev);
        });
    }
  }

  if (chat || chats.length === 0) {
    return (
      <div className="relative w-full h-full flex flex-col border border-base-content/20 rounded">
        {chat ? (
          <>
            <div className="relative px-5 py-3 border-b border-b-base-content/20 text-lg text-center font-medium">
              <span
                className="hover:text-primary cursor-pointer line-clamp-2"
                onClick={() => setShowChatUsersDetailSection(!showChatUsersDetailSection)}
              >
                {getUserNames(otherUsers)}
              </span>
            </div>
            <div className="flex flex-col grow p-3 md:p-5 overflow-auto" id="messages-container">
              {chat.messages.length > 0 ? chat.messages.map((message, idx) => {
                const sentAt = new Date(message.sentAt);
                const updatedAt = new Date(message.updatedAt);

                const showDate = 
                  idx === 0 || 
                  new Date(chat.messages[idx - 1].sentAt).toDateString() !== sentAt.toDateString();
                const showUserName = 
                  message.sentBy.id !== user.id && 
                  (otherUsers.length > 1 || !otherUsers.some(user => user.id === message.sentBy.id)) && 
                  (showDate || chat.messages[idx - 1].sentBy.id !== message.sentBy.id);

                const error = messageErrors.get(message.id);
                const hide = 
                  chatbot && 
                  !pendingChatbotResponse?.error && 
                  respondingToIndex > -1 && 
                  idx > respondingToIndex;
                
                return !hide ? (
                  <Fragment key={message.id}>
                    {showDate && ( 
                      <p className="font-bold text-base-content/60 text-right pr-3 mb-3">
                        {sentAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                    <div className={`chat flex flex-col px-3 ${message.sentBy.id === user.id ? "chat-end" : "chat-start"}`}>
                      {showUserName && (
                        <div className="chat-header text-[0.95rem] font-medium">
                          {getUserName(message.sentBy)}
                        </div>
                      )}
                      <p className="chat-header text-base-content/60">
                        {sentAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        {+updatedAt > +sentAt && (
                          <span>
                            (edited
                            {updatedAt.toDateString() !== sentAt.toDateString() ? " " + updatedAt.toLocaleDateString() : ""}
                            &nbsp;{updatedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })})
                          </span>
                        )}
                      </p>
                      {message.sentBy.id === user.id && message.readBy.length > 0 && (
                        <div className="flex justify-end items-center gap-1.75">
                          {otherUsers.length > 1 && (
                            <div className="flex gap-px">
                              {message.readBy.map(user => (
                                <div className="rounded-full bg-primary/75 h-1.5 w-1.5" key={user.id} />
                              ))}
                              {Array.from({ length: otherUsers.length - message.readBy.length }, (_, idx) => (
                                <div className="rounded-full border border-base-content/35 h-1.5 w-1.5" key={idx} />
                              ))}
                            </div>
                          )}
                          <FaEye className="text-xs opacity-35" />
                        </div>
                      )}
                      <ChatMessageBubble
                        allowDelete={!chatbot && connectionState === HubConnectionState.Connected}
                        allowReply={isParticipant && !editing}
                        allowRetry={
                          chatbot && 
                          (!pendingChatbotResponse || !!pendingChatbotResponse?.error) &&
                          chat.messages[Math.min(idx + 1, chat.messages.length - 1)].sentBy.id !== "chatbot"
                        }
                        edit={editingId === message.id}
                        editable={connectionState === HubConnectionState.Connected} 
                        error={error?.error}
                        errorRetryAction={error?.retryAction}
                        focus={scrollToMessage?.id === message.id}
                        focusAnchor={scrollToMessage?.focusAnchor}
                        items={message.items}
                        onDelete={() => deleteMessage(message)}
                        onEdit={() => selectMessageForEdit(message)}
                        onRead={() => markAsRead(message)}
                        onReply={() => setReplyingToId(replyingToId === message.id ? null : message.id)}
                        onRepliedToClick={() => setScrollToMessage({ id: message.repliedTo!.id })}
                        onRetry={() => sendChatbotMessage(message.id)}
                        replyingTo={message.repliedTo}
                        replyMode={replyingToId === message.id}
                        sender={message.sentBy}
                        text={editingId === message.id ? text : message.message}
                        user={user}
                      />
                    </div>
                    {chat && chatbot && message.id === pendingChatbotResponse?.respondingToId && (
                      <div className="px-3">
                        <div className="chat flex flex-col chat-start">
                          <ChatMessageBubble
                            error={pendingChatbotResponse.error}
                            errorRetryAction={() => sendChatbotMessage(pendingChatbotResponse.respondingToId)}
                            focus
                            focusAnchor="bottom"
                            items={pendingChatbotResponse.message.relevantItems}
                            loading={!pendingChatbotResponse.message.text && !pendingChatbotResponse.error}
                            sender={chatbot}
                            text={pendingChatbotResponse.message.text}
                            user={user}
                          />
                        </div>
                      </div>
                    )}
                  </Fragment>
                ) : null
              }) : (
                <p className="m-auto text-base-content/50 font-medium text-center">
                  No messages yet{isParticipant ? "! Spark up a conversation by sending a new message." : "."}
                </p>
              )}
            </div>
            {isParticipant && (
              <div className="p-3 pt-0 md:pt-0 md:p-5">
                <ChatInputSection 
                  disableSend={
                    connectionState !== HubConnectionState.Connected || 
                    pendingChatbotResponse && !pendingChatbotResponse.error ||
                    !text.trim() 
                  }
                  error={!formState?.success ? formState?.message : undefined}
                  icon={
                    pendingChatbotResponse && !pendingChatbotResponse.error 
                      ? <Wait />
                      : editing ? <SendEdit className="translate-x-px" /> : undefined
                  }
                  onChange={handleMessageInputChange}
                  onSend={sendMessage}
                  text={text}
                >
                  <div className="flex flex-col gap-x-1 px-3 @2xl/chat:flex-row @2xl/chat:items-end">
                    <div className="grow">
                      {replyingTo && (
                        <div className="mb-1">
                          <div className="w-fit flex items-center bg-primary text-white text-[0.95rem] px-2 py-1.5 rounded mb-1 pointer-events-auto">
                            <button className="mr-1 cursor-pointer" onClick={() => setReplyingToId(null)}>
                              <FaXmark />
                            </button>
                            <span className="leading-none">
                              Replying to:&nbsp;
                              <span className="font-bold">
                                {replyingTo.sentBy.id === user.id ? "you" : getUserName(replyingTo.sentBy)}
                              </span> 
                            </span>
                          </div>
                          <p 
                            className="w-fit text-primary text-sm bg-base-100 border border-primary/50 px-3 py-1 rounded-md line-clamp-3 text-left cursor-pointer pointer-events-auto"
                            onClick={() => setScrollToMessage({ id: replyingTo.id })}
                          >
                            <Formatted text={replyingTo.message} />
                          </p>
                        </div>
                      )}
                      {editing && (
                        <div className="flex justify-between items-end gap-3 mb-2">
                          <button 
                            className="flex items-center gap-1.5 bg-base-100 px-2.5 py-0.5 border border-primary rounded-full font-medium text-sm text-primary pointer-events-auto"
                            onClick={() => setScrollToMessage({ id: editing.id })}
                          >
                            <FaPencil className="text-xs" />
                            <span>
                              {new Date(editing.updatedAt).toLocaleDateString()} at 
                              {" " + new Date(editing.updatedAt).toLocaleTimeString()}
                            </span>
                          </button>
                          <button 
                            className="btn btn-sm pointer-events-auto" 
                            onClick={() => { setEditingId(null); setText(""); }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    {whoIsTyping.length > 0 && (
                      <div className="flex flex-wrap overflow-auto scrollbar-none mb-1 justify-end shrink-0 @2xl:max-w-80 @2xl:flex-col @2xl:items-end">
                        {whoIsTyping.map((user, idx) => (
                          <div 
                            className="inline-flex text-sm rounded text-primary font-medium shrink-0 px-1 bg-base-100/75 pointer-events-auto" 
                            key={idx}
                          >
                            <span className="px-1">{getUserName(user)}</span>
                            <Typing className="text-primary ml-1 translate-y-px" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ChatInputSection>
              </div>
            )}
            {chatbot && (
              <div className="absolute absolute-center-x -translate-y-1/2 p-1.25 bg-base-100 rounded-full border border-base-content/20">
                <FaRobot className="-translate-y-px" />
              </div>
            )}
          </>
        ) : chats.length === 0 && (
          <div className="absolute absolute-center-y w-full text-center opacity-40 px-5">
            <LuMessageSquareDashed className="mx-auto text-9xl mb-5" />
            <p className="font-medium text-lg">
              You don&apos;t have any chats. Click the add chat button to get started.
            </p>
          </div>
        )}
        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3">
          <button className="btn btn-sm btn-circle bg-base-100 md:hidden" onClick={() => setShowChatList(true)}>
            <FaBars />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
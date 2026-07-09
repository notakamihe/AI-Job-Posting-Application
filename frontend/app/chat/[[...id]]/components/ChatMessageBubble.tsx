import JobPostCard from "@/components/JobPostCard";
import { AuthenticatedUser, ChatMessageBase, EntityQueryResult, User } from "@/types";
import { getUserName } from "@/utils/utils";
import { useState, useRef, useEffect } from "react";
import { BiSolidMessageEdit } from "react-icons/bi";
import { FaReply, FaTrash } from "react-icons/fa";
import { FaRotateRight, FaEllipsisVertical, FaPencil } from "react-icons/fa6";
import { MdError } from "react-icons/md";
import ApplicantCard from "@/components/ApplicantCard";
import EmployerCard from "@/components/EmployerCard";
import Formatted from "../../components/Formatted";

interface ChatMessageBubbleBaseProps {
  error?: string;
  focus?: boolean;
  focusAnchor?: "top" | "center" | "bottom" | "auto";
  items?: EntityQueryResult[];
  loading?: boolean;
  onRead?: () => void;
  onRepliedToClick?: () => void;
  replyingTo?: ChatMessageBase | null;
  sender: User;
  text: string;
  user: AuthenticatedUser;
}

function calculateReadingTime(text: string) {
  const readingSpeed = 250;
  const words = text.split(/\s+/).filter(Boolean);
  return words.length / readingSpeed * 60;
}

function ChatMessageBubbleContent({ 
  error, 
  focus, 
  focusAnchor,
  items, 
  loading, 
  onRead, 
  onRepliedToClick, 
  replyingTo, 
  sender, 
  text, 
  user 
} : ChatMessageBubbleBaseProps) {  
  const [isReading, setIsReading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  
  const isSentByUser = sender.id === user.id;

  useEffect(() => {
    containerRef.current = document.getElementById("messages-container") as HTMLDivElement;
  }, [])
  
  useEffect(() => {
    const heightRatio = ref.current && containerRef.current 
      ? containerRef.current.clientHeight / ref.current.clientHeight 
      : 1;
    const maxThreshold = 0.9 * (heightRatio < 1 ? heightRatio : 1);
    const cancelThreshold = 0.1 * (heightRatio < 1 ? heightRatio : 1);

    function callback(entries: IntersectionObserverEntry[]) {
      if (entries[0].intersectionRatio >= maxThreshold)
        setIsReading(true);
      else if (entries[0].intersectionRatio <= cancelThreshold)
        setIsReading(false);
    }
    
    const observer = new IntersectionObserver(callback, { 
      root: containerRef.current, 
      threshold: [0, cancelThreshold, maxThreshold] 
    });
    
    if (ref.current)
      observer.observe(ref.current);

    return () => observer.disconnect();
  }, [text])

  useEffect(() => {
    if (isReading) {
      if (onRead)
        timeout.current = setTimeout(onRead, calculateReadingTime(text) * 1000);
    }
    
    return () => clearTimeout(timeout.current);    
  }, [isReading, text])

  useEffect(() => {
    if (focus && ref.current) {
      const topAnchor = ref.current.children[ref.current.childElementCount - 3];
      const centerAnchor = ref.current.children[ref.current.childElementCount - 2];
      const bottomAnchor = ref.current.children[ref.current.childElementCount - 1];
      
      switch (focusAnchor) {
        case "top":
          topAnchor.scrollIntoView({ block: "start", container: "nearest" });
          break;
        case "center":
          centerAnchor.scrollIntoView({ block: "center", container: "nearest" });
          break;
        case "bottom":
          bottomAnchor.scrollIntoView({ block: "end", container: "nearest" });
          break;
        default:
          if (containerRef.current && containerRef.current.clientHeight < ref.current.clientHeight)
            topAnchor.scrollIntoView({ block: "start", container: "nearest" });
          else
            centerAnchor.scrollIntoView({ block: "center", container: "nearest" });   
      }
    }
  }, [focus, focusAnchor, text, items])

  return (
    <>
      <div 
        className={`whitespace-pre-wrap relative max-w-xl chat-bubble ${error ? "bg-error/20 text-error" : isSentByUser ? "chat-bubble-primary" : ""} ${replyingTo ? "rounded-b-none" : ""} ${!loading && items && items?.length > 0 ? "min-w-70" : !loading && replyingTo ? "min-w-40" : ""}`}
        ref={ref}
      >
        {loading ? <span className="loading loading-dots loading-lg" /> : <Formatted text={text} />}
        <div className="top-anchor absolute -top-14" />
        <div className="center-anchor absolute absolute-center-y" />
        <div className="bottom-anchor absolute -bottom-10" />
      </div>
      {!loading && replyingTo && (
        <div className="flex relative" onTouchStart={e => e.stopPropagation()}>
          <div 
            className={`grow w-0 -mt-px py-1.5 px-3 border border-t-0 cursor-pointer hover:text-primary ${error ? "border-error/20" : isSentByUser ? "border-primary" : "border-base-300"} ${!items || items.length === 0 ? "rounded-b" : ""}`}
            onClick={onRepliedToClick}
          >
            <p className="font-medium text-[0.95rem] line-clamp-1 opacity-75">
              {replyingTo.sentBy.id === user.id ? "You" : getUserName(replyingTo.sentBy)}
            </p>
            <p className="text-sm/5.5 line-clamp-2 opacity-50">
              <Formatted text={replyingTo.message} />
            </p>
          </div>
          <div className={`absolute absolute-center-y rounded-full p-1 ${isSentByUser ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"} ${error ? "bg-[color-mix(in_srgb,var(--color-error)_20%,var(--color-base-100))]" : isSentByUser ? "bg-primary" : "bg-base-300"}`}>
            <FaReply className={`text-xs -scale-y-100 ${isSentByUser ? "-scale-x-100" : ""} ${error ? "text-error" : isSentByUser ? "text-white" : "text-base-content/75"}`} />
          </div>
        </div>
      )}
      {!loading && items && items.length > 0 && (
        <div className="flex relative" onTouchStart={e => e.stopPropagation()}>
          <div className={`flex flex-col gap-2 grow w-0 -mt-px p-2 rounded-b border border-t-0 ${error ? "border-error/20" : isSentByUser ? "border-primary" : "border-base-300"}`}>
            {items.map((item, idx) => {
              if (item.type === "JobPost") {
                return (
                  <JobPostCard 
                    brief 
                    className="p-3! rounded!" 
                    key={idx} 
                    linkNewTab
                    post={item} 
                    size="sm"
                    user={user}
                  />
                )
              } else if (item.type === "Applicant") {
                return (
                  <ApplicantCard 
                    applicant={item} 
                    className="px-3! py-3!" 
                    key={idx} 
                    linkNewTab 
                    size="sm" 
                    user={null} 
                  />
                );
              } else if (item.type === "Employer") {
                return <EmployerCard className="px-3! py-3!" employer={item} key={idx} linkNewTab size="sm" />;
              }
            })}
          </div>
        </div>
      ) }
    </>
  )
}

interface ChatMessageBubbleProps extends ChatMessageBubbleBaseProps {
  allowDelete?: boolean;
  allowReply?: boolean;
  allowRetry?: boolean;
  edit?: boolean;
  editable?: boolean;
  errorRetryAction?: () => void | Promise<void>;
  hideBubble?: boolean;
  onDelete?: () => Promise<void>;
  onEdit?: () => void;
  onReply?: () => void;
  onRetry?: () => void;
  replyMode?: boolean;
}

export default function ChatMessageBubble({ 
  allowDelete,
  allowReply, 
  allowRetry,
  edit, 
  editable,
  error,
  errorRetryAction,
  hideBubble,
  onDelete, 
  onEdit,
  onReply,
  onRetry,
  replyMode,
  sender,
  user,
  ...rest
}: ChatMessageBubbleProps) {
  const [isPending, setIsPending] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isSentByUser = sender.id === user.id;

  useEffect(() => {
    if (!showActions)
      return;

    function handlePointerDown(e: PointerEvent) {
      if (!(e.target as HTMLElement).closest(".message-action"))
        setShowActions(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showActions])

  function handleDelete() {
    if (document.activeElement)
      (document.activeElement as HTMLElement).blur();

    setShowActions(false);

    if (onDelete && !isPending) {
      setIsPending(true);
      onDelete().finally(() => setIsPending(false));
    }
  }

  async function retryAction() {
    if (errorRetryAction && !isPending) {
      setIsPending(true);
      
      try {
        await errorRetryAction();
      } finally {
        setIsPending(false);
      }
    }
  }

  return (
    <div className="group relative mb-0.5 mt-1">
      {error && (
        <div className={`flex justify-end items-center group/error gap-1 mb-1 ${!isSentByUser ? "flex-row-reverse" : ""}`}>
          <span className="text-sm text-red-500 font-medium mr-0.5 leading-none">{error}</span>
          <div className={`flex items-center gap-1 w-fit ${!isSentByUser ? "flex-row-reverse" : ""}`}>
            <MdError className="text-error text-xl any-pointer-fine:group-hover/error:hidden " />
            {retryAction && (
              <button 
                className="any-pointer-fine:hidden group-hover/error:inline-flex w-5 h-5 btn btn-xs btn-circle btn-outline btn-error p-1"
                onClick={retryAction}
              >
                <FaRotateRight />
              </button>
            )}
          </div>
        </div> 
      )}
      <div className="absolute top-0 -translate-y-full w-full h-7" />
      <div className={`flex items-center gap-3 ${isSentByUser ? "flex-row-reverse pl-1" : "flex-row pr-1"}`}>
        <div className="relative inline-block" onTouchStart={() => setShowActions(true)}>
          <ChatMessageBubbleContent {...rest} error={error} sender={sender} user={user} />
        </div>
        {isPending ? (
          <span className="loading loading-ring loading-sm text-primary" />
        ) : (
          <div className="flex gap-2">
            <button 
              className={`message-action btn btn-circle btn-xs reply-btn ${replyMode ? "btn-primary" : ""} ${allowReply ? `${!showActions && !replyMode ? "invisible" : ""} group-hover:visible` : "invisible"}`}
              onClick={() => { onReply?.(); setShowActions(false); }}
            >
              <FaReply className={isSentByUser ? "-scale-x-100" : ""} />
            </button>
            {isSentByUser && allowRetry && (
              <button 
                className={`message-action btn btn-circle btn-xs ${!showActions ? "invisible group-hover:visible" : ""}`} 
                onClick={() => { onRetry?.(); setShowActions(false); }}
              >
                <FaRotateRight className="rotate-120" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className={`flex leading-none h-7 ${isSentByUser ? "justify-end" : "justify-start"}`}>
        {edit ? (
          <p className="flex justify-end items-center text-primary/75 font-bold text-sm">
            <BiSolidMessageEdit className="mr-1 mt-px text-base" /> Editing
          </p>
        ) : !isPending && isSentByUser && (editable || allowDelete) && ( 
          <div className={`dropdown dropdown-left dropdown-center translate-x-1 ${showActions ? "dropdown-open" : "hidden group-hover:inline-block"}`}>
            <div className="cursor-pointer py-2 not-any-pointer-fine:hidden" role="button" tabIndex={0}>
              <FaEllipsisVertical className="text-sm" />
            </div>
            <div className="flex dropdown-content pt-1.5 not-any-pointer-fine:mr-1.25" tabIndex={0}>
              {editable && (
                <button 
                  className="message-action btn btn-primary btn-outline message-action-btn btn-sm h-auto py-1.5" 
                  onClick={() => { onEdit?.(); setShowActions(false); }}
                >
                  <FaPencil />Edit
                </button>
              )}
              {allowDelete && (
                <button 
                  className="message-action btn btn-error btn-outline message-action-btn btn-sm ml-2 mr-0.5 h-auto py-1.5"
                  onClick={handleDelete}
                >
                  <FaTrash />Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
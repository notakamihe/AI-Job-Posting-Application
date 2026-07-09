import { IoSend } from "react-icons/io5";
import { JSX, PropsWithChildren, useState } from "react";

interface ChatMessageInputSectionProps extends PropsWithChildren {
  disableInput?: boolean;
  disableSend?: boolean;
  error?: string;
  icon?: JSX.Element;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => Promise<void>;
  text: string;
}

export default function ChatMessageInputSection({ 
  children, 
  disableInput, 
  disableSend, 
  error, 
  icon, 
  onChange, 
  onSend, 
  text 
}: ChatMessageInputSectionProps) {
  const [isPending, setIsPending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isPending) {
      setIsPending(true);
      onSend().finally(() => setIsPending(false));
    }
  }

  return (
    <div className="relative">
      <div className="absolute top-0 -translate-y-full w-full pointer-events-none">
        {children}
        {error && (
          <div className="mb-2 text-right px-3">
            <p className="bg-base-100 inline-block">
              <span className="inline-block text-error bg-error/15 rounded font-medium py-0.5 px-3 pointer-events-auto">
                {error}
              </span>
            </p>
          </div>
        )}
      </div>
      <form 
        className={`flex items-center border border-base-content/20 rounded-3xl p-2 gap-5 ${disableInput ? "opacity-50" : ""}`}
        onSubmit={handleSubmit}
      >
        <div className="relative min-h-6 grow ml-2 line-clamp-5">
          <textarea 
            className="absolute inset-0 resize-none outline-hidden placeholder:whitespace-nowrap placeholder:overflow-hidden"
            disabled={disableInput} 
            onChange={onChange} 
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter")
                e.currentTarget.form?.requestSubmit();
            }}
            placeholder={!disableInput ? "Enter your message" : ""}
            value={text}
          />
          <p className="invisible whitespace-pre-wrap">{text + "."}</p>
        </div>
        {isPending ? (
          <div className="p-1.5">
            <span className="loading loading-lg loading-ring text-primary" />
          </div>
        ) : (
          <div className="self-stretch">
            <button 
              className="btn btn-circle btn-primary rounded-3xl h-full min-h-10 text-base" 
              disabled={disableInput || disableSend}
            >
              {icon ?? <IoSend className="translate-x-px" />}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
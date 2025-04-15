import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  content: string;
  sender: "me" | "them";
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  friendImageCID?: string;
}

export function ChatMessage({
  content,
  sender,
  timestamp,
  status,
  friendImageCID,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex gap-2 max-w-[80%]",
        sender === "me" ? "ml-auto flex-row-reverse" : ""
      )}
    >
      {sender === "them" && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage
            src={`https://bronze-quickest-snake-412.mypinata.cloud/ipfs/${friendImageCID}`}
          />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col">
        <div
          className={cn(
            "rounded-lg p-3",
            sender === "me" ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          <p>{content}</p>
        </div>

        <div
          className={cn(
            "flex items-center text-xs text-muted-foreground mt-1",
            sender === "me" ? "justify-end" : ""
          )}
        >
          <span>{timestamp}</span>

          {sender === "me" && status && (
            <span className="ml-1">
              {status === "sent" && <Check className="h-3 w-3" />}
              {status === "delivered" && <CheckCheck className="h-3 w-3" />}
              {status === "read" && (
                <CheckCheck className="h-3 w-3 text-primary" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

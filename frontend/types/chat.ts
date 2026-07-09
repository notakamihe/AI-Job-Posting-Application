import { EntityQueryResult } from ".";
import { User } from "./user";

export interface Chat {
  id: number;
  users: User[];
  messages: ChatMessage[];
}

export interface ChatMessageBase {
  id: number;
  sentBy: User;
  sentAt: string;
  updatedAt: string;
  message: string;
  readBy: User[];
  items: EntityQueryResult[];
}

export interface ChatMessage extends ChatMessageBase {
  repliedTo: ChatMessageBase | null;
}
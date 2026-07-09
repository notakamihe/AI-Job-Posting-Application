import { User } from "@/types";
import { months } from "./constants";

export function debounce<T extends unknown[]>(callback: (...args: T) => void, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
 
  return (...args: T) => {
    clearTimeout(timeout);
 
    timeout = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

export function formatDecimal(n: number) {
  return n === Math.floor(n) ? n.toString() : n.toFixed(2);
}

export function getMonthString(n: number) {
  return months[n - 1];
}

export function getPayRangeString(lowEnd: number | null, highEnd: number | null) {
  if (lowEnd !== null && highEnd !== null)
    return `$${formatDecimal(lowEnd)}-${formatDecimal(highEnd)}`;
  else if (lowEnd !== null)
    return `$${formatDecimal(lowEnd)}+`
  else if (highEnd !== null)
    return `Up to $${formatDecimal(highEnd)}`;
  else return "";
}

export function getUserName(user: User) {
  if (user.id === "chatbot")
    return "AI Chatbot";
  else if (user.type === "Applicant")
    return `${user.firstName} ${user.middleName ?? ""} ${user.lastName}`;
  else if (user.type === "Employer")
    return user.name;
  return "";
}

export function getUserNames(users: User[]) {
  const names = users.map(user => getUserName(user));

  if (users.length > 1)
    return `${names.slice(0, users.length - 1).join(", ")} & ${names[users.length - 1]}`;
  else
    return names.join("");
}

export function preventSubmitOnEnter(e: React.KeyboardEvent) {
  if (!(e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement) && e.key === "Enter")
    e.preventDefault();
}

export function timeAgo(date: Date) {
  const elapsed = Date.now() - +date;

  const units = [
    { name: "year", factor: 1000 * 60 * 60 * 24 * (365 / 12) * 12 },
    { name: "month", factor: 1000 * 60 * 60 * 24 * (365 / 12) },
    { name: "week", factor: 1000 * 60 * 60 * 24 * 7 },
    { name: "day", factor: 1000 * 60 * 60 * 24 },
    { name: "hour", factor: 1000 * 60 * 60 },
    { name: "minute", factor: 1000 * 60 },
    { name: "second", factor: 1000 },
  ];

  for (const unit of units) {
    if (elapsed >= unit.factor) {
      const value = Math.floor(elapsed / unit.factor);
      return `${value} ${unit.name}${value > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

export function trimLink(link: string) {
  if (link) {
    if (link.startsWith("https://"))
      link = link.replace(/^https:\/\//, "");
    else if (link.startsWith("http://"))
      link = link.replace(/^http:\/\//, "");
  
    link = link.replace(/^www\./, "");
  }

  return link;
}
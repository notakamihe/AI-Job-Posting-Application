export default function Highlightable({ text, highlight }: { text?: string | null; highlight?: string | null; }) {
  if (!text || !highlight)
    return text;

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => regex.test(part) ? <mark key={i}>{part}</mark> : part);
}
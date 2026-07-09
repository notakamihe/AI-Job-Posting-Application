export default function Formatted({ text }: { text: string; }) {
  let formatted = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/\_(.+?)\_/g, "<em>$1</em>");
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}
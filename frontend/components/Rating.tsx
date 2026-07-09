import { ChangeEvent } from "react";

interface RatingProps {
  className?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  size?: "xs" | "sm" | "md";
  value: number;
}

export default function Rating({ className, onChange, readOnly, size, value }: RatingProps) {
  return (
    <span className={`rating rating-half ${size === "xs" ? "rating-xs" : size === "sm" ? "rating-sm" : ""} ${className}`}>
      {Array.from({ length: 10 }, (_, idx) => {
        const rating = 0.5 * (idx + 1);
        const checked = idx + 1 === Math.ceil(value / 0.5);
        const percent = 100 - (rating - value) / 0.5 * 100;
        const gradient = `linear-gradient(to right, var(--color-amber-500) ${percent}%, oklch(from var(--color-amber-500) l c h / 0.2) ${percent}%)`;
        
        return readOnly ? (
          <span 
            aria-current={checked ? "true" : undefined} 
            className={`mask mask-star-2 ${(idx % 2 === 0) ? "mask-half-1" : "mask-half-2"} ${!checked ? "bg-amber-500" : "bg-transparent"}`}
            key={idx}
            style={{ backgroundImage: checked ? gradient : undefined }}
          />
        ) : (
          <input 
            className={`mask mask-star-2 ${(idx % 2 === 0) ? "mask-half-1" : "mask-half-2"} ${!checked ? "bg-amber-500" : "bg-transparent"}`}
            checked={checked}
            key={idx}
            onChange={onChange}
            style={{ backgroundImage: checked ? gradient : undefined }}
            type="radio"
            value={rating}
          />
        );
      })}
    </span>
  )
}
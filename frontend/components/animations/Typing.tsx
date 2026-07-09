import { Geist_Mono } from "next/font/google";
import { HTMLProps } from "react";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Typing({ className, ...rest }: HTMLProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 437 158" {...rest} className={`w-12 ${className}`}>
      <g className="animate-key-press fill-base-100">
        <rect className="fill-inherit stroke-current" x="5" y="5" width="126" height="126" rx="25" strokeWidth="10" />
        <text 
          className={`animate-key-press-text text-[6rem] font-bold fill-current ${geistMono.className}`} 
          x="38" 
          y="100"
        >
          A
        </text>
      </g>
      <g className="animate-key-press fill-base-100" style={{ animationDelay: "0.25s" }}>
        <rect className="fill-inherit stroke-current" x="155" y="5" width="126" height="126" rx="25" strokeWidth="10" />
        <text 
          className={`animate-key-press-text text-[6rem] font-bold fill-current ${geistMono.className}`} 
          x="190" 
          y="100"
          style={{ animationDelay: "0.25s" }}
        >
          S
        </text>
      </g>
      <g className="animate-key-press fill-base-100" style={{ animationDelay: "0.5s" }}>
        <rect className="fill-inherit stroke-current" x="305" y="5" width="126" height="126" rx="25" strokeWidth="10" />
        <text 
          className={`animate-key-press-text text-[6rem] font-bold fill-current ${geistMono.className}`} 
          x="340" 
          y="100"
          style={{ animationDelay: "0.5s" }}
        >
          D
        </text>
      </g>
    </svg>
  )
}
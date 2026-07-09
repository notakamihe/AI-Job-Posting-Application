import { HTMLProps } from "react";
import { FaHourglassEnd, FaHourglassHalf, FaHourglassStart } from "react-icons/fa";

export default function Wait({ className, ...rest }: HTMLProps<SVGSVGElement>) {
  return (
    <span className="relative">
      <FaHourglassStart {...rest} className={`${className} top-0 opacity-0 animate-hourglass-cycle`} />
      <FaHourglassHalf 
        {...rest} 
        className={`${className} absolute top-0 opacity-0 animate-hourglass-cycle`} 
        style={{ animationDelay: "0.5s" }} 
      />
      <FaHourglassEnd 
        {...rest} 
        className={`${className} absolute top-0 opacity-0 animate-hourglass-cycle`} 
        style={{ animationDelay: "1s" }} 
      />
      <FaHourglassEnd {...rest} className={`${className} absolute top-0 opacity-0 animate-hourglass-flip`} />
    </span>
  )
}
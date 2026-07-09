import { RefObject, useEffect, useState } from "react";

type ElementOrRef<T extends HTMLElement> = HTMLElement | RefObject<T | null> | null | undefined;

export function useResizeObserver<T extends HTMLElement = HTMLElement>(
  elementOrRef: ElementOrRef<T>,
  options?: { onResize?: () => void, includeChildren?: boolean }
) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let element: HTMLElement | null = null;

    if (elementOrRef instanceof HTMLElement)
      element = elementOrRef;
    else if (elementOrRef)
      element = elementOrRef.current;

    const observer = new ResizeObserver(() => {
      options?.onResize?.();

      if (element && (element.clientWidth !== size.width || element.clientHeight !== size.height))
        setSize({ width: element.clientWidth, height: element.clientHeight });
    });

    if (element) {
      observer.observe(element);
  
      if (options?.includeChildren) {
        for (const child of element.children)
          observer.observe(child);
      }
    }

    return () => observer.disconnect();
  }, [elementOrRef, options?.onResize, options?.includeChildren]);

  return size;
}
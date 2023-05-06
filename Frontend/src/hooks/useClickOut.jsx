import { useEffect } from "react";

export default function useClickOut(ref, callback) {
  useEffect(() => {
    function clickedOut(event) {
      if (ref.current && !ref.current.contains(event.target)) callback();
    }
    document.addEventListener("mousedown", clickedOut);
    return () => {
      document.removeEventListener("mousedown", clickedOut);
    };
  }, [ref]);
}

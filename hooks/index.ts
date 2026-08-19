import { useState, useEffect, useCallback, useRef } from "react";

export * from "./useSubscription";
export { useVoiceInput, useSpeech } from "./useVoice";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query, matches]);

  return matches;
}

export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [callback]);
  return ref;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useCopyToClipboard(): [string | null, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      console.error("Failed to copy");
    }
  }, []);
  return [copied, copy];
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === key) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Auto-scroll hook that keeps a container pinned to the bottom as new content
 * arrives (e.g. chat messages, streaming text). If the user scrolls up
 * manually, auto-scroll pauses until they scroll back near the bottom.
 *
 * Unlike the previous version, this uses a MutationObserver on the container
 * to detect content changes (including streaming text that grows the
 * scrollHeight) and scrolls immediately — not just on React re-renders.
 */
export function useAutoScroll<T extends HTMLElement>(deps: unknown[]): React.RefObject<T> {
  const ref = useRef<T>(null);
  const userScrolledUp = useRef(false);

  // Track if user manually scrolled away from the bottom
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      userScrolledUp.current = !atBottom;
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // MutationObserver: catches DOM mutations (new messages, streaming text
  // growing, images loading) and scrolls to bottom if the user hasn't
  // scrolled away. This is the key fix — it works even when React batches
  // updates and the deps array doesn't trigger between renders.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const scrollToBottom = () => {
      if (userScrolledUp.current) return;
      el.scrollTop = el.scrollHeight;
    };

    const observer = new MutationObserver(() => {
      scrollToBottom();
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  // Also scroll on deps change (covers cases where MutationObserver doesn't
  // fire — e.g. conversation switch where content is swapped, not mutated)
  useEffect(() => {
    const el = ref.current;
    if (!el || userScrolledUp.current) return;

    const raf = requestAnimationFrame(() => {
      if (!ref.current || userScrolledUp.current) return;
      ref.current.scrollTop = ref.current.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(initial));
    } catch {
      return initial;
    }
  });
  const set = useCallback(
    (v: T) => {
      setValue(v);
      localStorage.setItem(key, JSON.stringify(v));
    },
    [key]
  );
  return [value, set];
}

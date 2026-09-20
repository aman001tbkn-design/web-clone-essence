import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioLine } from "@/lib/research";

export type SpeechStatus = "idle" | "playing" | "paused";

export function useSpeech() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [currentLine, setCurrentLine] = useState(-1);
  const cancelled = useRef(false);

  const stop = useCallback(() => {
    if (!supported) return;
    cancelled.current = true;
    window.speechSynthesis.cancel();
    setStatus("idle");
    setCurrentLine(-1);
  }, [supported]);

  useEffect(() => stop, [stop]);

  const play = useCallback(
    (lines: AudioLine[]) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      cancelled.current = false;
      const voices = window.speechSynthesis.getVoices();
      const english = voices.filter((v) => v.lang.startsWith("en"));
      const voiceA = english[0] ?? voices[0];
      const voiceB = english.find((v) => v !== voiceA) ?? voiceA;

      lines.forEach((line, i) => {
        const utterance = new SpeechSynthesisUtterance(line.text);
        if (line.speaker === "Host A" && voiceA) utterance.voice = voiceA;
        if (line.speaker === "Host B" && voiceB) utterance.voice = voiceB;
        utterance.pitch = line.speaker === "Host A" ? 1 : 0.85;
        utterance.rate = 1;
        utterance.onstart = () => {
          if (!cancelled.current) setCurrentLine(i);
        };
        if (i === lines.length - 1) {
          utterance.onend = () => {
            if (!cancelled.current) {
              setStatus("idle");
              setCurrentLine(-1);
            }
          };
        }
        window.speechSynthesis.speak(utterance);
      });
      setStatus("playing");
    },
    [supported],
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setStatus("paused");
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setStatus("playing");
  }, [supported]);

  return { supported, status, currentLine, play, pause, resume, stop };
}

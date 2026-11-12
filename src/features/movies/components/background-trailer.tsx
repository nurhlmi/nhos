"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import { listen, parsePlayerMessage, sendCommand, youtubeEmbedUrl } from "@/features/movies/youtube";

const CONTROL =
  "flex size-9 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white transition-colors outline-none hover:bg-black/70 focus-visible:ring-3 focus-visible:ring-white/70 pointer-coarse:size-11 [&_svg]:size-4";

/** Browsers may refuse autoplay with sound; after this long without playback we retry muted. */
const UNMUTED_GRACE_MS = 2500;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const useReducedMotion = () =>
  useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => true);

/**
 * Looping trailer that fills its positioned parent, used behind the billboard
 * and at the top of the detail dialog. The still image underneath stays until
 * YouTube reports the video is actually playing, so a slow load or a video
 * that refuses to embed never shows a black frame. Visitors who ask for
 * reduced motion get the still image and can start the video themselves.
 */
export function BackgroundTrailer({
  videoKey,
  title,
  suspended = false,
  startMuted = true,
  controlsClassName,
}: {
  videoKey: string;
  title: string;
  /** True while another trailer is playing: hold this one where it is. */
  suspended?: boolean;
  /** The detail dialog starts with sound because the visitor just asked for it. */
  startMuted?: boolean;
  controlsClassName?: string;
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const mounted = useMounted();
  const reducedMotion = useReducedMotion();
  const [userStarted, setUserStarted] = useState(false);
  const started = !reducedMotion || userStarted;
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(startMuted);
  const [userPaused, setUserPaused] = useState(false);
  const [embedMuted] = useState(startMuted);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframe.current?.contentWindow) return;
      const event = parsePlayerMessage(e.data);
      if (event?.kind === "playing") {
        playingRef.current = true;
        setPlaying(true);
      }
      if (event?.kind === "error") setFailed(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const paused = suspended || userPaused;
  useEffect(() => {
    if (playing) sendCommand(iframe.current, paused ? "pauseVideo" : "playVideo");
  }, [paused, playing]);

  if (failed || !mounted) return null;

  const onLoad = () => {
    listen(iframe.current, videoKey);
    if (embedMuted) return;
    window.setTimeout(() => {
      if (playingRef.current || !iframe.current) return;
      sendCommand(iframe.current, "mute");
      sendCommand(iframe.current, "playVideo");
      setMuted(true);
    }, UNMUTED_GRACE_MS);
  };
  const togglePlay = () => {
    if (!started) {
      setUserStarted(true);
      return;
    }
    setUserPaused((p) => !p);
  };
  const toggleMute = () => {
    sendCommand(iframe.current, muted ? "unMute" : "mute");
    setMuted(!muted);
  };

  return (
    <>
      {started && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden [container-type:size]" aria-hidden>
          <iframe
            ref={iframe}
            src={youtubeEmbedUrl(videoKey, {
              autoplay: 1,
              mute: embedMuted ? 1 : 0,
              controls: 0,
              disablekb: 1,
              loop: 1,
              playlist: videoKey,
              enablejsapi: 1,
              origin: window.location.origin,
            })}
            title={`${title} trailer (background)`}
            tabIndex={-1}
            allow="autoplay; encrypted-media"
            onLoad={onLoad}
            // Cover the frame like object-fit: cover; the slight overscale crops YouTube's title bar.
            style={{ width: "max(100cqw, 177.78cqh)", height: "max(100cqh, 56.25cqw)" }}
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.18] border-0 transition-opacity duration-700 motion-reduce:transition-none",
              playing ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
      )}
      {(playing || !started) && (
        <div className={cn("absolute z-10 flex gap-2", controlsClassName)}>
          <button type="button" className={CONTROL} onClick={togglePlay} aria-label={paused || !started ? `Play ${title} trailer` : `Pause ${title} trailer`}>
            {paused || !started ? <Play className="fill-current" /> : <Pause className="fill-current" />}
          </button>
          {started && (
            <button type="button" className={CONTROL} onClick={toggleMute} aria-label={muted ? "Unmute trailer" : "Mute trailer"} aria-pressed={!muted}>
              {muted ? <VolumeX /> : <Volume2 />}
            </button>
          )}
        </div>
      )}
    </>
  );
}

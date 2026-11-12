/**
 * YouTube embeds through the privacy-enhanced domain. The billboard player is
 * driven with the embed's postMessage protocol (enablejsapi=1) instead of the
 * full IFrame API script: it only needs play, pause, mute and a "now playing"
 * signal.
 */
export const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com";

export function youtubeEmbedUrl(key: string, options: Record<string, string | number> = {}): string {
  const params = new URLSearchParams({ rel: "0", playsinline: "1", iv_load_policy: "3", ...stringify(options) });
  return `${YOUTUBE_ORIGIN}/embed/${encodeURIComponent(key)}?${params}`;
}

function stringify(o: Record<string, string | number>) {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));
}

type Command = "playVideo" | "pauseVideo" | "mute" | "unMute";

export function sendCommand(iframe: HTMLIFrameElement | null, func: Command) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), YOUTUBE_ORIGIN);
}

/** Asks the embed to start posting state events (onReady, infoDelivery, onError) to this window. */
export function listen(iframe: HTMLIFrameElement | null, id: string) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id, channel: "widget" }), YOUTUBE_ORIGIN);
}

export type PlayerEvent = { kind: "playing" } | { kind: "error" } | null;

/** Reads the embed's messages: player state 1 means playing; onError covers removed or embed-blocked videos. */
export function parsePlayerMessage(data: unknown): PlayerEvent {
  let msg: { event?: string; info?: unknown };
  try {
    msg = typeof data === "string" ? JSON.parse(data) : (data as typeof msg);
  } catch {
    return null;
  }
  if (!msg || typeof msg !== "object") return null;
  if (msg.event === "onError") return { kind: "error" };
  const state =
    msg.event === "onStateChange"
      ? msg.info
      : msg.event === "infoDelivery" || msg.event === "initialDelivery"
        ? (msg.info as { playerState?: number } | null)?.playerState
        : undefined;
  return state === 1 ? { kind: "playing" } : null;
}

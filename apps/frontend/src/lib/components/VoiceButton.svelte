<script lang="ts">
  import { Mic, Check, X } from "lucide-svelte";
  import { tapMedium, notifyWarning } from "$lib/haptics";

  let {
    onRecorded,
    onError,
  }: {
    onRecorded: (file: File) => void;
    onError: (message: string) => void;
  } = $props();

  let recording = $state(false);
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let elapsed = $state(0);
  let timer: ReturnType<typeof setInterval> | null = null;
  // Set when the user discards instead of sending, so `onstop` knows to drop
  // the recording rather than forward it.
  let discard = false;

  // iOS/WKWebView only records audio/mp4; Chrome prefers audio/webm. Pick
  // whatever the platform supports and name the file to match so Whisper
  // can detect the format.
  function pickMime(): { mimeType?: string; ext: string } {
    const order: [string, string][] = [
      ["audio/webm", "webm"],
      ["audio/mp4", "mp4"],
      ["audio/mpeg", "mp3"],
    ];
    for (const [mimeType, ext] of order) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mimeType))
        return { mimeType, ext };
    }
    return { ext: "m4a" };
  }

  function cleanup() {
    if (timer) clearInterval(timer);
    timer = null;
    recording = false;
    elapsed = 0;
  }

  async function start() {
    tapMedium();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      notifyWarning();
      onError(
        "Microphone access is blocked. Enable it for Eos in your device settings, then try again.",
      );
      return;
    }

    const { mimeType, ext } = pickMime();
    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunks = [];
    discard = false;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      cleanup();
      if (discard || chunks.length === 0) return;
      const type = mediaRecorder?.mimeType || mimeType || "audio/mp4";
      onRecorded(new File(chunks, `recording.${ext}`, { type }));
    };

    mediaRecorder.start();
    recording = true;
    elapsed = 0;
    timer = setInterval(() => elapsed++, 1000);
  }

  function stop(cancelled: boolean) {
    tapMedium();
    discard = cancelled;
    mediaRecorder?.stop();
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }
</script>

{#if recording}
  <div
    class="flex items-center gap-1.5 h-11 pl-1.5 pr-1.5 rounded-2xl bg-[var(--color-voice)] animate-glow-pulse"
  >
    <button
      onclick={() => stop(true)}
      aria-label="Cancel recording"
      class="w-8 h-8 rounded-xl flex items-center justify-center text-white/80
        hover:bg-white/15 transition-colors"
    >
      <X size={16} />
    </button>
    <span class="font-mono text-xs text-white/90 tracking-wider tabular-nums px-1">
      {formatTime(elapsed)}
    </span>
    <button
      onclick={() => stop(false)}
      aria-label="Send recording"
      class="w-8 h-8 rounded-xl flex items-center justify-center bg-white/15 text-white
        hover:bg-white/25 transition-colors"
    >
      <Check size={16} strokeWidth={2.5} />
    </button>
  </div>
{:else}
  <button
    onclick={start}
    aria-label="Record voice command"
    class="w-11 h-11 rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)]
      flex items-center justify-center transition-all duration-300"
  >
    <Mic size={18} class="text-[var(--color-ink-2)]" />
  </button>
{/if}

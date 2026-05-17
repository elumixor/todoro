<script lang="ts">
  import { Mic, Square } from "lucide-svelte";
  import { tapMedium } from "$lib/haptics";

  let { onRecorded }: { onRecorded: (blob: Blob) => void } = $props();
  let recording = $state(false);
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let elapsed = $state(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  async function toggle() {
    tapMedium();
    if (recording) {
      mediaRecorder?.stop();
      recording = false;
      if (timer) clearInterval(timer);
      elapsed = 0;
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: "audio/webm" });
      onRecorded(blob);
    };

    mediaRecorder.start();
    recording = true;
    elapsed = 0;
    timer = setInterval(() => elapsed++, 1000);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }
</script>

<button
  onclick={toggle}
  class="relative flex items-center gap-2.5 h-11 rounded-2xl transition-all duration-300
    {recording
    ? 'bg-[var(--color-voice)] pl-4 pr-4 animate-glow-pulse'
    : 'bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] w-11 justify-center'}"
>
  {#if recording}
    <Square size={14} fill="currentColor" class="text-bg" />
    <span class="font-mono text-xs text-white/90 tracking-wider">{formatTime(elapsed)}</span>
  {:else}
    <Mic size={18} class="text-[var(--color-ink-2)]" />
  {/if}
</button>

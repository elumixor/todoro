<script lang="ts">
  import { Mic, MicOff } from "lucide-svelte";

  let { onRecorded }: { onRecorded: (blob: Blob) => void } = $props();
  let recording = $state(false);
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  async function toggle() {
    if (recording) {
      mediaRecorder?.stop();
      recording = false;
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
  }
</script>

<button
  onclick={toggle}
  class="w-12 h-12 rounded-full flex items-center justify-center transition-all
    {recording
    ? 'bg-[var(--color-voice)] animate-pulse shadow-lg shadow-[var(--color-voice)]/30'
    : 'bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)]'}"
>
  {#if recording}
    <MicOff size={20} class="text-white" />
  {:else}
    <Mic size={20} class="text-[var(--color-ink-2)]" />
  {/if}
</button>

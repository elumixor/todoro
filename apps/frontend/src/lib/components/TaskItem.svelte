<script lang="ts">
  import { Check, Trash2, RotateCcw } from "lucide-svelte";
  import type { Task } from "$lib/api/client";

  let { task, onToggle, onDelete }: { task: Task; onToggle: (task: Task) => void; onDelete: (task: Task) => void } =
    $props();
</script>

<li class="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-surface)] group">
  <button
    onclick={() => onToggle(task)}
    class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
      {task.completed
      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
      : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'}"
  >
    {#if task.completed}
      <Check size={14} strokeWidth={3} class="text-[var(--color-bg)]" />
    {/if}
  </button>

  <span class="flex-1 text-sm {task.completed ? 'line-through opacity-40' : ''}">
    {task.text}
  </span>

  <button
    onclick={() => onDelete(task)}
    class="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
  >
    <Trash2 size={16} />
  </button>
</li>

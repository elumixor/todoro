<script lang="ts">
  import { Check, Trash2, Pencil } from "lucide-svelte";
  import type { Task } from "$lib/api";

  let {
    task,
    index,
    onToggle,
    onDelete,
    onEdit,
  }: {
    task: Task;
    index: number;
    onToggle: (task: Task) => void;
    onDelete: (task: Task) => void;
    onEdit: (task: Task, text: string) => void;
  } = $props();

  let editing = $state(false);
  let editText = $state(task.text);
  let inputEl: HTMLInputElement | undefined = $state();

  function startEdit() {
    editText = task.text;
    editing = true;
    requestAnimationFrame(() => inputEl?.focus());
  }

  function commitEdit() {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== task.text) {
      onEdit(task, trimmed);
    }
    editing = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") editing = false;
  }

  let justToggled = $state(false);
  function handleToggle() {
    justToggled = true;
    onToggle(task);
    setTimeout(() => (justToggled = false), 350);
  }
</script>

<li
  class="group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300
    {task.completed
    ? 'bg-[var(--color-done)]'
    : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]'}
    animate-fade-up"
  style="animation-delay: {index * 50}ms"
>
  <!-- Checkbox -->
  <button
    onclick={handleToggle}
    class="w-[22px] h-[22px] rounded-lg border-[1.5px] flex items-center justify-center shrink-0
      transition-all duration-300
      {task.completed
      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
      : 'border-[var(--color-ink-3)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]'}
      {justToggled ? 'animate-check-pop' : ''}"
  >
    {#if task.completed}
      <Check size={12} strokeWidth={3} class="text-[var(--color-bg)]" />
    {/if}
  </button>

  <!-- Text / Edit -->
  {#if editing}
    <input
      bind:this={inputEl}
      bind:value={editText}
      onblur={commitEdit}
      onkeydown={handleKeydown}
      class="flex-1 bg-transparent text-[13px] font-light tracking-wide outline-none
        border-b border-[var(--color-accent)] pb-0.5 text-[var(--color-ink)]"
    />
  {:else}
    <span
      class="flex-1 text-[13px] font-light tracking-wide transition-all duration-300 cursor-text
        {task.completed ? 'line-through text-[var(--color-ink-3)]' : 'text-[var(--color-ink)]'}"
      ondblclick={startEdit}
      role="textbox"
      tabindex="0"
    >
      {task.text}
    </span>
  {/if}

  <!-- Actions -->
  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
    {#if !task.completed && !editing}
      <button
        onclick={startEdit}
        class="p-1.5 rounded-lg hover:bg-[var(--color-surface-3)] transition-colors"
      >
        <Pencil size={13} class="text-[var(--color-ink-3)]" />
      </button>
    {/if}
    <button
      onclick={() => onDelete(task)}
      class="p-1.5 rounded-lg hover:bg-[var(--color-danger-glow)] transition-colors"
    >
      <Trash2 size={13} class="text-[var(--color-ink-3)] hover:text-[var(--color-danger)]" />
    </button>
  </div>
</li>

<script lang="ts">
  import { Plus, ChevronDown, ChevronUp } from "lucide-svelte";
  import type { Day, Task } from "$lib/api/client";
  import TaskItem from "./TaskItem.svelte";

  let {
    day,
    isToday,
    onAddTask,
    onToggleTask,
    onDeleteTask,
    onEditTask,
  }: {
    day: Day;
    isToday: boolean;
    onAddTask: (dayId: string, text: string) => void;
    onToggleTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
    onEditTask: (task: Task, text: string) => void;
  } = $props();

  let newTaskText = $state("");
  let collapsed = $state(!isToday);
  let inputEl: HTMLInputElement | undefined = $state();

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(day.id, newTaskText.trim());
    newTaskText = "";
    inputEl?.focus();
  }

  const completedCount = $derived(day.tasks.filter((t) => t.completed).length);
  const totalCount = $derived(day.tasks.length);
  const progress = $derived(totalCount > 0 ? (completedCount / totalCount) * 100 : 0);
  const allDone = $derived(totalCount > 0 && completedCount === totalCount);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
</script>

<section class="animate-fade-up">
  <!-- Header -->
  <button
    class="w-full flex items-center gap-3 mb-3 group/header cursor-pointer"
    onclick={() => !isToday && (collapsed = !collapsed)}
  >
    <div class="flex-1 flex items-center gap-3">
      <h2 class="text-base font-semibold tracking-tight">
        {#if isToday}
          Today
        {:else}
          {formatDate(day.date)}
        {/if}
      </h2>

      {#if totalCount > 0}
        <span class="font-mono text-[11px] tracking-wider text-[var(--color-ink-3)]
          {allDone ? 'text-[var(--color-accent)]' : ''}">
          {completedCount}/{totalCount}
        </span>
      {/if}
    </div>

    {#if !isToday}
      <div class="text-[var(--color-ink-3)] opacity-0 group-hover/header:opacity-100 transition-opacity">
        {#if collapsed}
          <ChevronDown size={16} />
        {:else}
          <ChevronUp size={16} />
        {/if}
      </div>
    {/if}
  </button>

  <!-- Progress bar -->
  {#if totalCount > 0 && !collapsed}
    <div class="progress-track mb-4">
      <div class="progress-fill" style="width: {progress}%"></div>
    </div>
  {/if}

  <!-- Tasks -->
  {#if !collapsed}
    <ul class="space-y-1.5">
      {#each day.tasks as task, i (task.id)}
        <TaskItem
          {task}
          index={i}
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onEdit={onEditTask}
        />
      {/each}
    </ul>

    <!-- Add task input -->
    {#if isToday}
      <form onsubmit={handleSubmit} class="flex gap-2 mt-3">
        <input
          bind:this={inputEl}
          type="text"
          bind:value={newTaskText}
          placeholder="What needs doing?"
          class="flex-1 px-4 py-3 rounded-2xl bg-[var(--color-surface)] text-[13px] font-light tracking-wide
            border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface-2)]
            focus:outline-none placeholder:text-[var(--color-ink-3)]
            transition-all duration-300"
        />
        <button
          type="submit"
          class="w-11 h-11 rounded-2xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
            flex items-center justify-center transition-all duration-300
            hover:shadow-lg hover:shadow-[var(--color-accent-glow)] active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} class="text-[var(--color-bg)]" />
        </button>
      </form>
    {/if}
  {/if}
</section>

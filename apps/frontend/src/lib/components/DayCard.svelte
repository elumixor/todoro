<script lang="ts">
  import { Plus } from "lucide-svelte";
  import type { Day, Task } from "$lib/api/client";
  import TaskItem from "./TaskItem.svelte";

  let {
    day,
    isToday,
    onAddTask,
    onToggleTask,
    onDeleteTask,
  }: {
    day: Day;
    isToday: boolean;
    onAddTask: (dayId: string, text: string) => void;
    onToggleTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
  } = $props();

  let newTaskText = $state("");

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(day.id, newTaskText.trim());
    newTaskText = "";
  }

  const completedCount = $derived(day.tasks.filter((t) => t.completed).length);
  const totalCount = $derived(day.tasks.length);
</script>

<section class="space-y-3">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold">
      {#if isToday}
        Today
      {:else}
        {day.date}
      {/if}
    </h2>
    {#if totalCount > 0}
      <span class="text-xs text-[var(--color-ink-3)]">{completedCount}/{totalCount}</span>
    {/if}
  </div>

  <ul class="space-y-2">
    {#each day.tasks as task (task.id)}
      <TaskItem {task} onToggle={onToggleTask} onDelete={onDeleteTask} />
    {/each}
  </ul>

  {#if isToday}
    <form onsubmit={handleSubmit} class="flex gap-2">
      <input
        type="text"
        bind:value={newTaskText}
        placeholder="Add a task..."
        class="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-surface)] text-sm
          border border-[var(--color-border)] focus:border-[var(--color-accent)]
          focus:outline-none placeholder:text-[var(--color-ink-3)]"
      />
      <button
        type="submit"
        class="w-10 h-10 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
          flex items-center justify-center transition-colors"
      >
        <Plus size={18} class="text-[var(--color-bg)]" />
      </button>
    </form>
  {/if}
</section>

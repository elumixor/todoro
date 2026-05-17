<script lang="ts">
  import type { Task } from "$lib/api";
  import { dnd } from "$lib/dnd.svelte";
  import TaskItem from "./TaskItem.svelte";

  let {
    tasks,
    listId,
    emptyHint,
    onToggleTask,
    onDeleteTask,
    onEditTask,
  }: {
    tasks: Task[];
    listId: string;
    emptyHint?: string;
    onToggleTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
    onEditTask: (task: Task, text: string) => void;
  } = $props();

  const isOver = $derived(dnd.active && dnd.overList === listId);
  // Index within the list excluding the dragged item.
  const visible = $derived(tasks.filter((t) => t.id !== dnd.taskId));
</script>

<ul
  data-dnd-list={listId}
  class="space-y-1.5 min-h-[8px] rounded-2xl transition-colors duration-200
    {isOver ? 'outline-2 outline-dashed outline-[var(--color-accent)]/40 outline-offset-4' : ''}"
>
  {#each visible as task, i (task.id)}
    {#if isOver && dnd.overIndex === i}
      <li class="h-11 rounded-2xl bg-[var(--color-accent-dim)] border border-dashed border-[var(--color-accent)]/40"></li>
    {/if}
    <TaskItem
      {task}
      index={i}
      {listId}
      onToggle={onToggleTask}
      onDelete={onDeleteTask}
      onEdit={onEditTask}
    />
  {/each}

  {#if isOver && dnd.overIndex >= visible.length}
    <li class="h-11 rounded-2xl bg-[var(--color-accent-dim)] border border-dashed border-[var(--color-accent)]/40"></li>
  {/if}

  {#if visible.length === 0 && !isOver && emptyHint}
    <li class="px-4 py-3 text-[12px] text-[var(--color-ink-3)] font-light">{emptyHint}</li>
  {/if}
</ul>

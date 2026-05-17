<script lang="ts">
  import { CalendarRange } from "lucide-svelte";
  import type { Task } from "$lib/api";
  import TaskList from "./TaskList.svelte";

  let {
    tasks,
    onToggleTask,
    onDeleteTask,
    onEditTask,
  }: {
    tasks: Task[];
    onToggleTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
    onEditTask: (task: Task, text: string) => void;
  } = $props();

  const completedCount = $derived(tasks.filter((t) => t.completed).length);
  const totalCount = $derived(tasks.length);
</script>

<section class="animate-fade-up">
  <div class="w-full flex items-center gap-3 mb-3">
    <CalendarRange size={16} class="text-[var(--color-ink-3)]" />
    <h2 class="text-base font-semibold tracking-tight flex-1">This Week</h2>
    {#if totalCount > 0}
      <span class="font-mono text-[11px] tracking-wider text-[var(--color-ink-3)]">
        {completedCount}/{totalCount}
      </span>
    {/if}
  </div>

  <TaskList
    {tasks}
    listId="week"
    emptyHint="Drag tasks here to plan your week"
    {onToggleTask}
    {onDeleteTask}
    {onEditTask}
  />
</section>

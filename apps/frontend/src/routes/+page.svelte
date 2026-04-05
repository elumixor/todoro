<script lang="ts">
  import { onMount } from "svelte";
  import { CalendarPlus, Loader2 } from "lucide-svelte";
  import { api, type Day, type Task } from "$lib/api/client";
  import DayCard from "$lib/components/DayCard.svelte";
  import VoiceButton from "$lib/components/VoiceButton.svelte";

  let days = $state<Day[]>([]);
  let loading = $state(true);
  let voiceLoading = $state(false);

  const today = new Date().toISOString().slice(0, 10);
  const todayDay = $derived(days.find((d) => d.date === today));

  onMount(async () => {
    days = await api.getDays();
    loading = false;
  });

  async function handleNewDay() {
    // Get incomplete tasks from the most recent day
    const lastDay = days[0];
    const incompleteIds = lastDay?.tasks.filter((t) => !t.completed).map((t) => t.id) ?? [];

    const newDay = await api.createDay(today, incompleteIds);
    if (newDay) days = [newDay, ...days.filter((d) => d.date !== today)];
  }

  async function handleAddTask(dayId: string, text: string) {
    const task = await api.addTask(dayId, text);
    days = days.map((d) => (d.id === dayId ? { ...d, tasks: [...d.tasks, task] } : d));
  }

  async function handleToggleTask(task: Task) {
    const updated = await api.updateTask(task.id, { completed: !task.completed });
    days = days.map((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === updated.id ? updated : t)),
    }));
  }

  async function handleDeleteTask(task: Task) {
    await api.deleteTask(task.id);
    days = days.map((d) => ({
      ...d,
      tasks: d.tasks.filter((t) => t.id !== task.id),
    }));
  }

  async function handleVoiceRecorded(blob: Blob) {
    voiceLoading = true;
    try {
      const result = await api.transcribeVoice(blob);
      if (!todayDay) await handleNewDay();

      const currentToday = days.find((d) => d.date === today);
      if (!currentToday) return;

      for (const text of result.tasks) {
        await handleAddTask(currentToday.id, text);
      }
    } finally {
      voiceLoading = false;
    }
  }
</script>

<main class="max-w-lg mx-auto px-4 py-8 safe-top safe-bottom min-h-screen">
  <header class="flex items-center justify-between mb-8">
    <h1 class="text-2xl font-bold">Todoro</h1>
    <div class="flex items-center gap-2">
      {#if voiceLoading}
        <div class="w-12 h-12 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
          <Loader2 size={20} class="animate-spin text-[var(--color-ink-2)]" />
        </div>
      {:else}
        <VoiceButton onRecorded={handleVoiceRecorded} />
      {/if}

      {#if !todayDay}
        <button
          onclick={handleNewDay}
          class="h-12 px-4 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
            flex items-center gap-2 text-sm font-medium text-[var(--color-bg)] transition-colors"
        >
          <CalendarPlus size={18} />
          New Day
        </button>
      {/if}
    </div>
  </header>

  {#if loading}
    <div class="flex justify-center py-20">
      <Loader2 size={32} class="animate-spin text-[var(--color-ink-3)]" />
    </div>
  {:else if days.length === 0}
    <div class="text-center py-20 text-[var(--color-ink-3)]">
      <p class="text-lg mb-2">No tasks yet</p>
      <p class="text-sm">Click "New Day" to start your first checklist</p>
    </div>
  {:else}
    <div class="space-y-8">
      {#each days as day (day.id)}
        <DayCard
          {day}
          isToday={day.date === today}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />
      {/each}
    </div>
  {/if}
</main>

<script lang="ts">
  import { onMount } from "svelte";
  import { CalendarPlus, Loader2, CheckCircle2 } from "lucide-svelte";
  import { api, type Day, type Task } from "$lib/api";
  import DayCard from "$lib/components/DayCard.svelte";
  import VoiceButton from "$lib/components/VoiceButton.svelte";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";

  let days = $state<Day[]>([]);
  let loading = $state(true);
  let voiceLoading = $state(false);

  const today = new Date().toISOString().slice(0, 10);
  const todayDay = $derived(days.find((d) => d.date === today));

  onMount(async () => {
    days = await api.days.$get();
    loading = false;
  });

  async function handleNewDay() {
    const lastDay = days[0];
    const incompleteIds = lastDay?.tasks.filter((t) => !t.completed).map((t) => t.id) ?? [];

    const newDay = await api.days.$post({ date: today, transferTaskIds: incompleteIds });
    if (newDay) days = [newDay, ...days.filter((d) => d.date !== today)];
  }

  async function handleAddTask(dayId: string, text: string) {
    const task = await api.tasks.$post({ dayId, text });
    days = days.map((d) => (d.id === dayId ? { ...d, tasks: [...d.tasks, task] } : d));
  }

  async function handleToggleTask(task: Task) {
    const updated = await api.tasks(task.id).$patch({ completed: !task.completed });
    days = days.map((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === updated.id ? updated : t)),
    }));
  }

  async function handleDeleteTask(task: Task) {
    await api.tasks(task.id).$delete();
    days = days.map((d) => ({
      ...d,
      tasks: d.tasks.filter((t) => t.id !== task.id),
    }));
  }

  async function handleEditTask(task: Task, text: string) {
    const updated = await api.tasks(task.id).$patch({ text });
    days = days.map((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === updated.id ? updated : t)),
    }));
  }

  async function handleVoiceRecorded(blob: Blob) {
    voiceLoading = true;
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const result = await api.voice.transcribe.$post(formData);
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

<!-- Ambient glow behind the header area -->
<div class="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none
  bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_70%)] opacity-40"></div>

<main class="relative max-w-md mx-auto px-5 pt-24 pb-12 safe-top safe-bottom min-h-screen">
  <!-- Header -->
  <header class="flex items-center justify-between mb-10 animate-fade-up">
    <div>
      <h1 class="text-xl font-bold tracking-tight">Todoro</h1>
      <p class="text-[11px] font-mono tracking-widest text-[var(--color-ink-3)] mt-0.5 uppercase">
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
      </p>
    </div>

    <div class="flex items-center gap-2">
      <ThemeToggle />
      {#if voiceLoading}
        <div class="w-11 h-11 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
          <Loader2 size={18} class="animate-spin text-[var(--color-ink-2)]" />
        </div>
      {:else}
        <VoiceButton onRecorded={handleVoiceRecorded} />
      {/if}

      {#if !todayDay}
        <button
          onclick={handleNewDay}
          class="h-11 px-5 rounded-2xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
            flex items-center gap-2 text-[13px] font-medium text-[var(--color-bg)]
            transition-all duration-300 hover:shadow-lg hover:shadow-[var(--color-accent-glow)]
            active:scale-95"
        >
          <CalendarPlus size={16} />
          New Day
        </button>
      {/if}
    </div>
  </header>

  <!-- Content -->
  {#if loading}
    <div class="flex flex-col items-center justify-center py-24 animate-fade-in">
      <Loader2 size={28} class="animate-spin text-[var(--color-ink-3)]" />
    </div>
  {:else if days.length === 0}
    <div class="flex flex-col items-center justify-center py-24 animate-fade-up text-center">
      <div class="w-16 h-16 rounded-3xl bg-[var(--color-surface)] flex items-center justify-center mb-5">
        <CheckCircle2 size={28} class="text-[var(--color-ink-3)]" />
      </div>
      <p class="text-sm font-medium text-[var(--color-ink-2)] mb-1">No tasks yet</p>
      <p class="text-xs text-[var(--color-ink-3)]">
        Tap <span class="font-medium text-[var(--color-accent)]">New Day</span> to begin
      </p>
    </div>
  {:else}
    <div class="space-y-8">
      {#each days as day, i (day.id)}
        <div style="animation-delay: {i * 80}ms">
          <DayCard
            {day}
            isToday={day.date === today}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
          />
        </div>

        <!-- Separator between days -->
        {#if i < days.length - 1}
          <div class="border-t border-[var(--color-border)] mx-8"></div>
        {/if}
      {/each}
    </div>
  {/if}
</main>

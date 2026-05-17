<script lang="ts">
  import { Check, Trash2, Pencil, GripVertical, Copy } from "lucide-svelte";
  import type { Task } from "$lib/api";
  import { dnd } from "$lib/dnd.svelte";
  import { notifySuccess, notifyWarning, tapLight, tapMedium } from "$lib/haptics";
  import TaskContent from "./TaskContent.svelte";
  import RichTaskInput from "./RichTaskInput.svelte";

  let {
    task,
    index,
    listId,
    onToggle,
    onDelete,
    onEdit,
    onDuplicate,
  }: {
    task: Task;
    index: number;
    listId: string;
    onToggle: (task: Task) => void;
    onDelete: (task: Task) => void;
    onEdit: (task: Task, text: string) => void;
    onDuplicate: (task: Task) => void;
  } = $props();

  let el: HTMLLIElement | undefined = $state();
  const isDragging = $derived(dnd.taskId === task.id);

  function handleGripDown(e: PointerEvent) {
    e.preventDefault();
    tapLight();
    const width = el?.getBoundingClientRect().width ?? 0;
    dnd.start(task.id, task.text, listId, e, width);
  }

  let editing = $state(false);

  function startEdit() {
    editing = true;
  }

  function commitEdit(text: string) {
    const trimmed = text.trim();
    if (trimmed && trimmed !== task.text) onEdit(task, trimmed);
    editing = false;
  }

  // Tap text to edit; long-press (or right-click) opens the action menu.
  // Hover-only buttons are invisible on touch, so this is the iOS path.
  let menuOpen = $state(false);
  let menuX = $state(0);
  let menuY = $state(0);
  let lpTimer: ReturnType<typeof setTimeout> | null = null;
  let lpFired = false;
  let downX = 0;
  let downY = 0;

  function openMenu(x: number, y: number) {
    menuX = Math.min(x, window.innerWidth - 168);
    menuY = Math.min(y, window.innerHeight - 148);
    menuOpen = true;
    tapMedium();
  }

  function clearLp() {
    if (lpTimer) {
      clearTimeout(lpTimer);
      lpTimer = null;
    }
  }

  function handleTextPointerDown(e: PointerEvent) {
    if (editing) return;
    lpFired = false;
    downX = e.clientX;
    downY = e.clientY;
    clearLp();
    lpTimer = setTimeout(() => {
      lpFired = true;
      openMenu(downX, downY);
    }, 450);
  }

  function handleTextPointerMove(e: PointerEvent) {
    if (lpTimer && (Math.abs(e.clientX - downX) > 10 || Math.abs(e.clientY - downY) > 10))
      clearLp();
  }

  function handleTextClick() {
    clearLp();
    if (lpFired) {
      lpFired = false;
      return;
    }
    startEdit();
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  }

  function runMenu(action: () => void) {
    menuOpen = false;
    action();
  }

  let justToggled = $state(false);
  function handleToggle() {
    justToggled = true;
    if (!task.completed) notifySuccess();
    else tapLight();
    onToggle(task);
    setTimeout(() => (justToggled = false), 350);
  }
</script>

<li
  bind:this={el}
  data-dnd-item={task.id}
  class="group flex items-center gap-2.5 px-4 py-3.5 rounded-2xl transition-all duration-300
    {task.completed
    ? 'bg-[var(--color-done)]'
    : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]'}
    {isDragging ? 'opacity-30' : 'animate-fade-up'}"
  style="animation-delay: {index * 50}ms"
  oncontextmenu={handleContextMenu}
>
  <!-- Drag handle -->
  <button
    onpointerdown={handleGripDown}
    aria-label="Reorder task"
    class="-ml-1 p-0.5 rounded-md text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]
      touch-none cursor-grab active:cursor-grabbing shrink-0
      opacity-40 group-hover:opacity-100 transition-opacity"
  >
    <GripVertical size={14} />
  </button>

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
    <RichTaskInput
      value={task.text}
      autofocus
      submitOnBlur
      placeholder="Edit task"
      onsubmit={commitEdit}
    />
  {:else}
    <span
      class="flex-1 min-w-0"
      onpointerdown={handleTextPointerDown}
      onpointermove={handleTextPointerMove}
      onpointerup={clearLp}
      onpointercancel={clearLp}
      onclick={handleTextClick}
      role="textbox"
      tabindex="0"
    >
      <TaskContent {task} dimmed={task.completed} />
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
      onclick={() => {
        notifyWarning();
        onDelete(task);
      }}
      class="p-1.5 rounded-lg hover:bg-[var(--color-danger-glow)] transition-colors"
    >
      <Trash2 size={13} class="text-[var(--color-ink-3)] hover:text-[var(--color-danger)]" />
    </button>
  </div>
</li>

{#if menuOpen}
  <!-- Backdrop closes the menu on any outside interaction -->
  <button
    aria-label="Close menu"
    class="fixed inset-0 z-40 cursor-default"
    onpointerdown={() => (menuOpen = false)}
  ></button>
  <div
    class="fixed z-50 min-w-[160px] py-1.5 rounded-2xl bg-[var(--color-surface-2)]
      border border-[var(--color-border)] shadow-xl shadow-black/40 animate-fade-in"
    style="left: {menuX}px; top: {menuY}px;"
  >
    <button
      onclick={() => runMenu(startEdit)}
      class="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-light text-[var(--color-ink)]
        hover:bg-[var(--color-surface-3)] transition-colors"
    >
      <Pencil size={14} class="text-[var(--color-ink-3)]" />
      Edit
    </button>
    <button
      onclick={() => runMenu(() => onDuplicate(task))}
      class="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-light text-[var(--color-ink)]
        hover:bg-[var(--color-surface-3)] transition-colors"
    >
      <Copy size={14} class="text-[var(--color-ink-3)]" />
      Duplicate
    </button>
    <button
      onclick={() => runMenu(() => {
        notifyWarning();
        onDelete(task);
      })}
      class="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-light text-[var(--color-danger)]
        hover:bg-[var(--color-danger-glow)] transition-colors"
    >
      <Trash2 size={14} />
      Delete
    </button>
  </div>
{/if}

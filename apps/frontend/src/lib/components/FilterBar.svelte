<script lang="ts">
  import { X, Settings2 } from "lucide-svelte";
  import type { Project } from "$lib/api";
  import { projects } from "$lib/projects.svelte";
  import ProjectAvatar from "./ProjectAvatar.svelte";
  import ProjectAvatarEditor from "./ProjectAvatarEditor.svelte";

  let editing = $state<Project | null>(null);
</script>

{#if projects.list.length > 0}
  <div class="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar -mx-1 px-1">
    {#each projects.list as p (p.id)}
      {@const activeFilter = projects.filterId === p.id}
      <div
        class="flex items-center rounded-full border transition-colors shrink-0
          {activeFilter
          ? 'bg-[var(--color-accent-dim)] border-[var(--color-accent)]/40'
          : 'bg-[var(--color-surface)] border-[var(--color-border)]'}"
      >
        <button
          onclick={() => projects.toggleFilter(p.id)}
          class="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 text-[12px] font-medium
            {activeFilter ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-2)]'}"
        >
          <ProjectAvatar project={p} size={18} />
          {p.name}
        </button>
        {#if activeFilter}
          <button
            onclick={() => (editing = p)}
            aria-label="Customize project"
            class="pr-2 text-[var(--color-accent)]/70 hover:text-[var(--color-accent)]"
          >
            <Settings2 size={13} />
          </button>
        {/if}
      </div>
    {/each}

    {#if projects.filterId}
      <button
        onclick={() => (projects.filterId = null)}
        class="flex items-center gap-1 pl-2.5 pr-3 py-1.5 rounded-full text-[12px] font-medium shrink-0
          text-[var(--color-ink-3)] hover:text-[var(--color-ink)] transition-colors"
      >
        <X size={13} />
        Clear
      </button>
    {/if}
  </div>
{/if}

{#if editing}
  <button
    aria-label="Close"
    class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in"
    onclick={() => (editing = null)}
  ></button>
  <div
    class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[min(92vw,360px)]
      p-5 rounded-3xl bg-[var(--color-surface-2)] border border-[var(--color-border)]
      shadow-2xl shadow-black/50 animate-scale-in"
  >
    <ProjectAvatarEditor project={editing} onClose={() => (editing = null)} />
  </div>
{/if}

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    scrollbar-width: none;
  }
</style>

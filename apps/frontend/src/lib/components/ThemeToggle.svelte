<script lang="ts">
  import { Sun, Moon } from "lucide-svelte";
  import { onMount } from "svelte";

  let dark = $state(true);

  onMount(() => {
    dark = localStorage.getItem("theme") !== "light";
    apply();
  });

  function apply() {
    document.documentElement.classList.toggle("light", !dark);
  }

  function toggle() {
    dark = !dark;
    localStorage.setItem("theme", dark ? "dark" : "light");
    apply();
  }
</script>

<button
  onclick={toggle}
  class="w-11 h-11 rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)]
    flex items-center justify-center transition-all duration-300 active:scale-95"
  aria-label="Toggle theme"
>
  {#if dark}
    <Sun size={18} class="text-[var(--color-ink-2)]" />
  {:else}
    <Moon size={18} class="text-[var(--color-ink-2)]" />
  {/if}
</button>

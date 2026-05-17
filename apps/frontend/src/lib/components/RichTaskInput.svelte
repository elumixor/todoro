<script lang="ts">
  import { onMount, tick } from "svelte";
  import { Plus } from "lucide-svelte";
  import type { Project } from "$lib/api";
  import { projects } from "$lib/projects.svelte";
  import { pillElement, renderEditorHtml } from "$lib/pillHtml";
  import { suggestTokens, type Segment, type Suggestion } from "$lib/tokens";

  let {
    value = "",
    placeholder = "",
    autofocus = false,
    submitOnBlur = false,
    onsubmit,
  }: {
    value?: string;
    placeholder?: string;
    autofocus?: boolean;
    submitOnBlur?: boolean;
    onsubmit: (text: string) => void;
  } = $props();

  let editor: HTMLDivElement | undefined = $state();

  type Item =
    | { kind: "project"; project: Project }
    | { kind: "create"; name: string }
    | { kind: "token"; sug: Suggestion };

  let open = $state(false);
  let items = $state<Item[]>([]);
  let active = $state(0);
  // Caret context for replacing the typed "@query".
  let qNode: Text | null = null;
  let qStart = 0;
  let qEnd = 0;

  onMount(() => {
    if (editor) editor.innerHTML = renderEditorHtml(value, projects.list);
    if (autofocus) focusEnd();
  });

  function focusEnd() {
    if (!editor) return;
    editor.focus();
    const r = document.createRange();
    r.selectNodeContents(editor);
    r.collapse(false);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
  }

  function serialize(): string {
    if (!editor) return "";
    let out = "";
    const walk = (node: Node) => {
      for (const n of Array.from(node.childNodes)) {
        if (n.nodeType === Node.TEXT_NODE) out += n.textContent ?? "";
        else if (n instanceof HTMLElement) {
          if (n.dataset.token) out += ` ${n.dataset.token} `;
          else if (n.tagName === "BR") out += " ";
          else walk(n);
        }
      }
    };
    walk(editor);
    return out.replace(/​/g, "").replace(/\s+/g, " ").trim();
  }

  function close() {
    open = false;
    qNode = null;
  }

  function detectQuery() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return close();
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE || !editor?.contains(node)) return close();
    const text = (node as Text).textContent ?? "";
    const before = text.slice(0, range.startOffset);
    const m = before.match(/@([^\s@]*)$/);
    if (!m) return close();
    qNode = node as Text;
    qStart = range.startOffset - m[0].length;
    qEnd = range.startOffset;
    buildItems(m[1]);
  }

  function buildItems(query: string) {
    const q = query.trim().toLowerCase();
    const list: Item[] = [];

    const matched = projects.list
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const as = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bs = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return as - bs || a.name.localeCompare(b.name);
      });
    const exact = projects.list.find((p) => p.name.toLowerCase() === q);

    const tokens = suggestTokens(query).map((sug) => ({ kind: "token", sug }) as Item);

    // Auto-rank: exact project → strong token → projects → tokens → create.
    if (exact) list.push({ kind: "project", project: exact });
    const strong = tokens.filter((t) => t.kind === "token" && t.sug.score >= 9);
    list.push(...strong);
    list.push(...matched.filter((p) => p !== exact).map((p) => ({ kind: "project", project: p }) as Item));
    list.push(...tokens.filter((t) => !strong.includes(t)));
    if (q && !exact) list.push({ kind: "create", name: query.trim() });

    items = list;
    active = 0;
    open = list.length > 0;
  }

  function replaceQuery(html: string) {
    if (!qNode) return;
    const r = document.createRange();
    r.setStart(qNode, qStart);
    r.setEnd(qNode, qEnd);
    r.deleteContents();
    const tpl = document.createElement("template");
    tpl.innerHTML = `${html} `;
    const frag = tpl.content;
    const lastNode = frag.lastChild;
    r.insertNode(frag);
    // Caret after the trailing space.
    if (lastNode) {
      const sel = window.getSelection();
      const nr = document.createRange();
      nr.setStartAfter(lastNode);
      nr.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(nr);
    }
    close();
  }

  async function choose(item: Item) {
    if (item.kind === "project") {
      replaceQuery(pillElement({ kind: "project", id: item.project.id, project: item.project }));
    } else if (item.kind === "create") {
      const p = await projects.create(item.name);
      replaceQuery(pillElement({ kind: "project", id: p.id, project: p }));
    } else {
      const t = item.sug.token;
      let seg: Segment;
      if (t.startsWith("@dur:")) seg = { kind: "dur", minutes: Number(t.slice(5)) };
      else {
        const v = t.slice(6);
        const hasTime = v.includes("T");
        seg = { kind: "time", date: new Date(v), hasTime };
      }
      replaceQuery(pillElement(seg));
    }
    editor?.focus();
  }

  function submit() {
    const text = serialize();
    if (!text) return;
    onsubmit(text);
  }

  // Exposed so a parent submit button can trigger it.
  export function clear() {
    if (editor) editor.innerHTML = "";
  }
  export { submit };

  function onKeydown(e: KeyboardEvent) {
    if (open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        active = (active + 1) % items.length;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        active = (active - 1 + items.length) % items.length;
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        choose(items[active]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  async function onInput() {
    if (
      editor &&
      (editor.textContent ?? "").replace(/​/g, "") === "" &&
      !editor.querySelector("[data-token]")
    )
      editor.innerHTML = "";
    await tick();
    detectQuery();
  }
</script>

<div class="relative flex-1">
  <div
    bind:this={editor}
    role="textbox"
    tabindex="0"
    aria-label={placeholder}
    contenteditable="true"
    data-placeholder={placeholder}
    class="rich-input min-h-[46px] px-4 py-3 rounded-2xl bg-[var(--color-surface)] text-[13px] font-light
      tracking-wide border border-[var(--color-border)] focus:border-[var(--color-accent)]
      focus:bg-[var(--color-surface-2)] focus:outline-none transition-all duration-300"
    oninput={onInput}
    onkeydown={onKeydown}
    onblur={() =>
      setTimeout(() => {
        close();
        if (submitOnBlur) submit();
      }, 150)}
  ></div>

  {#if open}
    <div
      class="absolute left-0 right-0 bottom-[calc(100%+6px)] z-50 max-h-64 overflow-y-auto py-1.5
        rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)]
        shadow-xl shadow-black/40 animate-fade-in"
    >
      {#each items as item, i (i)}
        <button
          type="button"
          onpointerdown={(e) => {
            e.preventDefault();
            choose(item);
          }}
          onmouseenter={() => (active = i)}
          class="w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-colors
            {i === active ? 'bg-[var(--color-surface-3)]' : ''}"
        >
          {#if item.kind === "project"}
            {#await import("./ProjectAvatar.svelte") then { default: PA }}
              <PA project={item.project} size={18} />
            {/await}
            <span class="text-[13px] font-medium text-[var(--color-ink)] flex-1 truncate">
              {item.project.name}
            </span>
            <span class="text-[10px] uppercase tracking-wider text-[var(--color-ink-3)]">Project</span>
          {:else if item.kind === "create"}
            <span
              class="w-[18px] h-[18px] rounded-full bg-[var(--color-accent-dim)] text-[var(--color-accent)]
                flex items-center justify-center shrink-0"
            >
              <Plus size={12} strokeWidth={3} />
            </span>
            <span class="text-[13px] font-medium text-[var(--color-ink)] flex-1 truncate">
              Create “{item.name}”
            </span>
            <span class="text-[10px] uppercase tracking-wider text-[var(--color-ink-3)]">Project</span>
          {:else}
            <span
              class="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 text-[11px]
                {item.sug.type === 'dur'
                ? 'bg-[oklch(74%_0.14_280_/_0.16)] text-[oklch(78%_0.1_280)]'
                : 'bg-[oklch(72%_0.16_35_/_0.14)] text-[var(--color-voice)]'}"
            >
              {item.sug.type === "dur" ? "⏳" : "🕑"}
            </span>
            <span class="text-[13px] font-medium text-[var(--color-ink)] flex-1 truncate">
              {item.sug.label}
            </span>
            <span class="text-[10px] uppercase tracking-wider text-[var(--color-ink-3)]">
              {item.sug.detail}
            </span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

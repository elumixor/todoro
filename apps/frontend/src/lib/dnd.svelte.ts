// Pointer-based drag & drop shared state. Works for both touch (iOS) and mouse.
// Lists register via `data-dnd-list="<id>"`, items via `data-dnd-item="<taskId>"`.

interface DropPayload {
  taskId: string;
  from: string;
  to: string;
  index: number;
}

class Dnd {
  taskId = $state<string | null>(null);
  label = $state("");
  fromList = $state<string | null>(null);
  overList = $state<string | null>(null);
  overIndex = $state(0);
  x = $state(0);
  y = $state(0);
  width = $state(0);

  onDrop: ((p: DropPayload) => void) | null = null;

  get active() {
    return this.taskId !== null;
  }

  start(taskId: string, label: string, from: string, ev: PointerEvent, width: number) {
    this.taskId = taskId;
    this.label = label;
    this.fromList = from;
    this.overList = from;
    this.overIndex = 0;
    this.x = ev.clientX;
    this.y = ev.clientY;
    this.width = width;
    window.addEventListener("pointermove", this.move, { passive: false });
    window.addEventListener("pointerup", this.end);
    window.addEventListener("pointercancel", this.end);
  }

  private move = (ev: PointerEvent) => {
    ev.preventDefault();
    this.x = ev.clientX;
    this.y = ev.clientY;

    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const listEl = el?.closest<HTMLElement>("[data-dnd-list]");
    if (!listEl) return;

    this.overList = listEl.dataset.dndList ?? null;

    // Items excluding the one being dragged, so the index maps directly onto
    // the post-removal array.
    const items = [...listEl.querySelectorAll<HTMLElement>("[data-dnd-item]")].filter(
      (n) => n.dataset.dndItem !== this.taskId,
    );

    let idx = items.length;
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      if (ev.clientY < r.top + r.height / 2) {
        idx = i;
        break;
      }
    }
    this.overIndex = idx;
  };

  private end = () => {
    window.removeEventListener("pointermove", this.move);
    window.removeEventListener("pointerup", this.end);
    window.removeEventListener("pointercancel", this.end);

    if (this.taskId && this.fromList && this.overList && this.onDrop) {
      this.onDrop({
        taskId: this.taskId,
        from: this.fromList,
        to: this.overList,
        index: this.overIndex,
      });
    }

    this.taskId = null;
    this.fromList = null;
    this.overList = null;
  };
}

export const dnd = new Dnd();

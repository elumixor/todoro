import type { api } from "./client";

export type Day = (typeof api.days.$get.$response)[number];
export type Task = Day["tasks"][number];

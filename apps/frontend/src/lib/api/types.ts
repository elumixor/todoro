import type { api } from "./client";

export type Day = (typeof api.days.$get.$response)[number];
export type Task = Day["tasks"][number];
export type Project = (typeof api.projects.$get.$response)[number];

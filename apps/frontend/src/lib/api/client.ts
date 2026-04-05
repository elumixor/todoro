import { NitroAPI } from "backend";

export const api = new NitroAPI({
  baseUrl: (import.meta.env.VITE_API_URL as string).replace(/\/+$/, ""),
});

export type Day = typeof api.days.$get.$response extends Array<infer T> ? T : never;
export type Task = Day["tasks"][number];

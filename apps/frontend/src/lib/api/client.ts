import { NitroAPI } from "backend";

export const api = new NitroAPI({
  baseUrl: (import.meta.env.VITE_API_URL as string).replace(/\/+$/, ""),
});

import { defineEventHandler, readBody } from "h3";
import { handleTelegramUpdate } from "services/telegram";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  await handleTelegramUpdate(body);
  return { ok: true };
});

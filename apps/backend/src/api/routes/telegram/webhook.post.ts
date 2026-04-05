import { readBody } from "h3";
import { handleTelegramUpdate } from "services/telegram";
import { handler } from "utils";

export default handler(async ({ event }) => {
  const body = await readBody(event);
  await handleTelegramUpdate(body);
  return { ok: true };
});

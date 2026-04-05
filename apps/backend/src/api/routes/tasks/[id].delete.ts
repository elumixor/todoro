import { prisma } from "services/prisma";
import { handler } from "utils";

export default handler(async ({ router }) => {
  await prisma.task.delete({ where: { id: router.id } });
  return { ok: true };
});

import { defineEventHandler, getRouterParam } from "h3";
import { prisma } from "services/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")!;
  await prisma.task.delete({ where: { id } });
  return { ok: true };
});

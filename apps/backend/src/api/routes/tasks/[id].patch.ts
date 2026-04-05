import { defineEventHandler, getRouterParam, readBody } from "h3";
import { prisma } from "services/prisma";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  order: z.number().optional(),
});

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")!;
  const body = schema.parse(await readBody(event));

  return prisma.task.update({
    where: { id },
    data: body,
  });
});

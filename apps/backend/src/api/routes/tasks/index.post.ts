import { defineEventHandler, readBody } from "h3";
import { prisma } from "services/prisma";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1),
  dayId: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const body = schema.parse(await readBody(event));

  const maxOrder = await prisma.task.aggregate({
    where: { dayId: body.dayId },
    _max: { order: true },
  });

  return prisma.task.create({
    data: {
      text: body.text,
      dayId: body.dayId,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });
});

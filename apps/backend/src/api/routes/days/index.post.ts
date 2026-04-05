import { defineEventHandler, readBody } from "h3";
import { prisma } from "services/prisma";
import { z } from "zod";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  transferTaskIds: z.array(z.string()).optional(),
});

export default defineEventHandler(async (event) => {
  const body = schema.parse(await readBody(event));

  // Create the new day
  const day = await prisma.day.create({
    data: { date: body.date },
  });

  // Transfer tasks from previous day if requested
  if (body.transferTaskIds?.length) {
    const oldTasks = await prisma.task.findMany({
      where: { id: { in: body.transferTaskIds } },
    });

    await prisma.task.createMany({
      data: oldTasks.map((t, i) => ({
        text: t.text,
        completed: false,
        order: i,
        dayId: day.id,
      })),
    });
  }

  return prisma.day.findUnique({
    where: { id: day.id },
    include: { tasks: { orderBy: { order: "asc" } } },
  });
});

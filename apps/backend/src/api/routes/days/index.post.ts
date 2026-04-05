import { prisma } from "services/prisma";
import { handler } from "utils";
import { z } from "zod";

export default handler(
  {
    body: {
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      transferTaskIds: z.array(z.string()).optional(),
    },
  },
  async ({ body: { date, transferTaskIds } }) => {
    const day = await prisma.day.create({
      data: { date },
    });

    if (transferTaskIds?.length) {
      const oldTasks = await prisma.task.findMany({
        where: { id: { in: transferTaskIds } },
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
  },
);

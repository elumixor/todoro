import { prisma } from "services/prisma";
import { handler } from "utils";
import { z } from "zod";

export default handler(
  {
    body: {
      text: z.string().min(1),
      dayId: z.string().min(1),
    },
  },
  async ({ body: { text, dayId } }) => {
    const maxOrder = await prisma.task.aggregate({
      where: { dayId },
      _max: { order: true },
    });

    return prisma.task.create({
      data: {
        text,
        dayId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
  },
);

import { prisma } from "services/prisma";
import { handler } from "utils";
import { z } from "zod";

export default handler(
  {
    body: {
      items: z.array(
        z.object({
          id: z.string().min(1),
          order: z.number(),
          thisWeek: z.boolean(),
          dayId: z.string().min(1),
        }),
      ),
    },
  },
  async ({ body: { items } }) => {
    await prisma.$transaction(
      items.map(({ id, order, thisWeek, dayId }) =>
        prisma.task.update({
          where: { id },
          data: { order, thisWeek, dayId },
        }),
      ),
    );

    return { ok: true };
  },
);

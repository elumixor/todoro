import { prisma } from "services/prisma";
import { handler } from "utils";
import { z } from "zod";

export default handler(
  {
    body: {
      text: z.string().min(1).optional(),
      completed: z.boolean().optional(),
      order: z.number().optional(),
      thisWeek: z.boolean().optional(),
    },
  },
  ({ router, body }) =>
    prisma.task.update({
      where: { id: router.id },
      data: body,
    }),
);

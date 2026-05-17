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
      projectId: z.string().nullable().optional(),
      startTime: z.string().nullable().optional(),
      duration: z.number().nullable().optional(),
    },
  },
  ({ router, body }) => {
    const { startTime, ...rest } = body;
    return prisma.task.update({
      where: { id: router.id },
      data: {
        ...rest,
        ...(startTime !== undefined ? { startTime: startTime ? new Date(startTime) : null } : {}),
      },
    });
  },
);

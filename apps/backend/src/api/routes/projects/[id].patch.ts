import { prisma } from "services/prisma";
import { handler } from "utils";
import { z } from "zod";

export default handler(
  {
    body: {
      name: z.string().min(1).optional(),
      avatarType: z.enum(["auto", "emoji", "image"]).optional(),
      emoji: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
    },
  },
  ({ router, body }) =>
    prisma.project.update({
      where: { id: router.id },
      data: body,
    }),
);

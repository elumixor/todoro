import { prisma } from "services/prisma";
import { handler } from "utils";

export default handler(() =>
  prisma.day.findMany({
    include: { tasks: { orderBy: { order: "asc" } } },
    orderBy: { date: "desc" },
  }),
);

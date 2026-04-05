import { defineEventHandler } from "h3";
import { prisma } from "services/prisma";

export default defineEventHandler(async () => {
  return prisma.day.findMany({
    include: { tasks: { orderBy: { order: "asc" } } },
    orderBy: { date: "desc" },
  });
});

import { prisma } from "services/prisma";
import { handler } from "utils";

export default handler(() =>
  prisma.project.findMany({
    orderBy: { createdAt: "asc" },
  }),
);

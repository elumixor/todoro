import { env } from "env";
import { prisma } from "services/prisma";

const API = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

async function sendMessage(chatId: number | string, text: string, options?: { reply_markup?: unknown }) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown", ...options }),
  });
}

async function getOrCreateToday() {
  const date = todayDate();
  let day = await prisma.day.findUnique({ where: { date }, include: { tasks: { orderBy: { order: "asc" } } } });
  if (!day) {
    day = await prisma.day.create({ data: { date }, include: { tasks: { orderBy: { order: "asc" } } } });
  }
  return day;
}

function formatDayTasks(day: { date: string; tasks: { text: string; completed: boolean }[] }) {
  if (!day.tasks.length) return `*${day.date}*\n_No tasks yet._`;
  const lines = day.tasks.map((t, i) => `${t.completed ? "~" : ""}${i + 1}. ${t.text}${t.completed ? "~" : ""}`);
  return `*${day.date}*\n${lines.join("\n")}`;
}

export async function handleTelegramUpdate(update: Record<string, unknown>) {
  const message = update.message as { chat: { id: number }; text?: string } | undefined;
  if (!message?.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();

  // /start or /help
  if (text === "/start" || text === "/help") {
    await sendMessage(
      chatId,
      "*Todoro Bot*\n\n" +
        "/today - Show today's tasks\n" +
        "/add <task> - Add a task\n" +
        "/done <number> - Complete a task\n" +
        "/undo <number> - Uncomplete a task\n" +
        "/delete <number> - Delete a task\n" +
        "/newday - Start a new day\n",
    );
    return;
  }

  // /today
  if (text === "/today") {
    const day = await getOrCreateToday();
    await sendMessage(chatId, formatDayTasks(day));
    return;
  }

  // /add <task>
  if (text.startsWith("/add ")) {
    const taskText = text.slice(5).trim();
    if (!taskText) return sendMessage(chatId, "Usage: /add <task text>");

    const day = await getOrCreateToday();
    const maxOrder = await prisma.task.aggregate({ where: { dayId: day.id }, _max: { order: true } });

    await prisma.task.create({
      data: { text: taskText, dayId: day.id, order: (maxOrder._max.order ?? -1) + 1 },
    });

    const updated = await getOrCreateToday();
    await sendMessage(chatId, formatDayTasks(updated));
    return;
  }

  // /done <number>
  if (text.startsWith("/done ")) {
    const num = Number.parseInt(text.slice(6).trim(), 10);
    if (Number.isNaN(num)) return sendMessage(chatId, "Usage: /done <task number>");

    const day = await getOrCreateToday();
    const task = day.tasks[num - 1];
    if (!task) return sendMessage(chatId, `Task #${num} not found.`);

    await prisma.task.update({ where: { id: task.id }, data: { completed: true } });
    const updated = await getOrCreateToday();
    await sendMessage(chatId, formatDayTasks(updated));
    return;
  }

  // /undo <number>
  if (text.startsWith("/undo ")) {
    const num = Number.parseInt(text.slice(6).trim(), 10);
    if (Number.isNaN(num)) return sendMessage(chatId, "Usage: /undo <task number>");

    const day = await getOrCreateToday();
    const task = day.tasks[num - 1];
    if (!task) return sendMessage(chatId, `Task #${num} not found.`);

    await prisma.task.update({ where: { id: task.id }, data: { completed: false } });
    const updated = await getOrCreateToday();
    await sendMessage(chatId, formatDayTasks(updated));
    return;
  }

  // /delete <number>
  if (text.startsWith("/delete ")) {
    const num = Number.parseInt(text.slice(8).trim(), 10);
    if (Number.isNaN(num)) return sendMessage(chatId, "Usage: /delete <task number>");

    const day = await getOrCreateToday();
    const task = day.tasks[num - 1];
    if (!task) return sendMessage(chatId, `Task #${num} not found.`);

    await prisma.task.delete({ where: { id: task.id } });
    const updated = await getOrCreateToday();
    await sendMessage(chatId, formatDayTasks(updated));
    return;
  }

  // /newday - create today if not exists, optionally transfer
  if (text === "/newday") {
    const date = todayDate();
    const existing = await prisma.day.findUnique({ where: { date } });
    if (existing) return sendMessage(chatId, "Today's checklist already exists! Use /today to view.");

    // Get yesterday's incomplete tasks
    const days = await prisma.day.findMany({
      orderBy: { date: "desc" },
      take: 1,
      include: { tasks: { where: { completed: false }, orderBy: { order: "asc" } } },
    });

    const day = await prisma.day.create({ data: { date } });

    if (days[0]?.tasks.length) {
      await prisma.task.createMany({
        data: days[0].tasks.map((t, i) => ({ text: t.text, completed: false, order: i, dayId: day.id })),
      });
      await sendMessage(chatId, `New day created! Transferred ${days[0].tasks.length} incomplete tasks.`);
    } else {
      await sendMessage(chatId, "New day created! No tasks to transfer.");
    }

    const updated = await prisma.day.findUnique({
      where: { id: day.id },
      include: { tasks: { orderBy: { order: "asc" } } },
    });
    if (updated) await sendMessage(chatId, formatDayTasks(updated));
    return;
  }

  // Default: treat as a task to add
  const day = await getOrCreateToday();
  const maxOrder = await prisma.task.aggregate({ where: { dayId: day.id }, _max: { order: true } });
  await prisma.task.create({
    data: { text, dayId: day.id, order: (maxOrder._max.order ?? -1) + 1 },
  });
  const updated = await getOrCreateToday();
  await sendMessage(chatId, `Added!\n\n${formatDayTasks(updated)}`);
}

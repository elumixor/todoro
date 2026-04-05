const API_URL = import.meta.env.VITE_API_URL;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  order: number;
  dayId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Day {
  id: string;
  date: string;
  tasks: Task[];
  createdAt: string;
}

export const api = {
  getDays: () => request<Day[]>("/days"),

  createDay: (date: string, transferTaskIds?: string[]) =>
    request<Day>("/days", {
      method: "POST",
      body: JSON.stringify({ date, transferTaskIds }),
    }),

  addTask: (dayId: string, text: string) =>
    request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify({ dayId, text }),
    }),

  updateTask: (id: string, data: { text?: string; completed?: boolean; order?: number }) =>
    request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteTask: (id: string) =>
    request<{ ok: boolean }>(`/tasks/${id}`, { method: "DELETE" }),

  transcribeVoice: async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    const res = await fetch(`${API_URL}/voice/transcribe`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<{ transcription: string; tasks: string[] }>;
  },
};

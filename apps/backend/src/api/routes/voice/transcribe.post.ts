import { defineEventHandler, readFormData } from "h3";
import OpenAI from "openai";
import { env } from "env";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event);
  const audioFile = formData.get("audio") as File;

  if (!audioFile) {
    throw new Error("No audio file provided");
  }

  // Transcribe with Whisper
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
  });

  // Use GPT to parse tasks from transcription
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Extract a list of tasks from the user's speech. Return a JSON array of strings, each being a concise task. If it's a single task, return an array with one item. Only return the JSON array, no other text.",
      },
      { role: "user", content: transcription.text },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
  const tasks: string[] = parsed.tasks ?? [transcription.text];

  return { transcription: transcription.text, tasks };
});

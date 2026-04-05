import { env } from "env";
import { readFormData } from "h3";
import { handler } from "utils";

const OPENAI_API = "https://api.openai.com/v1";

export default handler(async ({ event }) => {
  const formData = await readFormData(event);
  const audioFile = formData.get("audio") as File;

  if (!audioFile) {
    throw new Error("No audio file provided");
  }

  // Transcribe with Whisper
  const whisperForm = new FormData();
  whisperForm.append("file", audioFile);
  whisperForm.append("model", "whisper-1");

  const transcriptionRes = await fetch(`${OPENAI_API}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: whisperForm,
  });
  const transcription = (await transcriptionRes.json()) as { text: string };

  // Use GPT to parse tasks from transcription
  const completionRes = await fetch(`${OPENAI_API}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            'Extract a list of tasks from the user\'s speech. Return JSON: {"tasks": ["task1", "task2"]}. If it\'s a single task, return an array with one item.',
        },
        { role: "user", content: transcription.text },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const completion = (await completionRes.json()) as {
    choices: { message: { content: string } }[];
  };

  const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
  const tasks: string[] = parsed.tasks ?? [transcription.text];

  return { transcription: transcription.text, tasks };
});

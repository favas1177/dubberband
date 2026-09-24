import { z } from "zod";

export const transcribeSchema = z.object({
  videoUrl: z.string().url(),
  sourceLanguage: z.string(),
});

export const generateSchema = z.object({
  videoUrl: z.string().url(),
  transcript: z.array(
    z.object({
      id: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      startSeconds: z.number(),
      text: z.string(),
      translatedText: z.string(),
    })
  ),
  targetLanguage: z.string(),
  lipSyncEnabled: z.boolean().optional().default(false),
});

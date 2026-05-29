import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_TEXT_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_IMAGE_MODEL: z.string().default("gemini-2.5-flash-image"),
  AI_PROVIDER: z.enum(["gemini"]).default("gemini"),
  AI_MOCK_MODE: z
    .string()
    .optional()
    .default("true")
    .transform((value) => value.toLowerCase() === "true"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // 抛出清晰错误，避免运行期出现难排查问题。
  throw new Error(
    `环境变量校验失败: ${parsedEnv.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")}`,
  );
}

export const env = parsedEnv.data;

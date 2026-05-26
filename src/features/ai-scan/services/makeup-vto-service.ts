import type {
  MakeupEffect,
  MakeupVtoPayload,
} from "@/features/ai-scan/types/makeup-vto";
import { buildApiEffects } from "@/features/ai-scan/lib/makeup-defaults";
import { storageService } from "@/services/supabase/storage-service";

const API_BASE =
  import.meta.env.VITE_MAKEUP_API_BASE_URL ?? "https://yce-api-01.makeupar.com";
const API_KEY = import.meta.env.VITE_MAKEUP_API_KEY ?? "";

type TaskResponse = {
  status?: number;
  data?: {
    task_id?: string;
    task_status?: string;
    results?:
      | { url?: string; download_url?: string }
      | Array<{ download_url?: string }>;
    failure_reason?: string;
    error?: string;
    error_message?: string;
  };
  error?: string;
  error_code?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T;
  if (!response.ok) {
    const err = payload as { error?: string; error_code?: string };
    throw new Error(
      err.error ?? err.error_code ?? `API error ${response.status}`,
    );
  }
  return payload;
}

async function ensurePublicImageUrl(imageSource: string, userId: string) {
  if (imageSource.startsWith("http://") || imageSource.startsWith("https://")) {
    return imageSource;
  }

  if (!imageSource.startsWith("data:") && !imageSource.startsWith("blob:")) {
    throw new Error(
      "Unsupported image source. Upload a file or use a public URL.",
    );
  }

  const response = await fetch(imageSource);
  const blob = await response.blob();
  const extension = blob.type.includes("png") ? "png" : "jpg";
  const file = new File([blob], `makeup-selfie.${extension}`, {
    type: blob.type || "image/jpeg",
  });
  const fileName = `${userId || "guest"}/makeup-${Date.now()}.${extension}`;

  await storageService.uploadScanImage(file, fileName);
  return storageService.getPublicImageUrl(fileName);
}

function extractResultUrl(data: TaskResponse["data"]) {
  if (!data?.results) return null;
  if (Array.isArray(data.results)) {
    return data.results[0]?.download_url ?? null;
  }
  return data.results.url ?? data.results.download_url ?? null;
}

export function isMakeupApiConfigured() {
  return Boolean(API_KEY.trim());
}

export async function runMakeupVirtualTryOn(input: {
  imageSource: string;
  effects: MakeupEffect[];
  userId?: string;
}) {
  const originalPublicUrl = await ensurePublicImageUrl(
    input.imageSource,
    input.userId ?? "guest",
  );
  const payload: MakeupVtoPayload = {
    src_file_url: originalPublicUrl,
    effects: buildApiEffects(input.effects),
    version: "1.0",
  };

  if (!isMakeupApiConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 1800));
    return {
      mode: "demo" as const,
      resultUrl: originalPublicUrl,
      downloadUrl: originalPublicUrl,
      originalPublicUrl,
      payload,
    };
  }

  const startResponse = await parseJson<TaskResponse>(
    await fetch(`${API_BASE}/s2s/v2.0/task/makeup-vto`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    }),
  );

  const taskId = startResponse.data?.task_id;
  if (!taskId) throw new Error("Makeup API did not return a task id.");

  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const statusResponse = await parseJson<TaskResponse>(
      await fetch(
        `${API_BASE}/s2s/v2.0/task/makeup-vto/${encodeURIComponent(taskId)}`,
        {
          headers: { Authorization: `Bearer ${API_KEY}` },
        },
      ),
    );

    const status = statusResponse.data?.task_status;
    if (status === "success") {
      const resultUrl = extractResultUrl(statusResponse.data);
      if (!resultUrl)
        throw new Error("Task succeeded but no result image URL was returned.");
      return {
        mode: "api" as const,
        taskId,
        resultUrl,
        downloadUrl: resultUrl,
        originalPublicUrl,
        payload,
      };
    }

    if (status === "error") {
      throw new Error(
        statusResponse.data?.failure_reason ??
          statusResponse.data?.error_message ??
          statusResponse.data?.error ??
          "Makeup processing failed.",
      );
    }
  }

  throw new Error("Makeup task timed out. Please try again.");
}

import { supabase } from "@/services/supabase/client";

const SCAN_BUCKET = "scan-images";
const AVATAR_BUCKET = "avatars";
const MAKEUP_SCAN_BUCKET = "makeup_scans";

function toStorageError(
  error: { message?: string; statusCode?: string },
  fallback: string,
  bucket: string,
  sqlFile: string,
) {
  const message = error.message ?? fallback;
  if (message.includes("Bucket not found") || error.statusCode === "404") {
    throw new Error(
      `Bucket "${bucket}" chưa tồn tại trên Supabase. Vào Supabase → SQL Editor, chạy file ${sqlFile}.`,
    );
  }
  if (message.includes("row-level security") || error.statusCode === "403") {
    throw new Error(
      `Không có quyền upload vào "${bucket}". Đăng nhập và chạy ${sqlFile} trong Supabase SQL Editor.`,
    );
  }
  throw new Error(message);
}

export const storageService = {
  async uploadScanImage(file: File, fileName: string) {
    const { data, error } = await supabase.storage
      .from(SCAN_BUCKET)
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      toStorageError(
        error,
        "Could not upload scan image",
        SCAN_BUCKET,
        "supabase/sql/005_scan_images_storage.sql",
      );
    }
    return data;
  },

  getPublicImageUrl(path: string) {
    return supabase.storage.from(SCAN_BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async uploadAvatar(userId: string, file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExtension = ["jpg", "jpeg", "png", "webp"].includes(extension)
      ? extension
      : "jpg";
    const path = `${userId}/avatar.${safeExtension === "jpeg" ? "jpg" : safeExtension}`;

    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      toStorageError(
        error,
        "Could not upload avatar",
        AVATAR_BUCKET,
        "supabase/sql/004_avatars_storage.sql",
      );
    }
    return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data
      .publicUrl;
  },

  // thêm vào storageService object
  async uploadMakeupResult(
    userId: string,
    resultUrl: string,
    scanId: string,
  ): Promise<string> {
    const response = await fetch(resultUrl);
    const rawBlob = await response.blob();

    // Lấy extension từ URL thay vì content-type (vì API trả binary/octet-stream)
    const urlPath = new URL(resultUrl).pathname;
    const extension = urlPath.endsWith(".png") ? "png" : "jpg";
    const contentType = extension === "png" ? "image/png" : "image/jpeg";
    const path = `${userId}/${scanId}_result.${extension}`;

    const blob = new Blob([rawBlob], { type: contentType });

    const { error } = await supabase.storage
      .from(MAKEUP_SCAN_BUCKET)
      .upload(path, blob, {
        upsert: true,
        contentType, // 'image/jpeg' — ép đúng type
      });

    if (error) {
      toStorageError(
        error,
        "Could not upload makeup result",
        MAKEUP_SCAN_BUCKET,
        "supabase/sql/006_makeup_scans_storage.sql",
      );
    }

    return supabase.storage.from(MAKEUP_SCAN_BUCKET).getPublicUrl(path).data
      .publicUrl;
  },
};

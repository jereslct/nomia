import { supabase } from "@/integrations/supabase/client";

export type HrBucket = "absence-certificates" | "employee-documents" | "pay-stubs";

/**
 * Buckets are private. Stored values are storage paths, but legacy rows may
 * still hold a full public URL — normalize both to a plain storage path.
 */
export function toStoragePath(bucket: HrBucket, value: string): string {
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, "");
  try {
    const url = new URL(value);
    const path = url.pathname.split(`/${bucket}/`).pop() || "";
    return decodeURIComponent(path);
  } catch {
    return value;
  }
}

/** Create a short-lived signed URL for a private file. */
export async function getSignedFileUrl(
  bucket: HrBucket,
  value: string,
  expiresInSeconds = 60,
): Promise<string | null> {
  const path = toStoragePath(bucket, value);
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Open a private file in a new tab using a signed URL. */
export async function openStorageFile(bucket: HrBucket, value: string): Promise<boolean> {
  const signedUrl = await getSignedFileUrl(bucket, value);
  if (!signedUrl) return false;
  window.open(signedUrl, "_blank", "noopener,noreferrer");
  return true;
}

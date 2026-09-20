// Storage helper supporting both local disk storage and cloud storage
import fs from "node:fs";
import path from "node:path";
import { ENV } from "./_core/env";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  // If Forge config is provided, try Forge
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    try {
      const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
      const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
      presignUrl.searchParams.set("path", key);

      const presignResp = await fetch(presignUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (presignResp.ok) {
        const { url: s3Url } = (await presignResp.json()) as { url: string };
        if (s3Url) {
          const blob =
            typeof data === "string"
              ? new Blob([data], { type: contentType })
              : new Blob([data as any], { type: contentType });

          const uploadResp = await fetch(s3Url, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: blob,
          });

          if (uploadResp.ok) {
            return { key, url: `/manus-storage/${key}` };
          }
        }
      }
    } catch (err) {
      console.warn("[Storage] Cloud presign failed, falling back to local storage:", err);
    }
  }

  // Local filesystem storage fallback (standard for standalone node apps)
  ensureUploadsDir();
  const safeFilename = key.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path.join(UPLOADS_DIR, safeFilename);

  const buffer =
    typeof data === "string"
      ? Buffer.from(data)
      : Buffer.isBuffer(data)
      ? data
      : Buffer.from(data);

  await fs.promises.writeFile(filePath, buffer);
  return { key: safeFilename, url: `/uploads/${safeFilename}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/uploads/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return `/uploads/${key}`;
}


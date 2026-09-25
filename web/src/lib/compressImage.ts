/**
 * Downscales + re-encodes an image in the browser before it ever leaves the
 * device. A phone photo can be 10-20MB at 4000px+ wide — uploading that raw
 * is most of why saves have felt slow, and it's pure waste since nothing on
 * the site displays a cover or thumbnail anywhere near that size. Caps the
 * longest side at 1600px and re-encodes as JPEG, which typically takes a
 * multi-MB original down to a few hundred KB.
 */
export async function compressImage(file: File, maxDimension = 1600, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;

    const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // Any failure (unsupported format, decode error) — fall back to the
    // original file rather than blocking the upload entirely.
    return file;
  }
}

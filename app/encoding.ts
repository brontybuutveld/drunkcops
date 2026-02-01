export async function encodeGzipBase64Url(obj: unknown): Promise<string> {
  const json = JSON.stringify(obj);

  // Convert string to bytes
  const input = new TextEncoder().encode(json);

  // Gzip
  const compressedStream = new Blob([input])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));

  const compressed = new Uint8Array(
    await new Response(compressedStream).arrayBuffer()
  );

  // Base64
  let binary = "";
  for (const b of compressed) binary += String.fromCharCode(b);

  const base64 = btoa(binary);

  // Base64URL
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function decodeGzipBase64Url<T>(encoded: string): Promise<T> {
  // Base64URL → Base64
  const base64 = encoded
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(encoded.length / 4) * 4, "=");

  // Base64 → bytes
  const binary = atob(base64);
  const compressed = new Uint8Array(
    [...binary].map(c => c.charCodeAt(0))
  );

  // Gunzip
  const decompressedStream = new Blob([compressed])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));

  const decompressed = await new Response(decompressedStream).arrayBuffer();

  const json = new TextDecoder().decode(decompressed);

  return JSON.parse(json);
}
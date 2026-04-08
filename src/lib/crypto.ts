const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function sha256(input: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", encoder.encode(input));
}

function hexEncode(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function deriveRoomTopic(roomName: string): Promise<string> {
  return hexEncode(await sha256("dcall:v1:" + roomName));
}

export async function deriveSelfTopic(
  roomName: string,
  peerId: string,
): Promise<string> {
  return hexEncode(await sha256("dcall:v1:" + roomName + ":" + peerId));
}

export async function deriveRoomKey(roomName: string): Promise<CryptoKey> {
  const raw = await sha256(roomName);
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(
  key: CryptoKey,
  plaintext: string,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  );
  return (
    iv.join(",") +
    "$" +
    btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
  );
}

export async function decrypt(
  key: CryptoKey,
  encoded: string,
): Promise<string> {
  const [ivStr, b64] = encoded.split("$");
  const iv = new Uint8Array(ivStr.split(",").map(Number));
  const ciphertext = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return decoder.decode(plaintext);
}

import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cached = null;

export async function getFingerprint() {
  if (cached) return cached;
  const fp = await FingerprintJS.load();
  const { visitorId } = await fp.get();
  cached = visitorId;
  return visitorId;
}

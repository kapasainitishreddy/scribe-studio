/**
 * High-performance deterministic string hash for stable entity and line IDs.
 */
export function hashText(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash).toString(36);
}

export function toHex(data: Uint8Array): string {
  let out = '';
  for (const byte of data) {
    out += ('0' + byte.toString(16)).slice(-2);
  }
  return out;
}

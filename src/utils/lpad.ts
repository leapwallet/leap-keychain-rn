export function lpad(str: string, padString: string, length: number): string {
  while (str.length < length) {
    str = `${padString}${str}`;
  }
  return str;
}

export function bytesToBinary(bytes: number[]): string {
  return bytes.map((x: number): string => lpad(x.toString(2), '0', 8)).join('');
}

export function binaryToByte(bin: string): number {
  return parseInt(bin, 2);
}

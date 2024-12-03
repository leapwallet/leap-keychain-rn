import { encrypt, decrypt } from '@leapwallet/leap-keychain';

const ITERATIONS = 100;

export function rnEncrypt(
  message: string,
  password: string,
  iterations?: number
) {
  return encrypt(message, password, iterations ?? ITERATIONS);
}

export function rnDecrypt(
  message: string,
  password: string,
  iterations?: number
) {
  return decrypt(message, password, iterations ?? ITERATIONS);
}

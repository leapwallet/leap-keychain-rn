import { rnEncrypt, rnDecrypt } from '../encryption-utils/encryption-utils';

describe('Encryption', () => {
  test('Test encryption and decryption', () => {
    const text = 'Hello World';
    const password = 'password';
    const encryptedString = rnEncrypt(text, password, 100);
    const decryptedString = rnDecrypt(encryptedString, password, 100);
    expect(decryptedString).toBe(text);
  });
});

import { binaryToByte, bytesToBinary, lpad } from '../utils/lpad';
import { Container } from 'typedi';
import { cryptoToken } from './crypto';
import { english } from '../constants/wordlists';

const DEFAULT_WORDLIST = english;

function normalize(str: string) {
  return str.normalize('NFKD');
}

export function _mnemonicToSeed(mnemonic: string, passphrase?: string) {
  const mnemonicBuffer = Buffer.from(normalize(mnemonic), 'utf8');
  const saltBuffer = Buffer.from(
    `mnemonic${normalize(passphrase ?? '')}`,
    'utf8'
  );
  const crypto = Container.get(cryptoToken);

  const seed = crypto.pbkdf2Sync(
    mnemonicBuffer,
    saltBuffer,
    2048,
    64,
    'SHA-512'
  );
  return seed;
}

function deriveChecksumBits(entropyBuffer: Buffer): string {
  const ENT = entropyBuffer.length * 8;
  const CS = ENT / 32;
  const crypto = Container.get(cryptoToken);
  const sha256 = crypto.Hash('sha256');
  const hash = sha256.update(entropyBuffer).digest();

  return bytesToBinary(Array.from(hash)).slice(0, CS);
}

export function entropyToMnemonic(
  entropy: Buffer | string,
  wordlist = DEFAULT_WORDLIST
): string {
  if (!Buffer.isBuffer(entropy)) {
    entropy = Buffer.from(entropy, 'hex');
  }
  wordlist = wordlist || DEFAULT_WORDLIST;

  // 128 <= ENT <= 256
  if (entropy.length < 16) {
    throw new TypeError('invalid entropy');
  }
  if (entropy.length > 32) {
    throw new TypeError('invalid entropy');
  }
  if (entropy.length % 4 !== 0) {
    throw new TypeError('invalid entropy');
  }

  const entropyBits = bytesToBinary(Array.from(entropy));
  const checksumBits = deriveChecksumBits(entropy);

  const bits = entropyBits + checksumBits;
  const chunks = bits.match(/(.{1,11})/g)!;
  const words = chunks.map((binary: string): string | undefined => {
    const index = binaryToByte(binary);
    return wordlist[index];
  });

  return words.join(' ');
}

export function _generateMnemonic(
  strength?: number,
  rng?: (size: number) => Buffer,
  wordlist = DEFAULT_WORDLIST
): string {
  strength = strength || 128;
  if (strength % 32 !== 0) {
    throw new TypeError('invalid entropy');
  }
  const crypto = Container.get(cryptoToken);
  const _rng = (size: number) => Buffer.from(crypto.randomBytes(size));
  rng = rng || _rng;

  return entropyToMnemonic(rng(strength / 8), wordlist);
}

function _mnemonicToEntropy(mnemonic: string, wordlist = DEFAULT_WORDLIST) {
  wordlist = wordlist || DEFAULT_WORDLIST;
  if (!wordlist) {
    throw new Error('Word list is required');
  }
  const words = normalize(mnemonic).split(' ');
  if (words.length % 3 !== 0) {
    throw new Error('Invalid mnemonic');
  }
  // convert word indices to 11 bit binary strings
  const bits = words
    .map((word) => {
      const index = wordlist.indexOf(word);
      if (index === -1) {
        throw new Error('Invalid mnemonic');
      }
      return lpad(index.toString(2), '0', 11);
    })
    .join('');
  // split the binary string into ENT/CS
  const dividerIndex = Math.floor(bits.length / 33) * 32;
  const entropyBits = bits.slice(0, dividerIndex);
  const checksumBits = bits.slice(dividerIndex);
  // calculate the checksum and compare

  const entropyBytes = entropyBits.match(/(.{1,8})/g)?.map(binaryToByte);
  if (entropyBytes) {
    if (entropyBytes.length < 16) {
      throw new Error('Invalid entropy');
    }
    if (entropyBytes.length > 32) {
      throw new Error('Invalid entropy');
    }
    if (entropyBytes.length % 4 !== 0) {
      throw new Error('Invalid entropy');
    }
    const entropy = Buffer.from(entropyBytes);
    const newChecksum = deriveChecksumBits(entropy);
    if (newChecksum !== checksumBits) {
      throw new Error('Invalid checksum');
    }
    return entropy.toString('hex');
  } else {
    throw new Error('Invalid entropy');
  }
}

export namespace Bip39 {
  export function generateMnemonic(strength: number): string {
    return _generateMnemonic(strength);
  }
  export function mnemonicToSeed(mnemonic: string): Promise<Uint8Array> {
    return Promise.resolve(mnemonicToSeedSync(mnemonic));
  }
  export function validateMnemonic(mnemonic: string): boolean {
    // TODO: implement mnemonic validation function
    return !!mnemonic;
  }
  export function mnemonicToEntropy(mnemonic: string): string {
    return _mnemonicToEntropy(mnemonic);
  }
  export function mnemonicToSeedSync(
    mnemonic: string,
    passphrase?: string
  ): Uint8Array {
    const mnemonicBuffer = Buffer.from(normalize(mnemonic), 'utf8');
    const saltBuffer = Buffer.from(
      `mnemonic${normalize(passphrase ?? '')}`,
      'utf8'
    );
    const crypto = Container.get(cryptoToken);
    const seed = crypto.pbkdf2Sync(
      mnemonicBuffer,
      saltBuffer,
      2048,
      64,
      'SHA-512'
    );
    return new Uint8Array(seed);
  }
}

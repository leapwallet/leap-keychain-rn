import * as bip32 from 'bip32';
import { bech32 } from 'bech32';
import { cryptoToken } from './crypto';
import Container from 'typedi';
import { ec } from 'elliptic';
import { mnemonicToSeed } from './bip39';
import type { IChildKey, IHDKey } from '@leapwallet/leap-keychain';

export namespace Bip32 {
  export function derivePath(key: IHDKey, path: string) {
    const childKey = key.derive(path);
    return {
      publicKey: childKey.publicKey,
      privateKey: childKey.privateKey,
      sign: (hash: Uint8Array) => Bip32.sign(childKey, hash),
    };
  }
  export function fromSeed(seed: Uint8Array): IHDKey {
    const key = bip32.fromSeed(Buffer.from(seed));
    return {
      derive: (path) => {
        const ck = key.derivePath(path);
        return {
          publicKey: new Uint8Array(ck.publicKey),
          privateKey: ck.privateKey ? new Uint8Array(ck.privateKey) : null,
          sign: (hash: Uint8Array) => {
            return ck.sign(Buffer.from(hash));
          },
        };
      },
      publicKey: key.publicKey,
      privateKey: key.privateKey ? key.privateKey : null,
    };
  }
  export function sign(key: IChildKey, message: Uint8Array) {
    return key.sign(message);
  }
}

export class Wallet {
  static secp256k1 = new ec('secp256k1');

  constructor(private privateKey: Buffer) {}

  static fromMnemonic(mnemonic: string, path: string) {
    const seed = mnemonicToSeed(mnemonic);
    //@ts-ignore
    const hdKey = bip32.fromSeed(seed);
    const { privateKey } = hdKey.derivePath(path);
    if (!privateKey) {
      throw new Error('unable to create key pair');
    }
    return new Wallet(privateKey);
  }

  static fromPrivateKey(privateKey: string) {
    const kp = Wallet.secp256k1.keyFromPrivate(privateKey);

    const pvtKey = kp.getPrivate().toArray('be', 32);
    return new Wallet(Buffer.from(pvtKey));
  }

  static pubKeyToAddress(prefix: string, publicKey: Buffer) {
    const crypto = Container.get(cryptoToken);
    const ripemd = crypto.createHash('ripemd160');
    const sha256 = crypto.createHash('sha256');
    const hashedPublicKey = ripemd
      .update(sha256.update(publicKey).digest())
      .digest();
    return bech32.encode(prefix, bech32.toWords(hashedPublicKey));
  }

  sign(message: string) {
    const pk = Wallet.secp256k1.keyFromPrivate(this.privateKey);
    const signature = pk.sign(Buffer.from(message), {
      canonical: true,
    });

    return {
      signDoc: message,
      signature: new Uint8Array(
        signature.r.toArray('be', 32).concat(signature.s.toArray('be', 32))
      ),
    };
  }
}

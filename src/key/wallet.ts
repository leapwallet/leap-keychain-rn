import * as bip32 from 'bip32';
import { bech32 } from 'bech32';
import { cryptoToken } from '../crypto/crypto';
import Container from 'typedi';
import { ec } from 'elliptic';
import type { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import {
  serializeSignDoc,
  serializeStdSignDoc,
} from '../utils/serializeSignDoc';
import { encodeSecp256k1Signature } from '../utils/encode-signature';
import type { StdSignDoc } from '../types/tx';
import { Buffer } from '@craftzdog/react-native-buffer';
import { bip39Token } from '@leapwallet/leap-keychain';

type WalletOptions = {
  paths: Array<string>;
  addressPrefix: string;
};

export class Wallet {
  static secp256k1 = new ec('secp256k1');

  constructor(
    private hdKey: bip32.BIP32Interface,
    private options: WalletOptions
  ) {}

  static generateWallet(mnemonic: string, options: WalletOptions) {
    const bip39 = Container.get(bip39Token);
    const seed = bip39.mnemonicToSeed(mnemonic);
    //@ts-ignore
    const hdKey = bip32.fromSeed(seed);

    return new Wallet(hdKey, options);
  }

  private getAccountsWithPrivKey() {
    const childKeys = this.options.paths.map((path) => {
      return this.hdKey.derivePath(path);
    });

    return childKeys.map((childKey) => {
      const publicKey = childKey.publicKey as unknown as Buffer;
      const address = Wallet.pubKeyToAddress(
        this.options.addressPrefix,
        publicKey!
      );
      return {
        algo: 'secp256k1',
        address,
        pubkey: publicKey,
        childKey: childKey,
      };
    });
  }

  getAccounts() {
    return this.getAccountsWithPrivKey().map((account) => {
      return {
        algo: 'secp256k1',
        address: account.address,
        pubkey: account.pubkey,
      };
    });
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

  async signDirect(signerAddress: string, signDoc: SignDoc) {
    const accounts = this.getAccountsWithPrivKey();
    const account = accounts.find(({ address }) => address === signerAddress);
    if (!account) {
      throw new Error('Signer address does not match wallet address');
    }
    if (!account.pubkey || !account.childKey.privateKey) {
      throw new Error('Unable to derive keypair');
    }
    const crypto = Container.get(cryptoToken);
    const sha256 = crypto.createHash('sha256');

    const hash = sha256.update(serializeSignDoc(signDoc)).digest();

    //@ts-ignore
    const signature = Wallet.sign(hash, account.childKey.privateKey);

    return {
      signed: signDoc,
      signature: encodeSecp256k1Signature(account.pubkey, signature),
    };
  }

  async signAmino(signerAddress: string, signDoc: StdSignDoc) {
    const accounts = this.getAccounts();
    const account = accounts.find(({ address }) => address === signerAddress);
    if (!account) {
      throw new Error('Signer address does not match wallet address');
    }
    if (!account.pubkey) {
      throw new Error('Unable to derive keypair');
    }

    const crypto = Container.get(cryptoToken);
    const sha256 = crypto.Hash('sha256');

    const hash = sha256.update(serializeStdSignDoc(signDoc)).digest();
    //@ts-ignore
    const signature = Wallet.sign(hash, account.childKey.privateKey);

    return {
      signed: signDoc,
      signature: encodeSecp256k1Signature(account.pubkey, signature),
    };
  }

  static sign(message: Buffer, privateKey: Buffer) {
    const pk = Wallet.secp256k1.keyFromPrivate(privateKey);
    const signature = Wallet.secp256k1.sign(message, pk, 'hex', {
      canonical: true,
    });
    return new Uint8Array(
      signature.r.toArray('be', 32).concat(signature.s.toArray('be', 32))
    );
  }
}

export class PvtKeyWallet {
  constructor(
    private privateKey: Buffer,
    private publicKey: Buffer,
    private address: string
  ) {}

  static generateWallet(privateKey: string, addressPrefix: string) {
    const kp = Wallet.secp256k1.keyFromPrivate(privateKey);
    const publicKey = kp.getPublic().encode('array', true);
    const pvtKey = kp.getPrivate().toArray('be', 32);
    const address = Wallet.pubKeyToAddress(
      addressPrefix,
      Buffer.from(publicKey)
    );
    return new PvtKeyWallet(
      Buffer.from(pvtKey),
      Buffer.from(publicKey),
      address
    );
  }

  getAccounts() {
    return [
      {
        algo: 'secp256k1',
        address: this.address,
        pubkey: this.publicKey,
      },
    ];
  }

  public async signAmino(signerAddress: string, signDoc: StdSignDoc) {
    const accounts = this.getAccounts();
    const account = accounts.find(
      (_account) => _account.address === signerAddress
    );
    if (!account) {
      throw new Error('Signer address does not match wallet address');
    }
    if (!account.pubkey) {
      throw new Error('Unable to derive keypair');
    }

    const crypto = Container.get(cryptoToken);
    const sha256 = crypto.Hash('sha256');

    const hash = sha256.update(serializeStdSignDoc(signDoc)).digest();
    const signature = Wallet.sign(hash, this.privateKey);

    return {
      signed: signDoc,
      signature: encodeSecp256k1Signature(account.pubkey, signature),
    };
  }

  async signDirect(signerAddress: string, signDoc: SignDoc) {
    const accounts = this.getAccounts();
    const account = accounts.find(({ address }) => address === signerAddress);
    if (!account) {
      throw new Error('Signer address does not match wallet address');
    }

    const crypto = Container.get(cryptoToken);
    const sha256 = crypto.Hash('sha256');

    const hash = sha256.update(serializeSignDoc(signDoc)).digest();
    const signature = Wallet.sign(hash, this.privateKey);

    return {
      signed: signDoc,
      signature: encodeSecp256k1Signature(account.pubkey, signature),
    };
  }
}

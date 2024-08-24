import {
  ChainInfo,
  EthWallet,
  generateWalletFromMnemonic,
  Key,
  pubkeyToAddress,
  PvtKeyWallet,
  secp256k1Token,
  WALLETTYPE,
} from '@leapwallet/leap-keychain';

import Container from 'typedi';
import * as base64js from 'base64-js';
import { v4 as uuidv4 } from 'uuid';
import getHDPath from '../utils/get-hdpath';
import { rnDecrypt, rnEncrypt } from '../encryption-utils/encryption-utils';

function generateWalletFromPrivateKey(
  privateKey: string,
  coinType: string,
  addressPrefix: string
) {
  const wallet =
    coinType === '60'
      ? EthWallet.generateWalletFromPvtKey(privateKey, {
          paths: [getHDPath('60', '0')],
          addressPrefix: addressPrefix,
        })
      : PvtKeyWallet.generateWallet(privateKey, addressPrefix);
  return wallet;
}

export function compressedPublicKey(publicKey: Uint8Array) {
  const secp256k1 = Container.get(secp256k1Token);
  return base64js.fromByteArray(secp256k1.publicKeyConvert(publicKey, true));
}

export class RNKeyChain {
  static async createWalletUsingMnemonic<T extends string>(
    wallets: Record<string, Key<T>>,
    mnemonic: string,
    type: 'create' | 'import',
    password: string,
    chainInfos: ChainInfo[],
    name?: string,
    colorIndex?: number,
    addressIndex?: number | 0
  ): Promise<Key<T> | undefined> {
    const allWallets = wallets;
    const walletsData = Object.values(allWallets);
    const lastIndex = walletsData.length;

    const { addresses, pubKey, algo, pubKeys } = await RNKeyChain.getAddresses(
      mnemonic,
      addressIndex?.toString() ?? '0',
      WALLETTYPE.SEED_PHRASE,
      chainInfos
    );

    const walletId = uuidv4();

    const cipher = rnEncrypt(mnemonic, password);

    const wallet: { [id: string]: Key<T> } = {
      [walletId]: {
        addressIndex: addressIndex ?? 0,
        name: name,
        cipher: cipher,
        addresses,
        walletType:
          type === 'create'
            ? WALLETTYPE.SEED_PHRASE
            : WALLETTYPE.SEED_PHRASE_IMPORTED,
        id: walletId,
        colorIndex: colorIndex ?? lastIndex,
        pubKey,
        pubKeys,
        algo,
        isEncrypted: true,
      } as Key<T>,
    };

    return wallet[walletId];
  }

  static async createNewWalletAccount<T extends string>(
    wallets: Record<string, Key<T>>,
    name: string,
    colorIndex: number,
    password: string = '',
    ChainInfos: ChainInfo[]
  ): Promise<Key<T>> {
    const walletsData = Object.values(wallets);

    const lastIndex = walletsData.reduce((prevVal, currentValue) => {
      if (prevVal > currentValue.addressIndex) {
        return prevVal;
      }
      return currentValue.addressIndex;
    }, 0);

    const addressIndex = lastIndex + 1;
    let cipher = walletsData[0]?.cipher;

    let mnemonic = cipher;

    if (cipher && password !== '') {
      mnemonic = rnDecrypt(cipher, password);
      cipher = rnEncrypt(mnemonic, password);
    }

    if (!mnemonic) throw new Error('Invalid mnemonic');

    const { addresses, pubKey, algo, pubKeys } = await RNKeyChain.getAddresses(
      mnemonic,
      addressIndex.toString(),
      WALLETTYPE.SEED_PHRASE,
      ChainInfos
    );
    const walletId = uuidv4();
    const wallet = {
      addressIndex,
      name: name,
      addresses,
      cipher,
      walletType: WALLETTYPE.SEED_PHRASE,
      id: walletId,
      colorIndex: colorIndex ?? addressIndex,
      pubKey,
      pubKeys,
      algo,
      isEncrypted: true,
    } as Key<T>;

    return wallet;
  }

  static async getAddresses(
    mnemonic: string,
    addressIndex = '0',
    walletType: WALLETTYPE,
    chainInfos: { coinType: string; addressPrefix: string; key: string }[]
  ) {
    try {
      const chainsData = Object.entries(chainInfos);
      const addresses: Record<string, string> = {};

      let pubKey: Uint8Array | undefined;
      const pubKeys: Record<string, string> = {};
      let cosmosPubKey: Uint8Array | undefined;
      let algo: string = '';
      for (const [_, chainInfo] of chainsData) {
        if (chainInfo.coinType === '118' && cosmosPubKey) {
          const address = pubkeyToAddress(
            chainInfo.addressPrefix,
            cosmosPubKey
          );
          pubKeys[chainInfo.key] = compressedPublicKey(
            cosmosPubKey as Uint8Array
          );
          addresses[chainInfo.key] = address ?? '';
        } else {
          const wallet =
            walletType === WALLETTYPE.PRIVATE_KEY
              ? generateWalletFromPrivateKey(
                  mnemonic,
                  chainInfo.coinType,
                  chainInfo.addressPrefix
                )
              : generateWalletFromMnemonic(mnemonic, {
                  hdPath: getHDPath(chainInfo.coinType, addressIndex),
                  addressPrefix: chainInfo.addressPrefix,
                  ethWallet: false,
                });

          const [account] = await wallet.getAccounts();
          algo = 'secp256k1';

          if (chainInfo.addressPrefix === 'cosmos') {
            cosmosPubKey = account?.pubkey as Uint8Array;
          }

          pubKeys[chainInfo.key] = compressedPublicKey(
            account?.pubkey as Uint8Array
          );
          addresses[chainInfo.key] = account?.address ?? '';
        }
      }

      return {
        addresses,
        pubKey: new TextDecoder().decode(pubKey),
        pubKeys,
        algo,
      };
    } catch (e: any) {
      throw new Error(e);
    }
  }
}

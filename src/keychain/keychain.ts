import {
  decrypt,
  encrypt,
  Key,
  WALLETTYPE,
  generateWallet,
  EthWallet,
  secp256k1Token,
  PvtKeyWallet,
  ChainInfo,
  pubkeyToAddress,
} from '@leapwallet/leap-keychain';
import getHDPath from '@leapwallet/leap-keychain/dist/src/utils/get-hdpath';

import Container from 'typedi';
import * as base64js from 'base64-js';
import { v4 as uuidv4 } from 'uuid';

//TODO replace with wallet utils function from leap-keychain

function generateWalletFromMnemonic(
  mnemonic: string,
  hdPath: string,
  addressPrefix: string
) {
  const hdPathParams = hdPath.split('/');
  const coinType = hdPathParams[2];
  if (coinType?.replace("'", '') === '60') {
    return EthWallet.generateWalletFromMnemonic(mnemonic, {
      paths: [hdPath],
      addressPrefix,
    });
  }
  return generateWallet(mnemonic, { paths: [hdPath], addressPrefix });
}

async function generateWalletFromPrivateKey(
  privateKey: string,
  hdPath: string,
  addressPrefix: string
) {
  const hdPathParams = hdPath.split('/');
  const coinType = hdPathParams[2];

  return coinType === '60'
    ? EthWallet.generateWalletFromPvtKey(privateKey, {
        paths: [getHDPath('60', '0')],
        addressPrefix: addressPrefix,
      })
    : await PvtKeyWallet.generateWallet(privateKey, addressPrefix);
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

    const { addresses, pubKey, algo } = await RNKeyChain.getAddresses(
      mnemonic,
      addressIndex?.toString() ?? '0',
      WALLETTYPE.SEED_PHRASE,
      chainInfos
    );

    const walletId = uuidv4();

    const cipher = encrypt(mnemonic, password);

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
      mnemonic = decrypt(cipher, password);
      cipher = encrypt(mnemonic, password);
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
      // const pubKeys: Record<string, string> = {}

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
              ? await generateWalletFromPrivateKey(
                  mnemonic,
                  getHDPath(chainInfo.coinType, addressIndex),
                  chainInfo.addressPrefix
                )
              : await generateWalletFromMnemonic(
                  mnemonic,
                  getHDPath(chainInfo.coinType, addressIndex),
                  chainInfo.addressPrefix
                );

          const [account] = await wallet.getAccounts();
          algo = 'secp256k1';

          if (chainInfo.addressPrefix === 'cosmos') {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

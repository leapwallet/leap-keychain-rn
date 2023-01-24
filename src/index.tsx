import './utils/init-crypto';
import { initStorage } from '@leapwallet/leap-keychain';

import { MMKV } from 'react-native-mmkv';
import { getStorage } from './storage/storageAdapter';

initStorage(getStorage(new MMKV()));

export { mnemonicToSeed } from './crypto/bip39';
export { Wallet, PvtKeyWallet } from './key/wallet';
export * from '@leapwallet/leap-keychain';

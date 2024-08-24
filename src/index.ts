import './utils/init-crypto';
import { initStorage } from '@leapwallet/leap-keychain';

import { MMKV } from 'react-native-mmkv';
import { getStorage } from './storage/storageAdapter';

initStorage(getStorage(new MMKV()));

export { Bip39 } from './crypto/bip39';
export { Wallet, PvtKeyWallet } from './key/wallet';
export { rnDecrypt, rnEncrypt } from './encryption-utils/encryption-utils';
export * from '@leapwallet/leap-keychain';
export { compressedPublicKey } from '@leapwallet/leap-keychain';
export * from './keychain/keychain';

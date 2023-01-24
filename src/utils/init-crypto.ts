import {
  setripemd160,
  setsha256,
  setSecp256k1,
  setBip39,
  setBip32,
} from '@leapwallet/leap-keychain';
import Crypto from 'react-native-quick-crypto';
import { cryptoToken } from '../crypto/crypto';
import Container from 'typedi';
import { Secp256k1 } from '../crypto/secp256k1';
import { Bip39 } from '../crypto/bip39';
import { Bip32 } from '../crypto/bip32';

const ripemd160 = (data: Uint8Array | string) => {
  const hash = Crypto.Hash('ripemd160');
  return hash.update(data).digest();
};

const sha256 = (data: Uint8Array | string) => {
  const hash = Crypto.Hash('sha256');
  return hash.update(data).digest();
};

setripemd160(ripemd160);
setsha256(sha256);
setSecp256k1(Secp256k1);
setBip39(Bip39);
setBip32(Bip32);

Container.set(cryptoToken, Crypto);

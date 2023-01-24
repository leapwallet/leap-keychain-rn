import { mnemonicToSeed } from '../crypto/bip39';
import { Bip32 } from '../crypto/bip32';
import { fromByteArray } from 'react-native-quick-base64';
import { Container } from 'typedi';
import { cryptoToken } from '../crypto/crypto';
import { pubkeyToAddress } from '@leapwallet/leap-keychain';
const crypto = require('crypto');

beforeEach(() => {
  Container.set(cryptoToken, crypto);
});

const testMnemonic =
  'talk chat police leisure hill remember extra struggle treat utility before wine';

const seedString =
  'U726b9fA0wQRZ5qkj5bHyzfDIRK38dzJWxCryK1dQpM/YL/bM2Z7OcQ/6trLHFKlGo5dcYJDNt/A18CLPlBiFA==';

const cosmosAddress = 'cosmos1uput06d0xac525sdmtf4h5d8dy9d8x3u07smz9';

describe('crypto', () => {
  describe('bip39', () => {
    test('menmonicToSeed', () => {
      const seed = mnemonicToSeed(testMnemonic, '');
      const generatedSeedString = fromByteArray(seed);

      expect(generatedSeedString).toBe(seedString);
    });
  });

  describe('bip32', () => {
    test('creates public private key pair', () => {
      const path = "m/44'/118'/0'/0/0";
      const node = Bip32.fromSeed(Buffer.from(seedString, 'base64'));
      const publicKey = node.derive(path).publicKey;

      const address = pubkeyToAddress('cosmos', publicKey!);
      expect(address).toBe(cosmosAddress);
    });
  });
});

import { fromByteArray } from 'react-native-quick-base64';
import { Container } from 'typedi';
import { cryptoToken } from '../crypto/crypto';

import { Bip39 } from '../crypto/bip39';
const crypto = require('crypto');

beforeEach(() => {
  Container.set(cryptoToken, crypto);
});

const testMnemonic =
  'talk chat police leisure hill remember extra struggle treat utility before wine';

const seedString =
  'U726b9fA0wQRZ5qkj5bHyzfDIRK38dzJWxCryK1dQpM/YL/bM2Z7OcQ/6trLHFKlGo5dcYJDNt/A18CLPlBiFA==';

describe('crypto', () => {
  describe('bip39', () => {
    test('menmonicToSeed', async () => {
      const seed = await Bip39.mnemonicToSeed(testMnemonic);
      const generatedSeedString = fromByteArray(seed);

      expect(generatedSeedString).toBe(seedString);
    });
  });
});

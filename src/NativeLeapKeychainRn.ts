import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  mnemonicToSeed(
    mnemonic: Array<String>,
    passphrase?: String
  ): Promise<Uint8Array>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('LeapKeychainRn');

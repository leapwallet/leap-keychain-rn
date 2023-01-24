import * as React from 'react';

import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { KeyChain, Keystore } from '@leapwallet/leap-keychain-rn';
const chainInfo = [
  { key: 'cosmos', coinType: '118', addressPrefix: 'cosmos' },
  { key: 'juno', coinType: '118', addressPrefix: 'juno' },
  { key: 'evmos', coinType: '60', addressPrefix: 'evmos' },
];
export default function App() {
  const [wallets, setWallets] = React.useState<Keystore<'cosmos'>>();
  const [loader, setLoader] = React.useState(false);
  const [keystoreCounter, setKeyStoreCounter] = React.useState(1);

  React.useEffect(() => {
    KeyChain.getAllWallets()
      .then((x) => {
        setWallets(x);
      })
      .catch((e) => {
        console.log('there was an error getting wallets', e);
      });
  }, [keystoreCounter]);

  const createWallet = async () => {
    const mnemonic =
      'talk chat police leisure hill remember extra struggle treat utility before wine';
    setLoader(true);
    try {
      const x = await KeyChain.createWalletUsingMnemonic({
        name: 'test',
        mnemonic,
        chainInfos: chainInfo,
        password: 'password',
        addressIndex: 0,
        colorIndex: 0,
      });
      console.log('wallet created', x);
    } catch (e) {
      console.log('logging error in creating wallet', e);
    } finally {
      setLoader(false);
    }
  };

  const addWallet = () => {
    KeyChain.createNewWalletAccount('test 2', 'password', 1, chainInfo);
    setKeyStoreCounter(keystoreCounter + 1);
  };

  console.log('logging loader state', loader);

  return (
    <View style={styles.container}>
      {wallets
        ? Object.values(wallets ?? {}).map((wallet) => {
            return <Text>wallet: {wallet.addresses['cosmos']}</Text>;
          })
        : null}
      {loader ? (
        <ActivityIndicator />
      ) : (
        <Pressable onPress={createWallet}>
          <Text>Create Wallet</Text>
        </Pressable>
      )}
      <Pressable onPress={addWallet}>
        <Text>Add Wallet</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          if (!wallets) return;
          const ids = Object.values(wallets).map((wallet) => wallet.id);
          KeyChain.removeWallets(ids);
          setKeyStoreCounter(keystoreCounter + 1);
        }}
      >
        <Text>Remove Wallets</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});

# react-native-leap-keychain-rn

Key management library for react native apps

## Installation

Use one of the following methods:

- npm:
  ```shell
  npm i @leapwallet/leap-keychain-rn
  ```
- Yarn:
  ```shell
  yarn add @leapwallet/leap-keychain-rn
  ```
  
## Usage

```javascript

  import { KeyChain } from '@leapwallet/leap-keychain-rn'

  // create wallet using mnemonic

  KeyChain.createWalletUsingMnemonic({
    mnemonic: "12/24 word mnemonic",
    name: "wallet name";
    password: "encryption password";
    addressIndex: "address index";
    colorIndex: "0";
    chainInfos: {
      //The 'chain infos' object includes the address prefix and coin type for the chains for which wallet creation is required.
      cosmos: {
        addressPrefix: 'cosmos',
        coinType: '118',
        key: 'cosmos'
      }
    };
  })
  

```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

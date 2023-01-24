import { ec } from 'elliptic';

export namespace Secp256k1 {
  const secp256k1 = new ec('secp256k1');

  export function getPublicKey(privateKey: Uint8Array, compressed: boolean) {
    const pk = secp256k1
      .keyFromPrivate(privateKey)
      .getPublic(compressed, 'hex');

    return Buffer.from(pk, 'hex');
  }

  export function sign(
    message: Uint8Array,
    privateKey: Uint8Array,
    options?: { canonical: boolean }
  ) {
    const signature = secp256k1.sign(message, Buffer.from(privateKey), options);
    return Promise.resolve(
      new Uint8Array(
        signature.r.toArray('be', 32).concat(signature.s.toArray('be', 32))
      )
    );
  }

  export function publicKeyConvert(publicKey: Uint8Array, compressed: boolean) {
    const pk = secp256k1.keyFromPublic(publicKey).getPublic(compressed, 'hex');
    return Buffer.from(pk, 'hex');
  }
}

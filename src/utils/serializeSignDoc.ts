import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import type { StdSignDoc } from 'src/types/tx';

export function sortObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  }
  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, any> = {};

  for (const key of sortedKeys) {
    result[key] = sortObject(obj[key]);
  }

  return result;
}

export function serializeStdSignDoc(signDoc: StdSignDoc) {
  const json = JSON.stringify(sortObject(signDoc));

  return new Uint8Array(Buffer.from(json, 'utf-8'));
}

export function serializeSignDoc(signDoc: SignDoc) {
  return SignDoc.encode(
    SignDoc.fromPartial({
      accountNumber: signDoc.accountNumber,
      authInfoBytes: signDoc.authInfoBytes,
      bodyBytes: signDoc.bodyBytes,
      chainId: signDoc.chainId,
    })
  ).finish();
}

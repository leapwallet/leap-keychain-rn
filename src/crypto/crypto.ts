import { Token } from 'typedi';
import type { Crypto } from '../types/crypto';

export const cryptoToken = new Token<Crypto>('crypto');

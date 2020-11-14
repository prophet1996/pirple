import crypto from 'crypto';
import { nanoid } from 'nanoid';
import config from '../src/config';

const { hashingSecret } = config;

export const Hash:(_:string)=>string = (key:string) => {
  if (typeof (key) === 'string') {
    return crypto.createHmac('sha256', hashingSecret).update(key).digest('hex');
  }
  return '';
};

export const parseJsonToObject:(_:string)=>any = (str:string) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (err) {
    return err;
  }
};

export const createRandomString = (length:number) => {
  if (length > 0) {
    return nanoid(length);
  }
  return '';
};

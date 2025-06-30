
import { v4 as uuidv4 } from 'uuid';

const ANONYMOUS_TOKEN_KEY = 'anonlink_token';

export const getAnonymousToken = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  let token = localStorage.getItem(ANONYMOUS_TOKEN_KEY);
  if (!token) {
    token = uuidv4();
    localStorage.setItem(ANONYMOUS_TOKEN_KEY, token);
  }
  return token;
};

'use client';

// A simple client-side fingerprinting utility.
export const getFingerprint = async (): Promise<string> => {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const { userAgent, language, hardwareConcurrency } = navigator;
  const { width, height, colorDepth, pixelDepth } = window.screen;
  const timezoneOffset = new Date().getTimezoneOffset();
  
  const data = {
    userAgent,
    language,
    resolution: `${width}x${height}`,
    colorDepth,
    pixelDepth,
    timezoneOffset,
    hardwareConcurrency,
  };

  const jsonString = JSON.stringify(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(jsonString));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

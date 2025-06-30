'use client';

// A comprehensive client-side fingerprinting utility.

// Helper function to safely get a value
const safeGet = async <T>(getter: () => T | Promise<T>): Promise<T | string> => {
  try {
    const value = await getter();
    return value;
  } catch (error) {
    if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return 'Error: An unknown error occurred';
  }
};

// 1. Core Hardware
const getHardwareData = async () => {
  const getGpu = () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'WebGL not supported';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'Debug info not available';
    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    };
  };

  const getBattery = async () => {
    if (!('getBattery' in navigator)) return 'Battery API not supported';
    const battery = await (navigator as any).getBattery();
    return {
      level: battery.level,
      charging: battery.charging,
    };
  };

  return {
    gpu: await safeGet(getGpu),
    cpuCores: await safeGet(() => navigator.hardwareConcurrency),
    deviceMemory: await safeGet(() => (navigator as any).deviceMemory || 'N/A'),
    battery: await safeGet(getBattery),
  };
};

// 2. Rendering Signatures
const getRenderingData = async () => {
  const getCanvasFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'Canvas not supported';

    const text = "abcdefghijklmnopqrstuvwxyz0123456789";
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText(text, 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText(text, 4, 17);
    
    return canvas.toDataURL();
  };
  
  const getAudioFingerprint = () => new Promise((resolve, reject) => {
    try {
        const AudioContext = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
        if (!AudioContext) return resolve('AudioContext not supported');

        const context = new AudioContext(1, 44100, 44100);
        const oscillator = context.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, context.currentTime);

        const compressor = context.createDynamicsCompressor();
        for (const [key, value] of Object.entries({
            threshold: -50, knee: 40, ratio: 12, reduction: -20, attack: 0, release: 0.25
        })) {
            if (compressor[key as keyof DynamicsCompressorNode] && typeof (compressor[key as keyof DynamicsCompressorNode] as AudioParam).setValueAtTime === 'function') {
                ((compressor[key as keyof DynamicsCompressorNode]) as AudioParam).setValueAtTime(value, context.currentTime);
            }
        }

        oscillator.connect(compressor);
        compressor.connect(context.destination);
        oscillator.start(0);

        context.startRendering();
        context.oncomplete = (event) => {
            const sum = (event as any).renderedBuffer.getChannelData(0).reduce((acc: any, val: any) => acc + Math.abs(val), 0);
            resolve(sum.toString());
        };
     } catch (error) {
         resolve('Error generating audio fingerprint');
     }
  });


  return {
    canvas: await safeGet(getCanvasFingerprint),
    audio: await safeGet(getAudioFingerprint),
  };
};

// 3. Network Profile
const getNetworkData = async () => {
  const getPublicIp = async () => {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) return `Failed to fetch IP: ${response.statusText}`;
        const data = await response.json();
        return {
            ip: data.ip,
            city: data.city,
            region: data.region,
            country: data.country_name,
            isp: data.org,
        };
    } catch (error) {
        if (error instanceof Error) return `Error: ${error.message}`;
        return 'Error fetching public IP';
    }
  };

  const getLocalIp = () => new Promise((resolve) => {
    const RTCPeerConnection = window.RTCPeerConnection || (window as any).mozRTCPeerConnection || (window as any).webkitRTCPeerConnection;
    if (!RTCPeerConnection) return resolve('WebRTC not supported');
    
    // Set a timeout for the WebRTC connection
    const timeout = setTimeout(() => {
        resolve('Timeout');
    }, 1000);

    const conn = new RTCPeerConnection({ iceServers: [] });
    conn.createDataChannel('');
    conn.onicecandidate = (e) => {
        if (!e.candidate) return;
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
        const ip = ipRegex.exec(e.candidate.candidate)?.[1];
        if (ip && ip.indexOf('192.168') === 0) { // Filter for local IPs
            clearTimeout(timeout);
            conn.onicecandidate = null;
            resolve(ip);
        }
    };
    conn.createOffer()
      .then(offer => conn.setLocalDescription(offer))
      .catch(() => resolve('Error creating offer'));
  });

  return {
    public: await safeGet(getPublicIp),
    local: await safeGet(getLocalIp),
  }
};


// 4. Software Stack
const getSoftwareData = async () => {
    return {
        os: await safeGet(() => navigator.platform),
        browser: await safeGet(() => navigator.userAgent),
        languages: await safeGet(() => navigator.languages),
        timezone: await safeGet(() => new Date().getTimezoneOffset()),
        userAgent: await safeGet(() => navigator.userAgent),
    };
};

// 5. Browser Configuration
const getBrowserConfigData = async () => {
    const getPlugins = () => {
      if (!navigator.plugins) return 'N/A';
      return Array.from(navigator.plugins).map(p => ({name: p.name, filename: p.filename}));
    };
    
    const getFonts = () => new Promise((resolve) => {
        const fontList = [
            'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier',
            'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
            'Trebuchet MS', 'Arial Black', 'Impact', 'Calibri', 'Cambria', 'Candara',
            'Consolas', 'Constantia', 'Corbel', 'Segoe UI'
        ];
        
        if (typeof (document as any).fonts?.check !== 'function') {
           return resolve('Font checking not supported');
        }

        const availableFonts = fontList.filter(font => (document as any).fonts.check(`12px "${font}"`));
        resolve(availableFonts);
    });

    return {
        plugins: await safeGet(getPlugins),
        fonts: await safeGet(getFonts),
        cookiesEnabled: await safeGet(() => navigator.cookieEnabled),
        doNotTrack: await safeGet(() => navigator.doNotTrack ?? 'N/A'),
    };
};

// 6. Display
const getDisplayData = async () => {
    return {
        resolution: await safeGet(() => `${window.screen.width}x${window.screen.height}`),
        availableResolution: await safeGet(() => `${window.screen.availWidth}x${window.screen.availHeight}`),
        colorDepth: await safeGet(() => window.screen.colorDepth),
        pixelDepth: await safeGet(() => window.screen.pixelDepth),
    };
};

export const getFingerprint = async (): Promise<string> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'server';
  }

  const data = {
    hardware: await getHardwareData(),
    rendering: await getRenderingData(),
    network: await getNetworkData(),
    software: await getSoftwareData(),
    config: await getBrowserConfigData(),
    display: await getDisplayData(),
  };

  const jsonString = JSON.stringify(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(jsonString));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

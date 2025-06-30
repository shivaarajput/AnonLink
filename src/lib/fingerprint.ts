'use client';

// A comprehensive client-side fingerprinting utility, as per the detailed request.

// Helper function to safely get a value, handling errors gracefully.
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

// Category 1: Core Hardware & Performance
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
      version: gl.getParameter(gl.VERSION),
      supportedExtensions: gl.getSupportedExtensions(),
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
  
  const getCanvasFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'Canvas not supported';

    const text = "AnonLink_Fingerprint_ID_1.2.3-4567-890_!@#$%^&*()";
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
  
  const getAudioFingerprint = () => new Promise((resolve) => {
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
        context.oncomplete = (event: OfflineAudioCompletionEvent) => {
            const buffer = event.renderedBuffer;
            const sum = buffer.getChannelData(0).reduce((acc: number, val: number) => acc + Math.abs(val), 0);
            resolve(sum.toString());
        };
        setTimeout(() => resolve('AudioContext timeout'), 500); // Failsafe timeout
     } catch (error) {
         resolve('Error generating audio fingerprint');
     }
  });


  return {
    gpu: await safeGet(getGpu),
    cpuCores: await safeGet(() => navigator.hardwareConcurrency),
    deviceMemory: await safeGet(() => (navigator as any).deviceMemory || 'N/A'),
    battery: await safeGet(getBattery),
    canvasSignature: await safeGet(getCanvasFingerprint),
    audioSignature: await safeGet(getAudioFingerprint),
  };
};

// Category 2: Network & Geolocation
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
            vpn: data.security?.vpn || false,
            proxy: data.security?.proxy || false,
            tor: data.security?.tor || false,
        };
    } catch (error) {
        if (error instanceof Error) return `Error: ${error.message}`;
        return 'Error fetching public IP';
    }
  };

  const getLocalIp = () => new Promise<string>((resolve) => {
    const RTCPeerConnection = window.RTCPeerConnection || (window as any).mozRTCPeerConnection || (window as any).webkitRTCPeerConnection;
    if (!RTCPeerConnection) return resolve('WebRTC not supported');
    
    let resolved = false;
    const conn = new RTCPeerConnection({ iceServers: [] });
    const timeout = setTimeout(() => {
        if (!resolved) {
            conn.close();
            resolve('WebRTC Timeout');
            resolved = true;
        }
    }, 1000);

    conn.createDataChannel('');
    conn.onicecandidate = (e) => {
        if (resolved || !e || !e.candidate || !e.candidate.candidate) return;
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
        const ipMatch = ipRegex.exec(e.candidate.candidate);
        if (ipMatch) {
            clearTimeout(timeout);
            conn.close();
            if (!resolved) {
              resolve(ipMatch[1]);
              resolved = true;
            }
        }
    };
    conn.createOffer()
      .then(offer => conn.setLocalDescription(offer))
      .catch(() => {
          if(!resolved) {
            conn.close();
            resolve('Error creating WebRTC offer');
            resolved = true;
          }
      });
  });

  return {
    public: await safeGet(getPublicIp),
    local: await safeGet(getLocalIp),
  }
};


// Category 3: Browser & Software Environment
const getSoftwareData = async () => {
    const getPlugins = () => {
      if (!navigator.plugins) return 'N/A';
      return Array.from(navigator.plugins).map(p => ({name: p.name, filename: p.filename, description: p.description}));
    };
    
    const getFonts = () => new Promise((resolve) => {
        const fontList = [
            'Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Garamond', 
            'Comic Sans MS', 'Trebuchet MS', 'Impact', 'Segoe UI', 'Calibri', 'Candara', 'Menlo'
        ];
        
        if (typeof (document as any).fonts?.check !== 'function') {
           return resolve('Font checking not supported');
        }

        try {
            const availableFonts = fontList.filter(font => (document as any).fonts.check(`12px "${font}"`));
            resolve(availableFonts);
        } catch (e) {
            resolve('Error checking fonts');
        }
    });

    return {
        os: await safeGet(() => (navigator as any).userAgentData?.platform || navigator.platform),
        userAgent: await safeGet(() => navigator.userAgent),
        browser: await safeGet(() => {
            const ua = navigator.userAgent;
            let tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
            if(/trident/i.test(M[1])){
                tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
                return 'IE '+(tem[1] || '');
            }
            if(M[1] === 'Chrome'){
                tem = ua.match(/\b(OPR|Edge|Edg)\/(\d+)/);
                if(tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera').replace('Edg', 'Edge');
            }
            M = M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
            if((tem = ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
            return M.join(' ');
        }),
        languages: await safeGet(() => navigator.languages),
        timezone: await safeGet(() => new Intl.DateTimeFormat().resolvedOptions().timeZone),
        plugins: await safeGet(getPlugins),
        fonts: await safeGet(getFonts),
        cookiesEnabled: await safeGet(() => navigator.cookieEnabled),
        doNotTrack: await safeGet(() => navigator.doNotTrack ?? 'N/A'),
    };
};

// Category 4: Display & Media Devices
const getDisplayData = async () => {
    const getMediaDevices = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return 'MediaDevices API not supported';
        }
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.map(d => ({ kind: d.kind, label: d.label ? 'yes' : 'no' })); // Don't expose full labels
        } catch(e) {
            return 'Could not enumerate devices';
        }
    };

    return {
        resolution: await safeGet(() => `${window.screen.width}x${window.screen.height}`),
        availableResolution: await safeGet(() => `${window.screen.availWidth}x${window.screen.availHeight}`),
        windowSize: await safeGet(() => `${window.innerWidth}x${window.innerHeight}`),
        colorDepth: await safeGet(() => window.screen.colorDepth),
        pixelDepth: await safeGet(() => window.screen.pixelDepth),
        orientation: await safeGet(() => window.screen.orientation?.type || 'N/A'),
        mediaDevices: await safeGet(getMediaDevices),
    };
};

// Main function to assemble the fingerprint
export const getFingerprint = async (): Promise<{ hash: string, data: any }> => {
  // Prevent execution on the server
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { hash: 'server', data: { type: 'server' } };
  }

  const data = {
    hardware: await getHardwareData(),
    network: await getNetworkData(),
    software: await getSoftwareData(),
    display: await getDisplayData(),
  };

  // Create a stable JSON string for hashing
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(jsonString));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash: hashHex, data };
};

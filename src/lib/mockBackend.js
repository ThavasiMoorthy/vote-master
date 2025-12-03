// Mock backend for development with dummy user data
const DUMMY_USER = {
  email: 'mthavasi085@gmail.com',
  password: 'test@123',
  id: '1',
  name: 'M Thavasi',
  role: 'admin'
};

// Persistent storage using localStorage (falls back to in-memory during SSR/tests)
const STORAGE_KEY_SHEETS = 'voter:sheets';
const STORAGE_KEY_POINTS = 'voter:points';
const STORAGE_KEY_NEXT_IDS = 'voter:nextIds';

function loadFromStorage(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

let sheetsStore = [];
let pointsStore = [];
let nextSheetId = 1;
let nextPointId = 1;

// initialize from localStorage if available
try {
  if (typeof localStorage !== 'undefined') {
    sheetsStore = loadFromStorage(STORAGE_KEY_SHEETS, []);
    pointsStore = loadFromStorage(STORAGE_KEY_POINTS, []);
    const ids = loadFromStorage(STORAGE_KEY_NEXT_IDS, null);
    if (ids && typeof ids.nextSheetId === 'number' && typeof ids.nextPointId === 'number') {
      nextSheetId = ids.nextSheetId;
      nextPointId = ids.nextPointId;
    } else {
      // compute next ids based on existing stores
      const lastSheet = sheetsStore.length ? sheetsStore[sheetsStore.length - 1].id : null;
      const lastPoint = pointsStore.length ? pointsStore[pointsStore.length - 1].id : null;
      if (lastSheet && lastSheet.startsWith('sheet-')) {
        nextSheetId = parseInt(lastSheet.split('-')[1], 10) + 1;
      }
      if (lastPoint && lastPoint.startsWith('point-')) {
        nextPointId = parseInt(lastPoint.split('-')[1], 10) + 1;
      }
    }
  }
} catch (e) {
  // ignore
}

import * as supa from './supabaseClient';

const SUPABASE_CONFIGURED = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export const mockBackend = {
  auth: {
    login: async (username, password) => {
      // Check against dummy credentials
      if (username === DUMMY_USER.email && password === DUMMY_USER.password) {
        const token = btoa(JSON.stringify({
          id: DUMMY_USER.id,
          username: DUMMY_USER.email,
          role: DUMMY_USER.role,
          exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        }));
        return {
          success: true,
          token: token,
          user: {
            id: DUMMY_USER.id,
            username: DUMMY_USER.email,
            email: DUMMY_USER.email,
            name: DUMMY_USER.name,
            role: DUMMY_USER.role
          }
        };
      } else {
        throw new Error('Invalid email or password.');
      }
    },

    register: async (username, password) => {
      // For demo purposes, just return success
      const token = btoa(JSON.stringify({
        id: '2',
        username: username,
        role: 'user',
        exp: Date.now() + 24 * 60 * 60 * 1000
      }));
      return {
        success: true,
        token: token,
        user: {
          id: '2',
          username: username,
          email: username,
          name: username.split('@')[0],
          role: 'user'
        }
      };
    }
    ,
    sendOtp: async (email) => {
      // If an OTP server URL is configured, delegate sending to it (real email via server)
      try {
        const otpServer = import.meta.env.VITE_OTP_API_URL;
        if (otpServer) {
          const res = await fetch(`${otpServer.replace(/\/$/, '')}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Failed to send OTP via server');
          // server may return otp in dev mode
          return { success: true, otp: json.otp };
        }

        // Fallback: In pure mock mode generate OTP in sessionStorage
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(`otp_${email}`, otp);
        }
        console.log(`Mock OTP for ${email}: ${otp}`);
        return { success: true };
      } catch (e) {
        throw new Error(e.message || 'Failed to send OTP');
      }
    },

    verifyOtp: async (email, otp) => {
      try {
        const otpServer = import.meta.env.VITE_OTP_API_URL;
        if (otpServer) {
          const res = await fetch(`${otpServer.replace(/\/$/, '')}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'OTP verification failed');
          return { success: true, token: json.token, user: json.user };
        }

        const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`otp_${email}`) : null;
        if (!stored || stored !== otp) {
          throw new Error('Invalid OTP');
        }
        // For mock, return the admin token if email matches dummy user
        if (email === DUMMY_USER.email) {
          const token = btoa(JSON.stringify({ id: DUMMY_USER.id, username: DUMMY_USER.email, role: DUMMY_USER.role, exp: Date.now() + 24 * 60 * 60 * 1000 }));
          return { success: true, token, user: { id: DUMMY_USER.id, username: DUMMY_USER.email, email: DUMMY_USER.email, name: DUMMY_USER.name, role: DUMMY_USER.role } };
        }
        // Otherwise return a generic user
        const token = btoa(JSON.stringify({ id: '2', username: email, role: 'user', exp: Date.now() + 24 * 60 * 60 * 1000 }));
        return { success: true, token, user: { id: '2', username: email, email, name: email.split('@')[0], role: 'user' } };
      } catch (e) {
        throw e;
      }
    }
  },

  // Helper to inspect stored token for role (mock enforcement)
  _getRoleFromStoredToken: () => {
    try {
      // Check sessionStorage first for admin session token (short-lived, in-memory-like)
      if (typeof sessionStorage !== 'undefined') {
        const adminToken = sessionStorage.getItem('admin_auth_token');
        if (adminToken) {
          try {
            const payloadA = JSON.parse(atob(adminToken));
            return payloadA.role || null;
          } catch (e) {
            // ignore and fallthrough
          }
        }
      }

      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return null;
      const payload = JSON.parse(atob(token));
      return payload.role || null;
    } catch (e) {
      return null;
    }
  },

  authenticate: async (email, password) => {
    // Mock authentication
    return {
      user: {
        id: '1',
        email: email,
        name: email.split('@')[0],
        role: 'user'
      },
      token: 'mock-token-' + Date.now()
    };
  },

  logout: async () => {
    return { success: true };
  },

  getCurrentUser: async () => {
    // Return null for unauthenticated state
    return null;
  },

  getVoterData: async () => {
    return [];
  },

  saveVoterData: async (data) => {
    return { success: true, data };
  },

  // Sheet CRUD operations
  sheets: {
    create: async (sheetData) => {
      if (SUPABASE_CONFIGURED) {
        // delegate to Supabase
        return await supa.supaCreateSheet(sheetData);
      }
      const id = `sheet-${nextSheetId++}`;
      const sheet = {
        id,
        ...sheetData,
        createdAt: new Date().toISOString()
      };
      sheetsStore.push(sheet);
      // persist
      saveToStorage(STORAGE_KEY_SHEETS, sheetsStore);
      saveToStorage(STORAGE_KEY_NEXT_IDS, { nextSheetId, nextPointId });
      console.log('Sheet created:', sheet);
      return sheet;
    },

    list: async () => {
      // Only allow listing sheets for admin users in mock mode
      const role = mockBackend._getRoleFromStoredToken();
      if (role !== 'admin' && !SUPABASE_CONFIGURED) {
        throw new Error('Unauthorized: admin access required');
      }
      if (SUPABASE_CONFIGURED) {
        return await supa.supaListSheets();
      }
      // refresh from storage to reflect changes across tabs
      if (typeof localStorage !== 'undefined') {
        sheetsStore = loadFromStorage(STORAGE_KEY_SHEETS, sheetsStore);
      }
      console.log('Fetching sheets, count:', sheetsStore.length);
      return sheetsStore;
    },

    get: async (id) => {
      if (SUPABASE_CONFIGURED) {
        return await supa.supaGetSheet(id);
      }
      return sheetsStore.find(s => s.id === id);
    },

    update: async (id, updates) => {
      if (SUPABASE_CONFIGURED) {
        return await supa.supaUpdateSheet(id, updates);
      }
      const index = sheetsStore.findIndex(s => s.id === id);
      if (index > -1) {
        sheetsStore[index] = {
          ...sheetsStore[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        saveToStorage(STORAGE_KEY_SHEETS, sheetsStore);
        console.log('Sheet updated:', sheetsStore[index]);
        return sheetsStore[index];
      }
      throw new Error('Sheet not found');
    },

    delete: async (id) => {
      // Only admins can delete sheets in mock mode
      const role = mockBackend._getRoleFromStoredToken();
      if (role !== 'admin' && !SUPABASE_CONFIGURED) {
        throw new Error('Unauthorized: admin access required');
      }
      if (SUPABASE_CONFIGURED) {
        return await supa.supaDeleteSheet(id);
      }
      const index = sheetsStore.findIndex(s => s.id === id);
      if (index > -1) {
        sheetsStore.splice(index, 1);
        saveToStorage(STORAGE_KEY_SHEETS, sheetsStore);
        console.log('Sheet deleted:', id);
        return { success: true };
      }
      throw new Error('Sheet not found');
    }
  },

  // Point CRUD operations
  points: {
    create: async (pointData) => {
      if (SUPABASE_CONFIGURED) {
        return await supa.supaCreatePoint(pointData);
      }
      const id = `point-${nextPointId++}`;
      const point = {
        id,
        ...pointData,
        createdAt: new Date().toISOString()
      };
      pointsStore.push(point);
      // persist
      saveToStorage(STORAGE_KEY_POINTS, pointsStore);
      saveToStorage(STORAGE_KEY_NEXT_IDS, { nextSheetId, nextPointId });
      console.log('Point created:', point);
      return point;
    },

    list: async () => {
      // Only allow listing points for admin users in mock mode
      const role = mockBackend._getRoleFromStoredToken();
      if (role !== 'admin' && !SUPABASE_CONFIGURED) {
        throw new Error('Unauthorized: admin access required');
      }
      if (SUPABASE_CONFIGURED) {
        return await supa.supaListPoints();
      }
      if (typeof localStorage !== 'undefined') {
        pointsStore = loadFromStorage(STORAGE_KEY_POINTS, pointsStore);
      }
      console.log('Fetching points, count:', pointsStore.length);
      return pointsStore;
    },

    get: async (id) => {
      if (SUPABASE_CONFIGURED) {
        return await supa.supaGetPoint(id);
      }
      return pointsStore.find(p => p.id === id);
    },

    update: async (id, updates) => {
      if (SUPABASE_CONFIGURED) {
        return await supa.supaUpdatePoint(id, updates);
      }
      const index = pointsStore.findIndex(p => p.id === id);
      if (index > -1) {
        pointsStore[index] = {
          ...pointsStore[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        saveToStorage(STORAGE_KEY_POINTS, pointsStore);
        console.log('Point updated:', pointsStore[index]);
        return pointsStore[index];
      }
      throw new Error('Point not found');
    },

    delete: async (id) => {
      // Only allow deleting points for admin users in mock mode
      const role = mockBackend._getRoleFromStoredToken();
      if (role !== 'admin' && !SUPABASE_CONFIGURED) {
        throw new Error('Unauthorized: admin access required');
      }
      if (SUPABASE_CONFIGURED) {
        return await supa.supaDeletePoint(id);
      }
      const index = pointsStore.findIndex(p => p.id === id);
      if (index > -1) {
        pointsStore.splice(index, 1);
        saveToStorage(STORAGE_KEY_POINTS, pointsStore);
        console.log('Point deleted:', id);
        return { success: true };
      }
      throw new Error('Point not found');
    }
  }
};

// Export as 'api' for compatibility
export const api = mockBackend;

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
const STORAGE_KEY_USERS = 'voter:users'; // New key for users

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
let usersStore = []; // New store for users
let nextSheetId = 1;
let nextPointId = 1;

// initialize from localStorage if available
try {
  if (typeof localStorage !== 'undefined') {
    sheetsStore = loadFromStorage(STORAGE_KEY_SHEETS, []);
    pointsStore = loadFromStorage(STORAGE_KEY_POINTS, []);
    usersStore = loadFromStorage(STORAGE_KEY_USERS, []); // Load users
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
console.log('Debug: SUPABASE_CONFIGURED =', SUPABASE_CONFIGURED, 'URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');

export const mockBackend = {
  auth: {
    login: async (username, password) => {
      console.log('Debug: Login called for', username);
      if (SUPABASE_CONFIGURED) {
        console.log('Debug: Delegating login to Supabase...');
        try {
          const { user, session } = await supa.supaLogin(username, password);
          console.log('Debug: Supabase login successful', user?.id);
          // Map Supabase user to our app's user format
          const isAdmin = user.email === 'mthavasi085@gmail.com';
          const role = isAdmin ? 'admin' : (user.user_metadata?.role || 'user');

          return {
            success: true,
            token: btoa(JSON.stringify({
              id: user.id,
              username: user.email,
              role: role,
              exp: session?.expires_at ? session.expires_at * 1000 : Date.now() + 24 * 60 * 60 * 1000
            })),
            user: {
              id: user.id,
              username: user.email,
              email: user.email,
              name: user.user_metadata?.name || user.email.split('@')[0],
              role: role
            }
          };
        } catch (err) {
          console.error('Debug: Supabase login failed:', err.message);
          throw err;
        }
      }

      // Check against dummy credentials OR stored users
      const storedUser = usersStore.find(u => u.email === username && u.password === password);

      if ((username === DUMMY_USER.email && password === DUMMY_USER.password) || storedUser) {
        const user = storedUser || DUMMY_USER;
        const token = btoa(JSON.stringify({
          id: user.id,
          username: user.email,
          role: user.role,
          exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        }));
        return {
          success: true,
          token: token,
          user: {
            id: user.id,
            username: user.email,
            email: user.email,
            name: user.name,
            role: user.role
          }
        };
      } else {
        throw new Error('Invalid email or password.');
      }
    },

    register: async (username, password) => {
      if (SUPABASE_CONFIGURED) {
        const { user, session } = await supa.supaRegister(username, password, {
          role: 'user',
          name: username.split('@')[0]
        });
        return {
          success: true,
          token: btoa(JSON.stringify({
            id: user.id,
            username: user.email,
            role: 'user',
            exp: session?.expires_at ? session.expires_at * 1000 : Date.now() + 24 * 60 * 60 * 1000
          })),
          user: {
            id: user.id,
            username: user.email,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
            role: 'user'
          }
        };
      }

      // Check if user already exists
      if (usersStore.find(u => u.email === username) || username === DUMMY_USER.email) {
        // For now, just allow it or maybe throw error? 
        // But to keep it simple and "always work" as requested, we'll just log them in if they exist, 
        // OR create a new one if they don't.
      }

      const newUser = {
        id: `user-${Date.now()}`,
        email: username,
        password: password, // In a real app, hash this!
        name: username.split('@')[0],
        role: 'user'
      };

      usersStore.push(newUser);
      saveToStorage(STORAGE_KEY_USERS, usersStore);

      const token = btoa(JSON.stringify({
        id: newUser.id,
        username: newUser.email,
        role: newUser.role,
        exp: Date.now() + 24 * 60 * 60 * 1000
      }));

      return {
        success: true,
        token: token,
        user: {
          id: newUser.id,
          username: newUser.email,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
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

          // Store stateless OTP details if returned
          if (json.hash && json.expires) {
            sessionStorage.setItem(`otp_hash_${email}`, json.hash);
            sessionStorage.setItem(`otp_expires_${email}`, json.expires);
          }

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
          // Retrieve stateless details
          const hash = sessionStorage.getItem(`otp_hash_${email}`);
          const expires = sessionStorage.getItem(`otp_expires_${email}`);

          const res = await fetch(`${otpServer.replace(/\/$/, '')}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, hash, expires })
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
      console.log('Debug: api.sheets.create called', sheetData);
      if (SUPABASE_CONFIGURED) {
        console.log('Debug: Attempting to save to Supabase...');
        try {
          const result = await supa.supaCreateSheet(sheetData);
          console.log('Debug: Supabase save successful', result);
          return result;
        } catch (err) {
          console.error('Debug: Supabase save failed', err);
          throw err;
        }
      }
      const id = `sheet-${nextSheetId++}`;
      const sheet = {
        id,
        ...sheetData,
        userId: sheetData.userId, // Explicitly store userId
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
      console.log('Listing sheets. Detected role:', role);

      if (role !== 'admin' && !SUPABASE_CONFIGURED) {
        // throw new Error('Unauthorized: admin access required');
      }
      if (SUPABASE_CONFIGURED) {
        // Get current user ID from token if not admin
        let currentUserId = null;
        if (role !== 'admin') {
          const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
          if (token) {
            try {
              const payload = JSON.parse(atob(token));
              currentUserId = payload.id;
              console.log('Listing for specific user:', currentUserId);
            } catch (e) {
              console.error('Error parsing token for user ID:', e);
            }
          }
        } else {
          console.log('Listing all sheets (Admin)');
        }
        return await supa.supaListSheets(currentUserId);
      }
      // refresh from storage to reflect changes across tabs
      if (typeof localStorage !== 'undefined') {
        sheetsStore = loadFromStorage(STORAGE_KEY_SHEETS, sheetsStore);
      }

      // Filter by user ID if not admin
      if (role !== 'admin') {
        // We need to get the current user ID. In a real app, this comes from the token.
        // For mock, we'll decode the token again or use a helper.
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
        let currentUserId = null;
        if (token) {
          try {
            const payload = JSON.parse(atob(token));
            currentUserId = payload.id;
          } catch (e) { }
        }

        if (currentUserId) {
          // Use loose equality (==) to handle string vs number ID mismatches
          const filtered = sheetsStore.filter(s => s.userId == currentUserId);
          console.log(`Fetching sheets for user ${currentUserId}, count:`, filtered.length);
          return filtered;
        }
      }

      console.log('Fetching sheets (admin/all), count:', sheetsStore.length);
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
  },

  // Helper to seed data for demonstration
  seedData: async () => {
    if (SUPABASE_CONFIGURED) return; // Don't seed real DB

    const demoSheets = [
      { houseName: 'House A', colourRound: 'red', community: 'Community 1', noOfVoters: 4, location: { lat: 11.1271, lng: 78.6569 }, createdAt: new Date().toISOString() },
      { houseName: 'House B', colourRound: 'blue', community: 'Community 1', noOfVoters: 3, location: { lat: 11.1281, lng: 78.6579 }, createdAt: new Date().toISOString() },
      { houseName: 'House C', colourRound: 'saffron', community: 'Community 2', noOfVoters: 5, location: { lat: 11.1261, lng: 78.6559 }, createdAt: new Date().toISOString() },
      { houseName: 'House D', colourRound: 'green', community: 'Community 2', noOfVoters: 2, location: { lat: 11.1291, lng: 78.6589 }, createdAt: new Date().toISOString() },
      { houseName: 'House E', colourRound: 'yellow', community: 'Community 3', noOfVoters: 6, location: { lat: 11.1251, lng: 78.6549 }, createdAt: new Date().toISOString() }
    ];

    for (const s of demoSheets) {
      const id = `sheet-${nextSheetId++}`;
      sheetsStore.push({ id, ...s });
    }
    saveToStorage(STORAGE_KEY_SHEETS, sheetsStore);
    saveToStorage(STORAGE_KEY_NEXT_IDS, { nextSheetId, nextPointId });
    return { success: true };
  }
};

// Export as 'api' for compatibility
export const api = mockBackend;

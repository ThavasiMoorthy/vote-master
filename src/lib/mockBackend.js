// Mock backend for development with dummy user data
const DUMMY_USER = {
  email: 'admin@gmail.com',
  password: 'test@123',
  id: '1',
  name: 'Admin User',
  role: 'admin'
};

// In-memory storage for sheets and points
let sheetsStore = [];
let pointsStore = [];
let nextSheetId = 1;
let nextPointId = 1;

export const mockBackend = {
  auth: {
    login: async (username, password) => {
      // Check against dummy credentials
      if (username === DUMMY_USER.email && password === DUMMY_USER.password) {
        const token = btoa(JSON.stringify({
          id: DUMMY_USER.id,
          username: DUMMY_USER.email,
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
        throw new Error('Invalid email or password. Try: admin@gmail.com / test@123');
      }
    },
    
    register: async (username, password) => {
      // For demo purposes, just return success
      const token = btoa(JSON.stringify({
        id: '2',
        username: username,
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
      const id = `sheet-${nextSheetId++}`;
      const sheet = {
        id,
        ...sheetData,
        createdAt: new Date().toISOString()
      };
      sheetsStore.push(sheet);
      console.log('Sheet created:', sheet);
      return sheet;
    },

    list: async () => {
      console.log('Fetching sheets, count:', sheetsStore.length);
      return sheetsStore;
    },

    get: async (id) => {
      return sheetsStore.find(s => s.id === id);
    },

    update: async (id, updates) => {
      const index = sheetsStore.findIndex(s => s.id === id);
      if (index > -1) {
        sheetsStore[index] = {
          ...sheetsStore[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        console.log('Sheet updated:', sheetsStore[index]);
        return sheetsStore[index];
      }
      throw new Error('Sheet not found');
    },

    delete: async (id) => {
      const index = sheetsStore.findIndex(s => s.id === id);
      if (index > -1) {
        sheetsStore.splice(index, 1);
        console.log('Sheet deleted:', id);
        return { success: true };
      }
      throw new Error('Sheet not found');
    }
  },

  // Point CRUD operations
  points: {
    create: async (pointData) => {
      const id = `point-${nextPointId++}`;
      const point = {
        id,
        ...pointData,
        createdAt: new Date().toISOString()
      };
      pointsStore.push(point);
      console.log('Point created:', point);
      return point;
    },

    list: async () => {
      console.log('Fetching points, count:', pointsStore.length);
      return pointsStore;
    },

    get: async (id) => {
      return pointsStore.find(p => p.id === id);
    },

    update: async (id, updates) => {
      const index = pointsStore.findIndex(p => p.id === id);
      if (index > -1) {
        pointsStore[index] = {
          ...pointsStore[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        console.log('Point updated:', pointsStore[index]);
        return pointsStore[index];
      }
      throw new Error('Point not found');
    },

    delete: async (id) => {
      const index = pointsStore.findIndex(p => p.id === id);
      if (index > -1) {
        pointsStore.splice(index, 1);
        console.log('Point deleted:', id);
        return { success: true };
      }
      throw new Error('Point not found');
    }
  }
};

// Export as 'api' for compatibility
export const api = mockBackend;

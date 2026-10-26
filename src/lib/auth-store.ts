import fs from 'fs';
import path from 'path';

interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date | string;
}

interface MagicLinkRecord {
  url: string;
  timestamp: number;
  delivered: boolean;
  error?: string;
}

interface AuthStoreData {
  users: Record<string, any>;
  accounts: Record<string, any>;
  verificationTokens: Record<string, VerificationToken>;
  latestMagicLinks: Record<string, MagicLinkRecord>;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'auth_store.json');

// Ensure directory exists
function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('[AuthStore] Failed to create data directory:', err);
  }
}

// Global singleton to survive HMR / Turbopack reloading
const globalStore = globalThis as unknown as {
  __HACKGRID_AUTH_DATA__?: AuthStoreData;
};

function loadStore(): AuthStoreData {
  if (globalStore.__HACKGRID_AUTH_DATA__) {
    return globalStore.__HACKGRID_AUTH_DATA__;
  }

  ensureDir();
  let data: AuthStoreData = {
    users: {},
    accounts: {},
    verificationTokens: {},
    latestMagicLinks: {},
  };

  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      data = {
        users: parsed.users || {},
        accounts: parsed.accounts || {},
        verificationTokens: parsed.verificationTokens || {},
        latestMagicLinks: parsed.latestMagicLinks || {},
      };
    }
  } catch (err) {
    console.warn('[AuthStore] Failed to read auth store file, using fresh store:', err);
  }

  globalStore.__HACKGRID_AUTH_DATA__ = data;
  return data;
}

function persistStore(data: AuthStoreData) {
  globalStore.__HACKGRID_AUTH_DATA__ = data;
  try {
    ensureDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AuthStore] Failed to write auth store file:', err);
  }
}

export const authStore = {
  // Verification tokens
  createVerificationToken({ identifier, expires, token }: VerificationToken) {
    const data = loadStore();
    const key = `${identifier.toLowerCase()}:${token}`;
    data.verificationTokens[key] = {
      identifier: identifier.toLowerCase(),
      expires: new Date(expires).toISOString(),
      token,
    };
    persistStore(data);
    return data.verificationTokens[key];
  },

  useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
    const data = loadStore();
    const key = `${identifier.toLowerCase()}:${token}`;
    const tokenObj = data.verificationTokens[key];

    if (!tokenObj) {
      console.warn(`[AuthStore] Verification token not found for key: ${key}`);
      return null;
    }

    // Check expiry
    const expiryDate = new Date(tokenObj.expires);
    if (expiryDate.getTime() < Date.now()) {
      console.warn(`[AuthStore] Verification token expired for ${identifier}`);
      delete data.verificationTokens[key];
      persistStore(data);
      return null;
    }

    // Delete token (single use)
    delete data.verificationTokens[key];
    persistStore(data);
    return {
      identifier: tokenObj.identifier,
      token: tokenObj.token,
      expires: new Date(tokenObj.expires),
    };
  },

  // Users
  createUser(user: any) {
    const data = loadStore();
    const id = user.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const email = (user.email || '').toLowerCase();
    const newUser = {
      ...user,
      id,
      email,
      name: user.name || email.split('@')[0] || 'Participant',
      createdAt: new Date().toISOString(),
    };
    data.users[id] = newUser;
    persistStore(data);
    return newUser;
  },

  getUser(id: string) {
    const data = loadStore();
    return data.users[id] || null;
  },

  getUserByEmail(email: string) {
    const data = loadStore();
    const lower = (email || '').toLowerCase();
    for (const u of Object.values(data.users)) {
      if ((u.email || '').toLowerCase() === lower) {
        return u;
      }
    }
    return null;
  },

  getUserByAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
    const data = loadStore();
    const key = `${provider}:${providerAccountId}`;
    const account = data.accounts[key];
    if (!account) return null;
    return data.users[account.userId] || null;
  },

  updateUser(user: any) {
    const data = loadStore();
    const existing = data.users[user.id] || {};
    const updated = { ...existing, ...user, updatedAt: new Date().toISOString() };
    data.users[user.id] = updated;
    persistStore(data);
    return updated;
  },

  linkAccount(account: any) {
    const data = loadStore();
    const key = `${account.provider}:${account.providerAccountId}`;
    data.accounts[key] = account;
    persistStore(data);
    return account;
  },

  // Latest magic link caching for presentation & dev preview
  setLatestMagicLink(email: string, url: string, delivered: boolean = false, error?: string) {
    const data = loadStore();
    data.latestMagicLinks[email.toLowerCase()] = {
      url,
      timestamp: Date.now(),
      delivered,
      error,
    };
    persistStore(data);
  },

  getLatestMagicLinkRecord(email: string): MagicLinkRecord | null {
    const data = loadStore();
    const record = data.latestMagicLinks[email.toLowerCase()];
    if (!record) return null;
    // Link valid for 10 minutes for dev preview
    if (Date.now() - record.timestamp > 10 * 60 * 1000) {
      delete data.latestMagicLinks[email.toLowerCase()];
      persistStore(data);
      return null;
    }
    return record;
  },

  getLatestMagicLink(email: string): string | null {
    const record = this.getLatestMagicLinkRecord(email);
    return record ? record.url : null;
  },
};

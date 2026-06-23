import { auth as firebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, updateProfile, sendPasswordResetEmail } from 'firebase/auth';

export interface Session {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      display_name?: string;
      full_name?: string;
      name?: string;
      avatar_url?: string;
    };
  };
}

const readFileAsDataURL = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

class MockQueryBuilder {
  private tableName: string;
  private data: any[];
  private filters: ((item: any) => boolean)[] = [];
  private sortKey: string | null = null;
  private ascending: boolean = true;
  private limitCount: number | null = null;
  private pendingUpdate: any = null;
  private pendingUpsert: { data: any; options?: { onConflict?: string } } | null = null;
  private isDelete: boolean = false;

  constructor(tableName: string, data?: any[]) {
    this.tableName = tableName;
    if (data) {
      this.data = data;
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`mock_db_${tableName}`);
      this.data = stored ? JSON.parse(stored) : [];
    } else {
      this.data = [];
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(this.data));
    }
  }

  select(columns: string = "*", options?: { count?: string; head?: boolean }) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sortKey = column;
    this.ascending = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private executeFilters() {
    let results = [...this.data];
    for (const filter of this.filters) {
      results = results.filter(filter);
    }
    if (this.sortKey) {
      results.sort((a, b) => {
        const valA = a[this.sortKey!];
        const valB = b[this.sortKey!];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (valA < valB) return this.ascending ? -1 : 1;
        if (valA > valB) return this.ascending ? 1 : -1;
        return 0;
      });
    }
    if (this.limitCount !== null) {
      results = results.slice(0, this.limitCount);
    }
    return results;
  }

  private executeMutationAndGetResults() {
    let results = this.executeFilters();

    if (this.pendingUpdate) {
      for (const item of results) {
        Object.assign(item, this.pendingUpdate);
      }
      const updatedIds = new Set(results.map(r => r.id));
      this.data = this.data.map(item => {
        if (updatedIds.has(item.id)) {
          return results.find(r => r.id === item.id);
        }
        return item;
      });
      this.save();
      return { data: results, error: null };
    }

    if (this.pendingUpsert) {
      const items = Array.isArray(this.pendingUpsert.data) ? this.pendingUpsert.data : [this.pendingUpsert.data];
      const key = this.pendingUpsert.options?.onConflict || 'id';

      const createdOrUpdated: any[] = [];
      for (const item of items) {
        const idx = this.data.findIndex((x) => x[key] === item[key]);
        if (idx !== -1) {
          Object.assign(this.data[idx], item);
          createdOrUpdated.push(this.data[idx]);
        } else {
          const newItem = {
            id: item.id || `id_${Math.random().toString(36).substring(2, 11)}`,
            created_at: new Date().toISOString(),
            started_at: new Date().toISOString(),
            ...item
          };
          this.data.push(newItem);
          createdOrUpdated.push(newItem);
        }
      }
      this.save();
      return { data: createdOrUpdated, error: null };
    }

    if (this.isDelete) {
      const idsToDelete = new Set(results.map(r => r.id));
      this.data = this.data.filter(item => !idsToDelete.has(item.id));
      this.save();
      return { data: results, error: null };
    }

    return { data: results, error: null };
  }

  async maybeSingle() {
    const { data: results, error } = this.executeMutationAndGetResults();
    if (error) return { data: null, error };
    if (this.tableName === 'user_roles') {
      const user = firebaseAuth.currentUser;
      if (user && (user.email === 'ritik@gmail.com' || user.email === 'ritikjagnit@gmail.com')) {
        return { data: { role: 'admin' }, error: null };
      }
    }
    if (!results || results.length === 0) return { data: null, error: null };
    return { data: results[0], error: null };
  }

  async single() {
    const { data: results, error } = this.executeMutationAndGetResults();
    if (error) return { data: null, error };
    if (!results || results.length === 0) return { data: null, error: new Error("No rows found") };
    return { data: results[0], error: null };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    const res = this.executeMutationAndGetResults();
    return Promise.resolve({ data: res.data, error: res.error, count: res.data ? res.data.length : 0 }).then(onfulfilled, onrejected);
  }

  insert(newData: any | any[]) {
    const items = Array.isArray(newData) ? newData : [newData];
    const createdItems = items.map(item => ({
      id: item.id || `id_${Math.random().toString(36).substring(2, 11)}`,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      ...item
    }));

    this.data.push(...createdItems);
    this.save();

    return new MockQueryBuilder(this.tableName, createdItems);
  }

  update(updateData: any) {
    this.pendingUpdate = updateData;
    return this;
  }

  upsert(upsertData: any | any[], options?: { onConflict?: string }) {
    this.pendingUpsert = { data: upsertData, options };
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }
}

const storageMock = {
  from: (bucketName: string) => {
    return {
      upload: async (path: string, file: File | Blob) => {
        try {
          const dataUrl = await readFileAsDataURL(file);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`mock_storage_${path}`, dataUrl);
          }
          return { data: { path }, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },
      getPublicUrl: (path: string) => {
        const dataUrl = (typeof window !== 'undefined' ? localStorage.getItem(`mock_storage_${path}`) : "") || "";
        return {
          data: {
            publicUrl: dataUrl
          }
        };
      }
    };
  }
};

let authInitialized = typeof window === 'undefined';
let resolveAuthInitialized: (() => void) | null = null;
const authInitializedPromise = new Promise<void>((resolve) => {
  if (typeof window === 'undefined') {
    resolve();
  } else {
    resolveAuthInitialized = resolve;
  }
});

if (typeof window !== 'undefined') {
  onAuthStateChanged(firebaseAuth, () => {
    authInitialized = true;
    if (resolveAuthInitialized) {
      resolveAuthInitialized();
    }
  });
}

const authMock = {
  getSession: async () => {
    if (!authInitialized) {
      await authInitializedPromise;
    }
    const user = firebaseAuth.currentUser;
    if (user) {
      const session = {
        user: {
          id: user.uid,
          email: user.email || undefined,
          user_metadata: {
            display_name: user.displayName || undefined,
            full_name: user.displayName || undefined
          }
        }
      };
      return { data: { session }, error: null };
    }
    return { data: { session: null }, error: null };
  },
  onAuthStateChange: (cb: (event: string, session: any) => void) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        const session = {
          user: {
            id: user.uid,
            email: user.email || undefined,
            user_metadata: {
              display_name: user.displayName || undefined,
              full_name: user.displayName || undefined
            }
          }
        };
        cb('SIGNED_IN', session);
      } else {
        cb('SIGNED_OUT', null);
      }
    });
    return {
      data: {
        subscription: {
          unsubscribe: () => unsubscribe()
        }
      }
    };
  },
  signUp: async ({ email, password, options }: any) => {
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      if (options?.data?.display_name && cred.user) {
        await updateProfile(cred.user, { displayName: options.data.display_name });
      }
      const session = {
        user: {
          id: cred.user.uid,
          email: cred.user.email || undefined,
          user_metadata: {
            display_name: options?.data?.display_name || cred.user.displayName || undefined,
            full_name: options?.data?.display_name || cred.user.displayName || undefined
          }
        }
      };
      return { data: { user: session.user, session }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: err };
    }
  },
  signInWithPassword: async ({ email, password }: any) => {
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const session = {
        user: {
          id: cred.user.uid,
          email: cred.user.email || undefined,
          user_metadata: {
            display_name: cred.user.displayName || undefined,
            full_name: cred.user.displayName || undefined
          }
        }
      };
      return { data: { user: session.user, session }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: err };
    }
  },
  signOut: async () => {
    try {
      await fbSignOut(firebaseAuth);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  },
  resetPasswordForEmail: async (email: string) => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      return { data: {}, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }
};

export const supabase = {
  auth: authMock,
  from: (tableName: string) => new MockQueryBuilder(tableName),
  storage: storageMock
};

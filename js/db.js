// ══════════════════════════════════════════════════════════════════
//  FinalTouchDB — IndexedDB wrapper
//  Replaces localStorage-based saveState / loadState
//  Auto-migrates existing data from localStorage on first run
// ══════════════════════════════════════════════════════════════════
const DB_NAME    = 'FinalTouchDB';
const DB_VERSION = 1;
const STORES     = ['cars','orders','services','expenses','invoices',
                    'receipts','photos','closings','settings','users'];

const db = (() => {
  let _db = null;

  // ── open ──────────────────────────────────────────────────────────
  function open() {
    return new Promise((resolve, reject) => {
      if (_db) { resolve(_db); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const database = e.target.result;
        STORES.forEach(name => {
          if (!database.objectStoreNames.contains(name)) {
            database.createObjectStore(name, { keyPath: 'id', autoIncrement: false });
          }
        });
      };
      req.onsuccess = e => { _db = e.target.result; resolve(_db); };
      req.onerror   = e => reject(e.target.error);
    });
  }

  // ── save one record ───────────────────────────────────────────────
  async function save(table, data) {
    const database = await open();
    return new Promise((resolve, reject) => {
      const tx  = database.transaction(table, 'readwrite');
      const st  = tx.objectStore(table);
      const req = st.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  // ── load all records ──────────────────────────────────────────────
  async function load(table) {
    const database = await open();
    return new Promise((resolve, reject) => {
      const tx  = database.transaction(table, 'readonly');
      const st  = tx.objectStore(table);
      const req = st.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = e => reject(e.target.error);
    });
  }

  // ── get one record by id ──────────────────────────────────────────
  async function get(table, id) {
    const database = await open();
    return new Promise((resolve, reject) => {
      const tx  = database.transaction(table, 'readonly');
      const st  = tx.objectStore(table);
      const req = st.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = e => reject(e.target.error);
    });
  }

  // ── delete one record ─────────────────────────────────────────────
  async function remove(table, id) {
    const database = await open();
    return new Promise((resolve, reject) => {
      const tx  = database.transaction(table, 'readwrite');
      const st  = tx.objectStore(table);
      const req = st.delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = e => reject(e.target.error);
    });
  }

  // ── clear entire store ────────────────────────────────────────────
  async function clear(table) {
    const database = await open();
    return new Promise((resolve, reject) => {
      const tx  = database.transaction(table, 'readwrite');
      const st  = tx.objectStore(table);
      const req = st.clear();
      req.onsuccess = () => resolve();
      req.onerror   = e => reject(e.target.error);
    });
  }

  // ── export full JSON backup ───────────────────────────────────────
  async function exportJSON() {
    const out = {};
    for (const name of STORES) {
      out[name] = await load(name);
    }
    return JSON.stringify(out, null, 2);
  }

  // ── import full JSON backup ───────────────────────────────────────
  async function importJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    for (const name of STORES) {
      if (!data[name]) continue;
      await clear(name);
      for (const record of data[name]) {
        await save(name, record);
      }
    }
  }

  // ── save full state object (used by saveState replacement) ────────
  async function saveState(stateObj) {
    // Settings record holds the full state snapshot (except arrays stored separately)
    await save('settings', { id: 'appState', ...stateObj });
  }

  // ── load full state object ────────────────────────────────────────
  async function loadState() {
    const rec = await get('settings', 'appState');
    return rec || null;
  }

  // ── photo helpers (Blob-aware) ────────────────────────────────────
  async function savePhoto(carId, type, dataUrl) {
    const id = carId + '_' + type + '_' + Date.now();
    await save('photos', { id, carId, type, data: dataUrl, createdAt: new Date().toISOString() });
    return id;
  }

  async function getCarPhotosByType(carId, type) {
    const all = await load('photos');
    return all.filter(p => p.carId === carId && p.type === type);
  }

  async function deletePhoto(id) {
    await remove('photos', id);
  }

  // ── receipt helpers ───────────────────────────────────────────────
  async function saveReceipt(expenseId, dataUrl) {
    await save('receipts', { id: expenseId, data: dataUrl, savedAt: new Date().toISOString() });
  }

  async function getReceipt(expenseId) {
    const rec = await get('receipts', expenseId);
    return rec ? rec.data : null;
  }

  async function deleteReceipt(expenseId) {
    await remove('receipts', expenseId);
  }

  // ── auto-migration from localStorage ─────────────────────────────
  async function migrateFromLocalStorage() {
    const migrated = localStorage.getItem('ft_idb_migrated');
    if (migrated) return; // already done

    try {
      // Migrate main state
      const raw = localStorage.getItem('finaltouchv2');
      if (raw) {
        const parsed = JSON.parse(raw);
        await saveState(parsed);
        console.log('[DB] Migrated main state from localStorage');
      }

      // Migrate photos
      const photosRaw = localStorage.getItem('ft_photos');
      if (photosRaw) {
        const photosMap = JSON.parse(photosRaw);
        for (const [carId, photos] of Object.entries(photosMap)) {
          for (const type of ['reception','delivery']) {
            const list = photos[type] || [];
            for (const dataUrl of list) {
              await savePhoto(carId, type, dataUrl);
            }
          }
        }
        console.log('[DB] Migrated photos from localStorage');
      }

      // Migrate expense receipts
      const expRaw = localStorage.getItem('ft_exp_receipts');
      if (expRaw) {
        const receiptsMap = JSON.parse(expRaw);
        for (const [id, dataUrl] of Object.entries(receiptsMap)) {
          await saveReceipt(id, dataUrl);
        }
        console.log('[DB] Migrated expense receipts from localStorage');
      }

      localStorage.setItem('ft_idb_migrated', '1');
    } catch (e) {
      console.warn('[DB] Migration warning:', e);
    }
  }

  return {
    open, save, load, get, delete: remove, clear,
    exportJSON, importJSON,
    saveState, loadState,
    savePhoto, getCarPhotosByType, deletePhoto,
    saveReceipt, getReceipt, deleteReceipt,
    migrateFromLocalStorage
  };
})();

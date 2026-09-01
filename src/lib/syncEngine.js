/**
 * محرك المزامنة وإدارة العمليات في وضع عدم الاتصال (Offline-First Sync Engine)
 * منصة نَسَق (Nasaq)
 */

const SYNC_QUEUE_KEY = "nasaq_offline_sync_queue_v1";

// ─── مساعدة التخزين المحلي للطابور ──────────────────────────────────────────

export const getPendingSyncQueue = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Failed to parse sync queue:", e);
    return [];
  }
};

export const savePendingSyncQueue = (queue) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    notifySubscribers();
  } catch (e) {
    console.warn("Failed to save sync queue:", e);
  }
};

export const getPendingQueueCount = () => {
  return getPendingSyncQueue().length;
};

// ─── المشتركون في حالة الشبكة والطابور ──────────────────────────────────────────

const syncSubscribers = new Set();

const notifySubscribers = () => {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  const count = getPendingQueueCount();
  syncSubscribers.forEach((cb) => cb({ isOnline, pendingCount: count }));
};

export const subscribeNetworkStatus = (callback) => {
  syncSubscribers.add(callback);
  
  if (typeof window !== "undefined") {
    const handleOnline = () => {
      notifySubscribers();
      syncOfflineMutations();
    };
    const handleOffline = () => {
      notifySubscribers();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // فحص مبدئي
    callback({
      isOnline: navigator.onLine,
      pendingCount: getPendingQueueCount(),
    });

    return () => {
      syncSubscribers.delete(callback);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }

  return () => syncSubscribers.delete(callback);
};

export const isNetworkOnline = () => {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
};

// ─── إضافة عملية إلى طابور المزامنة ─────────────────────────────────────────

export const enqueueMutation = (mutation) => {
  const queue = getPendingSyncQueue();
  const item = {
    id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...mutation,
  };
  queue.push(item);
  savePendingSyncQueue(queue);
  console.log(`[SyncEngine] Enqueued offline mutation: ${item.type} on ${item.entity}`);
  return item;
};

// ─── تنفيذ المزامنة التلقائية مع السيرفر ────────────────────────────────────

let isSyncing = false;

export const syncOfflineMutations = async () => {
  if (typeof window === "undefined" || isSyncing) return { success: true, processed: 0 };
  if (!navigator.onLine) return { success: false, error: "لا يوجد اتصال بالإنترنت" };

  const queue = getPendingSyncQueue();
  if (queue.length === 0) return { success: true, processed: 0 };

  isSyncing = true;
  console.log(`[SyncEngine] Starting sync of ${queue.length} pending mutations...`);

  const remainingQueue = [];
  let processedCount = 0;

  for (const item of queue) {
    try {
      let endpoint = "/api/families";
      let method = "POST";
      let body = {};

      if (item.entity === "family") {
        endpoint = "/api/families";
        if (item.type === "add") {
          method = "POST";
          body = { campId: item.campId, family: item.payload };
        } else if (item.type === "update") {
          method = "PUT";
          body = { id: item.id || item.payload?.id, ...item.payload };
        } else if (item.type === "delete") {
          method = "DELETE";
          endpoint = `/api/families?id=${encodeURIComponent(item.recordId || item.payload?.id)}`;
        } else if (item.type === "batch") {
          method = "POST";
          body = { campId: item.campId, action: "batch", families: item.payload };
        } else if (item.type === "deleteAll") {
          method = "DELETE";
          endpoint = `/api/families?campId=${encodeURIComponent(item.campId)}&action=all`;
        }
      } else if (item.entity === "nomination") {
        endpoint = "/api/nominations";
        if (item.type === "add") {
          method = "POST";
          body = { campId: item.campId, nomination: item.payload };
        } else if (item.type === "update") {
          method = "PUT";
          body = { id: item.id || item.payload?.id, ...item.payload };
        } else if (item.type === "delete") {
          method = "DELETE";
          endpoint = `/api/nominations?id=${encodeURIComponent(item.recordId || item.payload?.id)}`;
        } else if (item.type === "batch") {
          method = "POST";
          body = { campId: item.campId, action: "batch", nominations: item.payload };
        } else if (item.type === "deleteAll") {
          method = "DELETE";
          endpoint = `/api/nominations?campId=${encodeURIComponent(item.campId)}&action=all`;
        }
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method !== "DELETE" || !endpoint.includes("?") ? JSON.stringify(body) : undefined,
      });

      if (res.ok) {
        processedCount++;
        console.log(`[SyncEngine] Successfully synced mutation: ${item.id}`);
      } else {
        console.warn(`[SyncEngine] Server responded with error for mutation: ${item.id}`, res.status);
        remainingQueue.push(item);
      }
    } catch (err) {
      console.warn(`[SyncEngine] Network failed during sync of mutation: ${item.id}`, err);
      remainingQueue.push(item);
    }
  }

  savePendingSyncQueue(remainingQueue);
  isSyncing = false;
  notifySubscribers();

  return {
    success: remainingQueue.length === 0,
    processed: processedCount,
    remaining: remainingQueue.length,
  };
};

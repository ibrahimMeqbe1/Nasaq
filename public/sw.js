// Service Worker for نَسَق (Nasaq) Humanitarian Camp Platform
const CACHE_NAME = "nasaq-pwa-v3";

// 1. تثبيت الـ Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// 2. تفعيل الـ Service Worker وتنظيف جميع النسخ والكاشات القديمة فوراً
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. إدارة الطلبات: دائماً الاتصال بالشبكة أولاً (Network-First) لمنع تجميد الواجهة
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل الطلبات غير الـ HTTP/HTTPS
  if (!url.protocol.startsWith("http")) return;

  // استثناء كافة طلبات الـ API ومسارات المصادقة من الكاش لضمان وصول البيانات الحقيقية فوراً
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/data/")) {
    return;
  }

  // بالنسبة لطلبات التعديل (POST, PUT, DELETE): تمر للشبكة مباشرة
  if (request.method !== "GET") {
    return;
  }

  // Network-First لكافة الصفحات والملفات
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && request.method === "GET") {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});


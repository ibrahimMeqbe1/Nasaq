# تقرير QA الشامل

- المشروع: `C:\Users\Ibrahim\Downloads\kareem-camp-main`
- التاريخ: ١٣‏/٠٨‏/٢٠٢٦، ١٢:٤٧ م

## الملخص

| المستوى | العدد |
|---|---|
| حرج | 0 |
| عالي | 0 |
| متوسط | 3 |
| منخفض | 48 |
| معلومة | 0 |
| **الإجمالي** | **51** |

## حسب المحور

| المحور | العدد |
|---|---|
| الأمان | 0 |
| جودة الكود | 23 |
| الأداء | 7 |
| التصميم وإمكانية الوصول | 21 |

## جودة الكود

### منخفض

- **[heuristic]** `scratch\inspect.js:35` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scratch\inspect.js:41` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scratch\inspect.js:52` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scratch\inspect.js:57` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scratch\inspect.js:73` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scratch\inspect.js:74` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scratch\inspect.js:77` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scratch\inspect.js:79` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scratch\inspect.js:81` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scratch\inspect.js:83` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scripts\migratePasswords.mjs:35` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scripts\migratePasswords.mjs:53` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scripts\migratePasswords.mjs:57` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scripts\migratePasswords.mjs:64` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scripts\migratePasswords.mjs:80` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `scripts\migratePasswords.mjs:84` — no-console
  استخدام console.log متروك بالكود — يُفضّل إزالته أو استبداله بنظام logging.
- **[heuristic]** `session-fix-patch\src\services\campService.js` — large-file
  ملف كبير الحجم (774 سطر) — يُفضّل تقسيمه لتحسين القابلية للصيانة.
- **[heuristic]** `src\components\NominationForm.jsx` — large-file
  ملف كبير الحجم (732 سطر) — يُفضّل تقسيمه لتحسين القابلية للصيانة.
- **[heuristic]** `src\components\NominationTable.jsx` — large-file
  ملف كبير الحجم (676 سطر) — يُفضّل تقسيمه لتحسين القابلية للصيانة.
- **[heuristic]** `src\services\campService.js` — large-file
  ملف كبير الحجم (780 سطر) — يُفضّل تقسيمه لتحسين القابلية للصيانة.
- **[heuristic]** `src\views\Dashboard.jsx` — large-file
  ملف كبير الحجم (544 سطر) — يُفضّل تقسيمه لتحسين القابلية للصيانة.
- **[heuristic]** `src\views\PrintPage.jsx` — large-file
  ملف كبير الحجم (547 سطر) — يُفضّل تقسيمه لتحسين القابلية للصيانة.
- **[heuristic]** `src\views\SuperAdmin.jsx` — large-file
  ملف كبير الحجم (1427 سطر) — يُفضّل تقسيمه لتحسين القابلية للصيانة.

## الأداء

### متوسط

- **[heuristic]** `scripts\migratePasswords.mjs:8` — sync-fs
  استخدام دالة *Sync من fs يحجب event loop في الخادم أثناء التنفيذ.
- **[heuristic]** `scripts\migratePasswords.mjs:9` — sync-fs
  استخدام دالة *Sync من fs يحجب event loop في الخادم أثناء التنفيذ.

### منخفض

- **[heuristic]** `src\components\Navbar.jsx:36` — raw-img-tag
  استخدام <img> عادي بدل next/image يفوّت تحسينات الصور التلقائية (lazy loading، تغيير الحجم).
- **[heuristic]** `src\views\CampSettings.jsx:209` — raw-img-tag
  استخدام <img> عادي بدل next/image يفوّت تحسينات الصور التلقائية (lazy loading، تغيير الحجم).
- **[heuristic]** `src\views\Dashboard.jsx:179` — raw-img-tag
  استخدام <img> عادي بدل next/image يفوّت تحسينات الصور التلقائية (lazy loading، تغيير الحجم).
- **[heuristic]** `src\views\PerformanceDashboard.jsx:162` — raw-img-tag
  استخدام <img> عادي بدل next/image يفوّت تحسينات الصور التلقائية (lazy loading، تغيير الحجم).
- **[heuristic]** `src\views\PrintPage.jsx:282` — raw-img-tag
  استخدام <img> عادي بدل next/image يفوّت تحسينات الصور التلقائية (lazy loading، تغيير الحجم).

## التصميم وإمكانية الوصول

### متوسط

- **[heuristic]** `src\components\ExcelImportModal.jsx:379` — div-onclick-no-role
  عنصر div يحتوي onClick بدون role/tabIndex مناسب — قد لا يكون قابلاً للاستخدام عبر لوحة المفاتيح.

### منخفض

- **[heuristic]** `public\index.html:7` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\app\context\AppContext.jsx:167` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\app\context\AppContext.jsx:169` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\App.css:8` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\App.css:9` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\App.css:10` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\App.css:11` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\App.css:12` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\components\AnimatedNumber.jsx:50` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\components\AnimatedNumber.jsx:82` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\components\AnimatedNumber.jsx:95` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\components\AnimatedNumber.jsx:101` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\components\AnimatedNumber.jsx:123` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\components\AnnouncementBar.jsx:36` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\components\AnnouncementBar.jsx:37` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\components\AnnouncementBar.jsx:42` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\components\AnnouncementBar.jsx:43` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\components\AnnouncementBar.jsx:47` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\components\DeveloperModal.jsx:20` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.
- **[heuristic]** `src\components\DeveloperModal.jsx:21` — hardcoded-hex-color
  لون مكتوب مباشرة (hex) بدل استخدام متغيرات تصميم (design tokens) — يصعّب توحيد الهوية البصرية لاحقاً.


# YAZI — Cloudflare Pages Edition

تم تحويل مشروع YAZI من Netlify إلى Cloudflare Pages + Pages Functions + D1.

## ما تم تحويله
- الموقع العام والتصميم الحالي بالكامل.
- `/api/yazi` أصبح Cloudflare Pages Function.
- الحجوزات وطلبات المودلز والحالات والمواعيد المحجوبة والإعدادات أصبحت في D1 بدل Netlify Blobs.
- لوحة `/admin/` تستخدم نفس الواجهة ونفس API.
- البريد الاختياري عبر Resend ما زال مدعوماً.
- WhatsApp يستخدم 971509149431 والبريد hello@yazi.ae.

## مهم قبل النشر
Cloudflare Dashboard Direct Upload لا يدعم Pages Functions. استخدمي Git integration أو Wrangler CLI.

### 1) إنشاء D1
```bash
npm install
npx wrangler login
npx wrangler d1 create yazi-db --location apac
```
انسخي `database_id` الناتج إلى `wrangler.jsonc` بدل `PASTE_D1_DATABASE_ID_HERE`.

### 2) إنشاء الجداول
```bash
npx wrangler d1 migrations apply yazi-db --remote
```

### 3) متغيرات الأمان
في Cloudflare Pages > المشروع > Settings > Variables and Secrets أضيفي:
- `YAZI_ADMIN_PASSWORD` = كلمة مرور الإدارة التي تختارينها.
- `YAZI_SESSION_SECRET` = نص عشوائي قوي وطويل (يفضل 32+ حرفاً).
- اختياري: `YAZI_RESEND_API_KEY`
- اختياري: `YAZI_FROM_EMAIL` = `YAZI Website <hello@yazi.ae>` بعد توثيق الدومين لدى Resend.

### 4) النشر
```bash
npx wrangler pages deploy public
```
أو اربطي المشروع مع GitHub واجعلي Build output directory هو `public`.

### 5) ربط yazi.ae
Cloudflare Pages > Custom domains > Set up a domain > `yazi.ae`.
للدومين الرئيسي apex يجب أن تكون Nameservers للدومين على Cloudflare.

## ملاحظة البيانات القديمة
هذه النسخة تبدأ بقاعدة D1 جديدة. الطلبات الموجودة حالياً في Netlify Blobs لا تنتقل تلقائياً. احتفظي بمشروع Netlify مؤقتاً إلى أن ننقل البيانات أو نتأكد أنه لا توجد طلبات مهمة يجب ترحيلها.

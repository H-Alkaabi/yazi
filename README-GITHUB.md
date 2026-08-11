# YAZI — GitHub Clean Package

هذه النسخة مخصصة للرفع إلى GitHub ثم النشر عبر Cloudflare Workers.

## مهم
ارفع **محتويات هذا المجلد مباشرة إلى جذر Repository** ولا ترفع المجلد نفسه داخل مجلد آخر.

يجب أن يظهر في جذر GitHub ملفات مثل:
- package.json
- wrangler.toml أو wrangler.jsonc
- public/
- src/ أو functions/ بحسب بنية المشروع
- migrations/ إن وجدت

## Cloudflare Build Settings
- Root directory: /
- Build command: اتركه فارغاً
- Deploy command: `npx wrangler deploy`

## بعد الرفع
ارجع إلى Cloudflare واضغط Retry build.

## ملاحظة
تمت إعادة إنشاء package.json كنص JSON سليم لتجنب خطأ `RIFF` الذي ظهر أثناء `bun install`.

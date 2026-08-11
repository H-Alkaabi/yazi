# YAZI — Cloudflare Worker GitHub Clean v2

هذه النسخة مصححة للنشر بواسطة:

```bash
npx wrangler deploy
```

## سبب الإصلاح
النسخة السابقة كانت تستخدم `pages_build_output_dir` وهو إعداد خاص بـ Cloudflare Pages،
بينما Cloudflare Build كان ينفذ `wrangler deploy` الخاص بـ Workers.

النسخة الحالية تستخدم:
- `main: ./src/index.js`
- `assets.directory: ./public`
- `ASSETS` binding
- Worker routing لـ `/api/*`
- D1 binding باسم `DB`

## قبل أول Deploy ناجح
استبدلي في `wrangler.jsonc`:
`PASTE_D1_DATABASE_ID_HERE`
بـ Database ID الحقيقي بعد إنشاء D1 database باسم `yazi-db`.

ثم شغلي migration على قاعدة البيانات.

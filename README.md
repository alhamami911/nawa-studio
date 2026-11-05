# Nawa Tutorial Builder

مشروع مستقل لإنتاج فيديوهات تعليمية عربية لمنصة نوى (منفصل عن JAWAB Studio).

## الإنتاج
```
node src/produce.mjs 01-platform-tour            # تسجيل + صوت + موسيقى + هوية + ترجمة
node src/produce.mjs 01-platform-tour --remix    # إعادة المونتاج فقط من آخر تسجيل
node src/produce.mjs 01-platform-tour --voice=ar-SA-HamedNeural   # الصوت المجاني (ذكر) بدل ElevenLabs
```
المخرجات في `out/`: ملف mp4 وملف ترجمة srt.

## لوحة الإنتاج
```
npm run dashboard      # ثم افتح http://127.0.0.1:4174
```
تعرض السلاسل المعتمدة وحالة كل حلقة (مخططة / سيناريو جاهز / مكتملة)، وتشغّل الإنتاج وإعادة المونتاج مع اختيار الصوت وسجل مباشر، وتعاين الفيديوهات واللقطات والهوية. محلية افتراضيًا.

### فتحها من أي مكان (Cloudflare Tunnel)
```
winget install Cloudflare.cloudflared
# ضع DASHBOARD_PASSWORD (10 أحرف فأكثر) في .env
npm run share          # يطبع رابط https://....trycloudflare.com
```
الطلبات الخارجية تتطلب كلمة المرور دائمًا (وبدونها يرفضها الخادم)، وتُقفل المحاولات الخاطئة بعد 5. عن بعد: عرض فقط، ولقطات الإدارة مخفية؛ ولفتح التشغيل أضف `DASHBOARD_REMOTE_CONTROL=1`. الرابط المؤقت يتغير عند كل تشغيل؛ لرابط ثابت على نطاقك استخدم Named Tunnel من حساب Cloudflare (`cloudflared tunnel --url http://127.0.0.1:4174` خلف اسم نطاق). بيانات الخطة في `data/series.json`.

## المكونات
| المسار | الدور |
|---|---|
| `src/episodes/*.mjs` | سيناريو الحلقة: الخطوات والنص المنطوق والمكتوب |
| `src/overlay.js` | المؤشر والإطار المضيء والتكبير والشرح المكتوب والبطاقات |
| `src/dashboard.mjs` | لوحة الإنتاج (خادم محلي بلا مكتبات) وصفحتها `dashboard-page.mjs` |
| `src/produce.mjs` | الصوت (Edge TTS المجاني) والتسجيل والمونتاج |
| `src/fetch-brand.mjs` | جلب الشعار والأيقونات والألوان من موقع المنصة |
| `src/make-music.mjs` | توليد موسيقى خلفية أصلية (بلا حقوق نشر) |
| `assets/brand/` | شعار نوى وأيقوناتها وملف الألوان والخط |

## الإعداد
```
npm install
npx playwright install chromium
pip install edge-tts          # الصوت العربي المجاني
copy .env.example .env        # ثم املأ NAWA_BASE_URL وNAWA_USER وNAWA_PASSWORD
```
المتطلبات: Node 20+ وPython 3 وffmpeg في PATH.

## الدليل المعتمد
فهرس السلاسل والحلقات: [docs/nawa-series-plan.pdf](docs/nawa-series-plan.pdf) (المصدر `docs/series-plan.html`، والتحديث بـ `npm run pdf`).
الأصول واللقطات: [assets/README.md](assets/README.md).

## الهوية (من الموقع)
برتقالي `#c34d04` (primary)، خلفية `#f9f8fc`، نص `#342616`، الخط IBM Plex Sans Arabic.

## ملاحظات
- الدخول يتم خارج التسجيل حتى لا تظهر بيانات الحساب.
- الصوت المجاني من Microsoft Edge TTS (يحتاج إنترنت). التبديل إلى ElevenLabs لاحقًا يكون في مرحلة الصوت داخل `produce.mjs`.
- لا تُرفع ملفات `.env`، ولا مجلدا `out/` و`work/` (الفيديوهات تُنشر من خارج المستودع).
- لقطات لوحة الإدارة (`assets/screens/admin/`) محلية فقط لأنها من موقع فعلي.

## الصوت
المعتمد صوت ذكر فقط: ElevenLabs (Abu Fahad) بمعرّفه في `.env`، والاحتياطي المجاني ar-SA-HamedNeural.

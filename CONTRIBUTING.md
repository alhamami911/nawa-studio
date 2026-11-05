# المساهمة في Nawa Studio

## الإعداد
المتطلبات: Node 20+، وffmpeg في PATH، وPython 3 (للصوت المجاني الاحتياطي).

```
git clone https://github.com/alhamami911/nawa-studio.git
cd nawa-studio
npm install
npx playwright install chromium
pip install edge-tts
```

ثم أنشئ ملف `.env` من `.env.example` على جهازك فقط:

| المتغير | الاستعمال |
|---|---|
| `NAWA_BASE_URL` / `NAWA_USER` / `NAWA_PASSWORD` | حساب لتسجيل الشروحات. استعمل حسابًا مخصّصًا للتصوير بصلاحية محدودة، وليس حساب مدير يحمل بيانات حقيقية. |
| `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` | الصوت. بدونهما يُستعمل الصوت المجاني عند `--voice=ar-SA-HamedNeural`. |
| `DASHBOARD_PASSWORD` (10 أحرف فأكثر) | كلمة مرور اللوحة عند المشاركة عن بعد. |
| `DASHBOARD_PUBLIC=1` | عرض عام للقراءة فقط. |

**لا تُرفع الأسرار أبدًا.** `.env` ومجلدا `out/` و`work/` ولقطات `assets/screens/admin/` خارج المستودع، والـ CI يرفض أي رفع لها.

## سير العمل
1. افرع من `main`: `git switch -c feature/<name>`.
2. شغّل `npm run check` قبل الدفع.
3. افتح Pull Request. لا يُدمج شيء في `main` إلا بعد مراجعة من الطرف الآخر.

## إضافة حلقة
1. أنشئ `src/episodes/NN-name.mjs` يصدّر `meta` و`steps` (انظر الحلقات الموجودة).
   - `speech` هو المنطوق، و`text` هو المكتوب على الشاشة عند اختلافهما (مثل الأسماء اللاتينية).
   - اكتب ما يُرى على الشاشة فقط، ولا تخترع ميزات.
   - لا تضغط أزرارًا تغيّر بيانات الحساب (إنجاز درس، إرسال نموذج، شراء) ولا تطلب الميكروفون.
2. أضفها في `data/series.json` بحقل `ep`.
3. `node src/produce.mjs NN-name`، والناتج في `out/`.
4. راجع إطارات من الفيديو (لا تعتمد على نجاح التشغيل وحده).

## البنية
راجع [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

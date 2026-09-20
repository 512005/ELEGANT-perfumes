# دليل تشغيل ورفع متجر NOVALRE واستضافته 24/7 (Deployment Guide)

هذا الدليل يشرح خطوة بخطوة كيف تشغل المشروع محلياً على VS Code، وكيف ترفعه على GitHub وتستضيفه على سيرفر سحابي مجاني ليعمل للعملاء طوال الوقت **24/7** دون أن يتوقف أبداً.

---

## 1. التشغيل المحلي السريع على جهازك (VS Code)

المشروع الآن مجهز للعمل تلقائياً بدون الحاجة لتثبيت MySQL أو أي سيرفرات خارجية:

1. افتح مجلد المشروع في **VS Code**.
2. افتح الـ Terminal (`Ctrl + ~`) ونفذ:
   ```bash
   npm install
   ```
3. لتشغيل المتجر محلياً:
   ```bash
   npm run dev
   ```
4. افتح المتصفح على: `http://localhost:3000`
   - ستجد المتجر يعمل مباشرة بقائمة عطور NOVALRE الفاخرة (رجالي وحريمي).
   - يمكنك تجربة حجز عطر، إضافته للسلة، وإتمام الطلب.
5. للدخول إلى لوحة الإدارة:
   - الرابط: `http://localhost:3000/admin`
   - البريد: `bassantsaleh2005@gmail.com`
   - كلمة المرور: `novalre2026`

---

## 2. رفع المشروع إلى GitHub

> **ملاحظة للمبتدئين:** إذا لم تكن أداة Git مثبتة على جهازك وظهر لك أن الأمر `git` غير معروف، يمكنك تحميل وتثبيت Git في دقيقة من [git-scm.com](https://git-scm.com/download/win) أو استخدام برنامج [GitHub Desktop](https://desktop.github.com) لرفع المجلد بسهولة بالماوس.

1. في الـ Terminal تأكد من عمل Git:
   ```bash
   git init
   git add .
   git commit -m "feat: Standalone NOVALRE perfume store ready for 24/7 deployment"
   ```
2. ادخل على حسابك في [GitHub](https://github.com) وأنشئ مستودع جديد (New Repository) باسم `perfume-brand-store` (اجعله Public أو Private كما تحب).
3. اربط المشروع وارفعه:
   ```bash
   git remote add origin https://github.com/USERNAME/perfume-brand-store.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. النشر السحابي المجاني الدائم (Deploy 24/7)

هناك طريقتان مميزتان ومجانيتان ليعمل الموقع 24 ساعة:

### الخيار الأفضل والأسهل: استضافة Render (مجانية)

1. سجل حساباً مجانياً على [Render.com](https://render.com).
2. اضغط على **New +** ثم اختر **Web Service**.
3. اختر **Build and deploy from a Git repository** واربط حسابك بـ GitHub ثم اختر مستودع `perfume-brand-store`.
4. املأ الإعدادات التالية:
   - **Name:** `novalre-store` (أو أي اسم تفضله)
   - **Region:** Frankfurt (EU) (الأقرب للشرق الأوسط ومصر)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     npm run start
     ```
   - **Instance Type:** `Free`
5. في قسم **Environment Variables**، أضف المتغيرات التالية:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `JWT_SECRET` = `اختر_كلمة_سر_عشوائية_طويلة`
   - `ADMIN_EMAIL` = `bassantsaleh2005@gmail.com`
   - `ADMIN_PASSWORD` = `كلمة_سر_لوحة_التحكم_الخاصة_بك`
6. اضغط **Create Web Service**.
   - خلال دقائق سيبني Render الموقع ويعطيك رابطاً مجانياً دائماً مثل:
     `https://novalre-store.onrender.com`
   - سيعمل الموقع 24 ساعة وتستطيع ربطه بدومين خاص بك مجاناً (مثل `novalre.com`).

---

### خيار قاعدة بيانات سحابية دائمة (TiDB Cloud MySQL - مجانية للأبد)

إذا أردت تخزين كل الطلبات والمنتجات في قاعدة بيانات MySQL سحابية عملاقة مجاناً:

1. افتح موقع [TiDB Cloud](https://tidbcloud.com) وسجل حساباً مجانياً.
2. اضغط **Create Cluster** واختر الخطة المجانية الدائمة (**Serverless - Free Tier**).
3. اضغط **Connect** وانسخ رابط الاتصال الذي يظهر بصيغة:
   ```
   mysql://USER:PASSWORD@gateway:4000/test?ssl={"rejectUnauthorized":true}
   ```
4. ضعه في متغيرات البيئة على Render باسم:
   `DATABASE_URL`
5. بمجرد وضعه، سيتحول المتجر فوراً لاستخدام قاعدة بيانات MySQL السحابية بدلاً من التخزين المحلي!

---

## 4. نصائح مهمة لإدارة المتجر
- لتغيير كلمة سر الأدمن: عدّل `ADMIN_PASSWORD` في لوحة تحكم الاستضافة.
- كل طلب جديد يظهر في شاشة الإدارة ويحتوي على زر مباشر **تواصل واتساب** لفتح المحادثة مع العميل فوراً.
- كل عميل يقوم بإتمام طلب يظهر له زر **تأكيد فوري عبر واتساب** بالإضافة إلى إيصال الطلب وإمكانية طباعته أو حفظه PDF.

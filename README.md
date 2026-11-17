# Wat: ติดตามพระบิณฑบาตแบบสด

เว็บแอปที่ให้ญาติโยมเห็นว่าพระที่ออกบิณฑบาตเดินถึงไหนแล้ว
บริบท การตัดสินใจ และแผนงานทั้งหมดอยู่ใน [CLAUDE.md](CLAUDE.md)

Next.js 16 (App Router) + Firebase (Auth, Firestore, App Hosting) + Leaflet/OpenStreetMap

## ติดตั้งเพื่อพัฒนา

ต้องมี Node.js 22 ขึ้นไป

1. สร้าง Firebase project (ควรแยก project สำหรับ dev กับ production)
   - เปิด **Authentication** แล้วเปิดวิธี Email/Password
   - เปิด **Cloud Firestore**
   - เพิ่ม Web app เพื่อเอาค่า config
   - ไปที่ Project settings > Service accounts > Generate new private key
2. คัดลอก `.env.local.example` เป็น `.env.local` แล้วกรอกค่าให้ครบ
3. ติดตั้งและรัน
   ```bash
   npm install
   npm run seed -- --dev   # ใส่ข้อมูลทดสอบวัดนิคมกิตติยาราม (เฉพาะ project dev เท่านั้น)
   npm run dev
   ```
4. Deploy rules ไปที่ project dev ครั้งแรก: `npx firebase-tools deploy --only firestore --project <dev-project-id>`

ตรวจโค้ดก่อน push: `npm run lint && npm run typecheck && npm run check`

## ทดสอบบนมือถือ

geolocation ต้องใช้ HTTPS ถ้าจะทดสอบหน้าส่งพิกัดบนมือถือจริงให้รัน `npx next dev --experimental-https`
แล้วเปิดผ่าน IP ของเครื่องในวงแลนเดียวกัน หรือทดสอบบน URL ของ App Hosting

## บทบาทผู้ใช้

| บทบาท | ได้มาอย่างไร |
|---|---|
| แอดมินวัด | สร้างบัญชีแล้วลงทะเบียนวัดที่ `/register` ระบบตั้งสิทธิ์ให้อัตโนมัติ |
| ผู้ส่งพิกัด | Phase 1: แอดมินวัดส่งพิกัดเองที่ `/alms/send` (การเพิ่มบัญชีลูกศิษย์อยู่ใน Phase 4) |
| super admin | ให้ super admin คนเดิมรัน `node --env-file=.env.local scripts/set-super-admin.mts <email>` แล้วผู้ได้รับสิทธิ์ต้องออกและเข้าสู่ระบบใหม่ |

## Deploy ขึ้น production (Firebase App Hosting)

ทุกบัญชี (GitHub, Firebase, โดเมน) ต้องอยู่ในองค์กรหรือทีมที่มีเจ้าของมากกว่าหนึ่งคน

1. **Blaze plan**: App Hosting ต้องใช้ Blaze ตั้ง budget alert ใน Google Cloud Billing ตั้งแต่วันแรก
2. **สร้าง backend**: Firebase console > Build > App Hosting > Create backend
   - region `asia-southeast1`, เชื่อม GitHub repo นี้, branch `main`, root directory `/`
   - ตั้งชื่อ backend `wat` ให้ตรงกับ URL ใน `apphosting.yaml` (ถ้าใช้ชื่ออื่นให้แก้ `NEXT_PUBLIC_SITE_URL`)
   - push เข้า `main` แล้ว deploy อัตโนมัติ
3. **สิทธิ์ของเซิร์ฟเวอร์**: Google Cloud IAM > service account `firebase-app-hosting-compute@<project-id>.iam.gserviceaccount.com`
   เพิ่ม role **Cloud Datastore User** และ **Firebase Authentication Admin**
   (เซิร์ฟเวอร์ใช้สิทธิ์นี้แทน service account key จึงไม่ต้องเก็บ key บน production)
4. **Firebase Authentication** > Settings > Authorized domains: เพิ่มโดเมน `*.hosted.app` ของ backend และโดเมนจริง
5. **GitHub Actions** (`.github/workflows/ci.yml`) deploy `firestore.rules` และ `firestore.indexes.json` เมื่อ push เข้า `main`
   - Secret `FIREBASE_SERVICE_ACCOUNT` = JSON ของ service account ที่มีสิทธิ์ Firebase Rules Admin, Cloud Datastore Index Admin และ Service Usage Consumer
   - Variable `FIREBASE_PROJECT_ID`
   - ห้ามแก้ rules หรือ indexes ใน console ให้แก้ในไฟล์แล้ว push
6. **Google Search Console**: ยืนยันโดเมนแล้วส่ง `https://<โดเมน>/sitemap.xml`

รอบที่ลืมกดจบ: หน้าเว็บไม่แสดงหลังไม่มีพิกัดเกิน 30 นาที และระบบปิดให้ในฐานข้อมูลเมื่อมีวัดใดก็ตามเริ่มรอบใหม่ จึงไม่ต้องตั้ง scheduler

## โครงสร้าง

```
src/modules/core/   ใช้ร่วมกันทุกโมดูล: firebase, auth, temples, แผนที่, UI กลาง
src/modules/alms/   ติดตามบิณฑบาต (collection alms_*)
src/app/            หน้าเว็บและ API ประกอบจากโมดูล
scripts/            seed, ตั้ง super admin, self-check
firestore.rules     client อ่านอย่างเดียว ทุกการเขียนผ่าน Route Handler (firebase-admin)
```

โมดูลห้าม import ข้ามกันเอง ให้ import จาก `core` เท่านั้น

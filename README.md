# 🩸 Blood.loganathanm.in (Life Connect) 💊

Life Connect is a community-driven web application connecting blood donors with those in need, facilitating unused medicine sharing, and providing a real-time directory for emergency hospitals, blood banks, and upcoming donation camps across India.

---

## 🚀 Key Features

### 1) 🆘 Floating SOS Button (All Pages)
- Fixed circular pulsing red button at the bottom-right of every page (above the mobile bottom bar).
- Automatically hidden on `/emergency` and modal states.
- Opens an accessible bottom sheet (mobile) / popover (desktop) with 4 quick emergency actions:
  1. **Post emergency request:** Instant redirect to emergency request form.
  2. **Call 108 (Ambulance):** Direct one-tap tel link for free 24x7 ambulance services.
  3. **Call 112 (Emergency):** National emergency response service.
  4. **Find nearest hospital:** GPS geolocation distance-sorted lookup with manual fallback.
- Clear safety notice: *"For life-threatening emergencies call 112/108 first."*
- Full keyboard (Esc) and focus trap accessibility.

### 2) 💳 Digital Donor Card (`/donor-card`)
- Premium glossy donor credential with brand logo, name, blood group drop badge, donor ID (`BD-XXXXXX`), next eligible donation date, and availability indicator.
- Encodes an unguessable public verification URL (`/verify/:token`).
- **Privacy-safe public verify page:** Only displays first name, blood group, verified badge, and total verified donation count. Never exposes phone number, email, DOB, or exact location.
- **Card Actions:**
  - 📥 **Download as PNG:** Crisp 2x HD resolution via `html-to-image`.
  - 🔗 **Share:** Native Web Share API with WhatsApp and clipboard fallbacks.
  - 💡 **Add to Home Screen hint.**
- Interactive preview card for non-donors with "Become a donor" CTA.

### 3) 🏅 Badges, Levels, Leaderboard & Official PDF Certificate
- **Donation Records:** Users log donations in *Settings > My Activity*. Records count toward official badges once verified by coordinators.
- **Badges Shelf & Levels:**
  - Badges: *First Drop (1)*, *Regular Hero (3)*, *Champion (5)*, *Life Saver (10)*, *Community Hero (25)*, *Emergency Responder*, *Camp Supporter*.
  - Tier progression (*Bronze*, *Silver*, *Gold*, *Platinum*, *Diamond*) with live progress bar.
  - Unlock celebration with canvas confetti burst and real-time Socket.io notification.
- **Leaderboard (`/leaderboard`):**
  - Anonymized (first name + initial only).
  - Strictly **opt-in** (default OFF, toggleable in *Settings > Privacy*).
  - Filterable by *This Year* / *All Time*, State, and District.
- **PDF Certificate:**
  - Server-side generation using `pdf-lib` and `qrcode`.
  - Includes donor name, date, units, donation milestone, unique certificate ID, and QR code to public verification (`/verify-certificate/:id`).

### 4) ⛺ Upcoming Camps Near You (`/campaigns`)
- Directory of approved upcoming blood donation camps.
- Filter by State, District, Date range, and *"This week"*. Auto-hides past camps.
- Camp Card features: Poster, organizer, date/time, venue, distance badge, "Add to calendar" (`.ics` download), "I'm interested" toggle counter, WhatsApp share, and report button.
- Live real-time updates via Socket.io when new camps are approved.

### 5) 🏥 Live Nearby Hospitals & Blood Banks
- Geospatial `$geoNear` aggregation queries closest hospitals with live distance in km.
- Badges: Type badge, 24x7 flag, "Verified" (Govt/Admin) and "Community data" (OSM).
- One-tap phone call, Google Maps directions, "Call to confirm availability" notice, and "Report wrong info" button.

### 6) 🔔 Blood Emergency Alerts (Web Push & In-App)
- Multi-group blood alert subscription with State, District, and Urgency filters (*Critical only*, *Urgent & Critical*, *All*).
- **VAPID Web Push:**
  - Browser Service Worker push notification handler.
  - Automatic blood compatibility matching (only alerts subscribers who can donate to the requested group).
  - Respects subscriber Quiet Hours and 90-day donation eligibility.
  - Built-in "Send test notification" button.
  - Auto-prunes expired subscriptions (404/410).

### 7) 📱 PWA Install & WhatsApp Referral Invites
- **PWA Ready:**
  - Complete `manifest.json` with 192/512px maskable icons, standalone display mode, and shortcut actions.
  - Service Worker (`sw.js`) with asset caching and `offline.html` emergency fallback (includes direct 108/112 dialers).
  - Dismissible install banner (triggers on 2nd visit, remembers 14-day dismissal).
  - Guided step-by-step sheet for iOS Safari (*Share > Add to Home Screen*).
  - Accessible install button in footer and Settings.
- **Referral Tracking:**
  - Unique referral code per user (`LC-XXXXXX`).
  - Pre-filled WhatsApp invite with site link and referral code.
  - Shows *"You invited N friends"* in Settings.

---

## 🛠️ Environment Configuration

### Backend (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
CLIENT_URL=http://localhost:5173

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Web Push VAPID Keys
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT="mailto:admin@Blood.loganathanm.in"
```

To generate fresh VAPID keys:
```bash
npx web-push generate-vapid-keys
```

---

## 🧪 Testing

### Backend Unit & Integration Tests
```bash
cd server
npm test
```
Tests cover:
- 90-day donor eligibility & next eligible date computation
- Blood compatibility donation rules
- Badge level tier progression
- Quiet hours detection and rate limits
- Privacy sanitization for leaderboard and public verification endpoints

### Frontend Build Validation
```bash
cd client
npm run build
```

---

## 🌐 Running Locally

1. **Start Backend Server:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Start Frontend Dev Server:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

Access the app at `http://localhost:5173`.

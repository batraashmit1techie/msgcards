# Our Daily Cards 🌸 • Simple Real-Time Cards for Two

A simple, beautiful, mobile-friendly web app designed for you and your friend. When hosted on **Vercel**, whenever either of you updates a card on your phone, it immediately reflects on the other person's phone in real time!

---

## ⚡ How It Works (Zero-Config Simplicity)

1. **Host on Vercel**: Deploy the repo to Vercel in 1 click (or run `npx vercel`).
2. **Open on Your Phone**: Tap **"Me"**.
3. **Send Link to Her**: Tap **"Share Link"** and send the URL to her phone.
4. **She Opens It**: She taps **"Her"**.
5. **Instant Sync**: 
   - When you write an update or snap a photo, it appears on her phone immediately.
   - When she updates something, it pops up on your phone with a notification toast!
   - You can heart (❤️) each other's cards in real time.

---

## 📸 Features

- 📝 **Simple Day-to-Day Cards**: Type what's happening, attach an optional camera photo, pick an optional mood tag (`☕ Cozy`, `✨ Happy`, `🥱 Sleepy`, etc.), and tap **Post Update**.
- 🔄 **Instant Phone-to-Phone Sync**: Powered by a lightweight real-time cloud stream. Zero database accounts, zero API keys, and zero server maintenance required.
- ❤️ **Real-Time Hearts**: Tap love to react to cards.
- 📱 **Mobile-First & PWA**: Looks and feels like a native phone app. Both of you can tap **"Add to Home Screen"** on Safari or Chrome to install it as an app icon!
- ☁️ **Optional Firebase Support**: Also supports private Firebase Realtime Database if environment variables are provided.

---

## 🚀 Quick Run (Local Testing)

```bash
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in two browser tabs side-by-side:
- Set Tab 1 to **Me**
- Set Tab 2 to **Her**
- Post a card in Tab 1, and watch it instantly appear in Tab 2!

---

## 🌐 Deploy to Vercel (Free & Fast)

### Option 1: Via Vercel CLI
```bash
npx vercel
```
Accept default settings.

### Option 2: Via GitHub
1. Push to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) ➔ **Add New Project**.
3. Select your repo and click **Deploy**.

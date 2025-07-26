# 💬 TelexChat

**TelexChat** is a real-time chat application built with **Angular** and **Firebase**. It features authentication, email verification, real-time messaging, online/offline presence, chat search, and a polished modern UI. Perfect as a Firebase-based starter chat app.

---

## ✨ Features

- 🔐 Firebase Email/Password Authentication with Email Verification
- 💬 Real-time Chat with Firestore
- 🟢 Online/Offline Presence (Firebase Realtime Database)
- 🔍 Chat and User Search
- 🖼️ Profile Picture on Signup
- 📩 Forgot Password (Password Reset)
- 🕓 Human-friendly Timestamps (`Just now`, `Yesterday`, etc.)
- 📱 Mobile-responsive UI (works on different screen sizes)

---

## 🛠️ Tech Stack

- **Frontend**: Angular 17+, Angular Signals
- **Backend**: Firebase (Auth, Firestore, Realtime Database)
- **UI**: Bootstrap 5 (for some components), CSS3 Animations
- **Utilities**: Firebase SDK, Angular Material Snackbar

---

## 🔧 Configuration

Firebase configuration is handled in the file:

```
src/app/app.config.ts
```

Replace the values with your Firebase project credentials:

```ts
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

---

## 🚀 Getting Started

1. **Clone the Repository**

```bash
git clone https://github.com/your-username/telexchat.git
cd telexchat
```

2. **Install Dependencies**

```bash
npm install
```

3. **Run the App**

```bash
ng serve
```

Navigate to `http://localhost:4200/` in your browser.

---

## 📁 Folder Structure

```
src/
├── app/
│   ├── components/
│   ├── services/
│   ├── pipes/
│   ├── pages/
│   │   ├── login/
│   │   ├── register/
│   │   ├── chat/
│   │   ├── forgot-password/
│   ├── app.config.ts   ← Firebase config here
│   └── app.routes.ts
└── assets/
```

---

## 📦 Build

To build the project for production:

```bash
ng build --configuration production
```

Deploy the `dist/` folder to your hosting platform (e.g., Firebase Hosting, Vercel).

---

## 🛒 Selling This Project?

You can:

- Sell this template on marketplaces (like Gumroad, CodeCanyon)
- Offer setup/customization as a **Fiverr** gig
- Use it as a base for more advanced messaging products

---

## 🙋‍♂️ Support or Questions

Open an issue or contact me if you need help or want to collaborate.

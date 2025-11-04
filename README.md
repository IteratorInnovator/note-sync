# NoteSync Project Setup Guide

This guide shows how to install dependencies and run a **Vite** frontend with **Firebase Cloud Functions** locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (LTS version) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Firebase CLI**

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Login to Firebase

```bash
firebase login
```

## 📁 Project Structure

```
project-root/
├─ index.html
├─ package.json
├─ vite.config.js
├─ src/
│  ├─ main.js
│  └─ ...
├─ firebase.json
├─ .firebaserc
└─ functions/
   ├─ package.json
   ├─ index.js
   └─ ...
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <project-directory>
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install Cloud Functions dependencies

```bash
cd functions
npm install
cd ..
```

### 4. Set up environment variables

Create a `.env.local` file in the project root:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT=5001
```

> **Note:** All Vite environment variables must be prefixed with `VITE_`

## 🏃 Running the Project

### Option 1: Run services separately

Open two terminal windows:

**Terminal 1 - Vite Dev Server:**
```bash
npm run dev
```
Access at: `http://localhost:5173/`

**Terminal 2 - Firebase Functions Emulator:**
```bash
firebase emulators:start --only functions
```
Functions available at: `http://localhost:5001/<project-id>/<region>/<function-name>`


## 🔧 Configuration

### Connecting Frontend to Functions Emulator

In your Firebase initialization file:

```javascript
import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

const functions = getFunctions(app);

// Connect to emulator in development
if (import.meta.env.DEV) {
  connectFunctionsEmulator(
    functions,
    "localhost",
    Number(import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001)
  );
}
```

## 📜 Available Scripts

### Root Directory

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- 

## 🚢 Deployment

### Build the frontend

```bash
npm run build
```

### Deploy Cloud Functions

```bash
firebase deploy --only functions
```

Or deploy everything:
```bash
firebase deploy
```

## 📚 Tech Stack

- [Vite](https://vitejs.dev/) - Frontend build tool
- [Firebase](https://firebase.google.com/) - Backend platform
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions) - Serverless functions


## 👥 Authors

[Your Name/Team]
Harry Ng Kok Jing 
Jael Gek
Xiang Ying
Christy Gan




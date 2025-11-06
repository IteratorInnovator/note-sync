# NoteSync Project Setup Guide

This guide shows how to install dependencies and run a **Vite** frontend with **Firebase Cloud Functions** locally.


## Deployed Apps

- [https://wad2-44a13.firebaseapp.com/](https://wad2-44a13.firebaseapp.com/)
- [https://wad2-44a13.web.app/](https://wad2-44a13.web.app/)

### Video Demo

- YouTube demo: [https://youtu.be/Bmmdfy6yyX0](https://youtu.be/Bmmdfy6yyX0)


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

### Local videos setup

If you do not have the videos for the homepage, you need to download them locally.

1. Download the videos from the shared Google Drive folder (https://drive.google.com/drive/folders/1hXAYEnPDvfaJJllPa_aHqQ0hLI1GmdL_?usp=sharing)
2. Create the folder if it does not exist:
   - `mkdir src/assets/videos`
3. Place the downloaded files in `src/assets/videos/` 


## 📁 Project Structure

```
project-root/
├─ .firebase/
├─ functions/
│  ├─ package.json
│  ├─ index.js
│  └─ ...
├─ node_modules/
├─ src/
│  ├─ index.js
│  └─ ...
├─ .env.development
├─ .env.production
├─ .firebaserc
├─ .gitignore
├─ eslint.config.js
├─ firebase.json
├─ index.html
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ README.md
└─ vite.config.js
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

Create a `.env.development` and `.env.production` file in the project root:

**`.env.development`:**
```bash
VITE_APP_BASE_URL=http://localhost:5173
VITE_APP_YOUTUBE_API_KEY=your_youtube_api_key_here
VITE_APP_YOUTUBE_API_ENDPOINT=https://www.googleapis.com/youtube/v3
VITE_APP_FIREBASE_DATABASE_ID=your_firebase_database_id
VITE_APP_FIREBASE_CLOUD_FUNCTIONS_REGION=your_firebase_cloud_function_region
```

**`.env.production`:**
```bash
VITE_APP_BASE_URL=https://your-production-domain.com
VITE_APP_YOUTUBE_API_KEY=your_youtube_api_key_here
VITE_APP_YOUTUBE_API_ENDPOINT=https://www.googleapis.com/youtube/v3
VITE_APP_FIREBASE_DATABASE_ID=your_firebase_database_id
VITE_APP_FIREBASE_CLOUD_FUNCTIONS_REGION=your_firebase_cloud_function_region
```

> **Note:** All Vite environment variables must be prefixed with `VITE_`


## 🔧 Configuration

### Connecting to Firebase

In your src/index.js:

```javascript
const app = initializeApp({
  apiKey: your_firebase_app_api_key,
  authDomain: your_firebase_app__auth_domain,
  projectId: your_firebase_app_project_id,
  storageBucket: your_firebase_app_storage_bucket,
  messagingSenderId: your_firebase_app_messaging_sender_id,
  appId: your_firebase_app_id,
});
```

Ensure this line is in src/index.js in order to run firebase cloud functions locally:

```javascript
const FIREBASE_CLOUD_FUNCTIONS_REGION = import.meta.env.VITE_APP_FIREBASE_CLOUD_FUNCTIONS_REGION;

export const functions = getFunctions(app, FIREBASE_CLOUD_FUNCTIONS_REGION);

if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, "localhost", 5001);
}
```


## 🏃 Running the Project

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


## 📜 Available Scripts

### Root Directory

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build


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

- [React 19](https://react.dev/) - Frontend Javascript Library
- [Tailwind CSS 4.0](https://tailwindcss.com/) - CSS Framework
- [Vite](https://vitejs.dev/) - Frontend build tool
- [Firebase](https://firebase.google.com/) - Backend as a Service platform
- [Firebase Authentication](https://firebase.google.com/docs/auth) - User authentication and authorization
- [Firebase Firestore](https://firebase.google.com/docs/firestore) - NoSQL cloud database
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions) - Serverless functions


## 👥 Authors

- **Harry Ng Kok Jing** — Maintainer  
  GitHub: https://github.com/IteratorInnovator · LinkedIn: https://www.linkedin.com/in/ng-kok-jing

- **Jael Tay Gek Teng** — Developer  
  GitHub: https://github.com/jaeltay

- **Sim Xiang Ying** — Developer  
  GitHub: https://github.com/xiangyingg

- **Christy Gan Tze Qi** — Developer  
  GitHub: https://github.com/christygann




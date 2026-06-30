# AppOrbit Deployment Guide (Hinglish)

Aapki site **https://apporbit.in** par AI chatbot isliye nahi chal raha hai kyunki aapka Node.js backend server (jo `backend/` folder me hai) deploy nahi hai, aur frontend abhi bhi purani URL (`https://apporbit.stufflas.com`) ko request bhej raha hai.

Isko fix karne ke liye niche diye gaye steps follow karein:

---

## Step 1: Deploy Node.js Backend Server
Aapko backend code (`backend/` directory) ko kisi host par run karna hoga. Sabse aasan tareeqa hai **Render** use karna (jo free hai):

1. **Render.com** par account banayein aur **New + > Web Service** par click karein.
2. Apne GitHub repository ko connect karein.
3. Settings me ye details set karein:
   - **Root Directory**: `backend` (Srf backend folder run hoga)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. **Environment Variables** section me add karein:
   - `GEMINI_API_KEY` = `YOUR_GEMINI_API_KEY`
   - `DATABASE_URL` = `YOUR_DATABASE_URL`
   - `PORT` = `5000`
5. Deploy hone ke baad, Render aapko ek URL dega (jaise: `https://apporbit-backend.onrender.com`).

---

## Step 2: Configure Frontend with Backend URL
Ab frontend ko batana hoga ki naya backend URL kaha hai:

1. Apne local system par `.env.production` file open karein.
2. Usme `VITE_BACKEND_URL` ko update karein:
   ```env
   VITE_BACKEND_URL=https://your-backend-backend.onrender.com
   ```
   *(Note: `https://your-backend-backend.onrender.com` ki jagah Step 1 me mila naya Render URL paste karein).*

---

## Step 3: Build & Deploy Frontend Again
Ab build generate karke upload karein:

1. Apne terminal me build generate karein:
   ```bash
   npm run build
   ```
2. Cloudflare Pages par deploy karne ke liye compile code publish karein:
   ```bash
   npm run deploy
   ```

Aapki website refresh ho jayegi aur AI Chatbot work karne lagega!

---

## Step 4: GitHub Actions Setup (Free APK/AAB Compiler)
Agar aap free hosting (jaise GoViralHost Node.js ya Render) use kar rahe hain aur paid VPS ke bina real APK build karna chahte hain, to niche diye gaye steps follow karein:

1. **GitHub Repository Setup:**
   * Apne project ko GitHub par push karein (Private repository bhi chalegi).
   * Apne GitHub profile me **Personal Access Token (PAT)** generate karein (Settings > Developer Settings > Personal Access Tokens > Tokens (classic) > Generate new token). Isko `repo` permission dein.

2. **GoViralHost Backend `.env` configure karein:**
   Apne server par chal rahe `.env` file me ye values add karein:
   ```env
   GITHUB_PAT=ghp_your_github_personal_access_token
   GITHUB_OWNER=your-github-username
   GITHUB_REPO=your-repository-name
   BACKEND_URL=https://your-goviralhost-domain.com
   BUILD_CALLBACK_SECRET=any_random_secure_password_123
   ```

3. **GitHub Secrets configure karein:**
   * GitHub me apne repository settings me jayein: `Settings > Secrets and variables > Actions > New repository secret`.
   * Secret ka naam rakhein: `BUILD_CALLBACK_SECRET`
   * Secret ki value me wahi password daalein jo aapne step 2 me `.env` file me daala tha.

Ab jab bhi website se user build request bhejega, backend automatically GitHub actions runner par build trigger kar dega aur compile hone ke baad APK aapke GoViralHost server par safe save ho jayega.


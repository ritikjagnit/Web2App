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

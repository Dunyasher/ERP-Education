# 🔐 Social Authentication - Installation & Setup Guide

## ✅ Backend Implementation Complete!

All backend code has been created. Now you need to:

---

## 📦 Step 1: Install Required Packages

Run this in the `backend` directory:

```bash
cd backend
npm install passport passport-google-oauth20 passport-facebook express-session
```

---

## 🔧 Step 2: Add Environment Variables

Add these to your `backend/.env` file:

```env
# Social Authentication - Google
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Social Authentication - Facebook
FACEBOOK_APP_ID=your-facebook-app-id-here
FACEBOOK_APP_SECRET=your-facebook-app-secret-here

# Session Secret (for OAuth)
SESSION_SECRET=your-random-session-secret-here

# API URL (for OAuth callbacks)
API_URL=http://localhost:5000
# In production, use: https://your-backend-domain.com
```

---

## 🌐 Step 3: Google OAuth Setup

### 3.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** (or Google Identity API)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:5000/api/auth/social/google/callback
   ```
   (For production, add your production URL)
7. Copy **Client ID** and **Client Secret** to `.env`

### 3.2 Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Fill in app information:
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
3. Add scopes: `email`, `profile`
4. Add test users (for development)
5. Submit for verification (for production)

---

## 📘 Step 4: Facebook OAuth Setup

### 4.1 Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose **Consumer** app type
4. Fill in app details:
   - App name: Your app name
   - App contact email: Your email

### 4.2 Configure Facebook Login

1. Go to **Settings** → **Basic**
   - Add **App Domains**: `localhost` (for dev), `your-domain.com` (for prod)
   - Add **Website** → **Site URL**: `http://localhost:5173` (or your frontend URL)

2. Go to **Products** → **Facebook Login** → **Settings**
   - Add **Valid OAuth Redirect URIs**:
     ```
     http://localhost:5000/api/auth/social/facebook/callback
     ```
     (For production, add your production URL)

3. Copy **App ID** and **App Secret** to `.env`

---

## ✅ Step 5: Files Created

### Backend Files:
- ✅ `backend/services/socialAuthService.js` - Social auth logic
- ✅ `backend/routes/socialAuthRoutes.js` - OAuth routes
- ✅ `backend/config/passport.js` - Passport strategies
- ✅ Updated `backend/index.js` - Added passport & routes

### Frontend Files:
- ✅ `client/src/components/custom/SocialLoginButtons.jsx` - Social buttons
- ✅ `client/src/pages/AuthSuccess.jsx` - OAuth callback handler
- ✅ Updated `client/src/components/custom/AuthDrawer.jsx` - Added social buttons
- ✅ Updated `client/src/App.jsx` - Added auth success route

---

## 🚀 Step 6: Test Social Authentication

### 6.1 Start Backend
```bash
cd backend
npm start
```

### 6.2 Start Frontend
```bash
cd client
npm run dev
```

### 6.3 Test Flow
1. Open your app: `http://localhost:5173`
2. Click login/signup
3. Click "Continue with Google" or "Continue with Facebook"
4. Complete OAuth flow
5. You should be redirected back and logged in

---

## 🔍 Troubleshooting

### "Redirect URI mismatch"
- ✅ Check callback URLs in Google/Facebook console
- ✅ Ensure they match exactly (including http/https, port, path)
- ✅ Format: `http://localhost:5000/api/auth/social/google/callback`

### "Invalid credentials"
- ✅ Verify CLIENT_ID and CLIENT_SECRET in `.env`
- ✅ Restart backend server after changing `.env`
- ✅ Check for typos in environment variables

### "Module not found: passport"
- ✅ Run `npm install` in backend directory
- ✅ Verify packages in `package.json`

### "Session expired"
- ✅ Check SESSION_SECRET is set in `.env`
- ✅ Increase session maxAge if needed (in `index.js`)

### Popup blocked
- ✅ Browser may block popups - allow popups for your domain
- ✅ Alternative: Use full-page redirect instead of popup

---

## 📝 Environment Variables Checklist

Make sure these are in `backend/.env`:

- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `FACEBOOK_APP_ID`
- [ ] `FACEBOOK_APP_SECRET`
- [ ] `SESSION_SECRET`
- [ ] `CLIENT_URL` (should already exist)
- [ ] `API_URL` (optional, defaults to localhost:5000)

---

## 🎯 Next Steps

After setup:
1. ✅ Install packages: `npm install` in backend
2. ✅ Add environment variables to `.env`
3. ✅ Configure Google OAuth
4. ✅ Configure Facebook OAuth
5. ✅ Test the flow
6. ✅ Deploy with production URLs

---

## 📚 Resources

- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Docs](https://developers.facebook.com/docs/facebook-login)
- [Passport.js Docs](http://www.passportjs.org/)

---

## ✨ Features Implemented

- ✅ Google OAuth 2.0
- ✅ Facebook OAuth 2.0
- ✅ Account linking (if email exists)
- ✅ Auto email verification for social accounts
- ✅ Secure token storage (httpOnly cookies)
- ✅ Refresh token support
- ✅ Popup-based OAuth flow
- ✅ Error handling
- ✅ Beautiful UI buttons

**Ready to use once you configure OAuth credentials!** 🚀


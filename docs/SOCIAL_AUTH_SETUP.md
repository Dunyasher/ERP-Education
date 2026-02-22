# 🔐 Social Authentication Setup Guide

## Overview
This guide will help you set up Google and Facebook OAuth authentication for your application.

---

## 📦 Step 1: Install Required Packages

Run this command in the `backend` directory:

```bash
cd backend
npm install passport passport-google-oauth20 passport-facebook express-session
```

---

## 🔧 Step 2: Backend Environment Variables

Add these to your `backend/.env` file:

```env
# Social Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Session Secret (for OAuth)
SESSION_SECRET=your-random-session-secret

# API URL (for OAuth callbacks)
API_URL=http://localhost:5000
# or in production:
# API_URL=https://your-backend-domain.com
```

---

## 🌐 Step 3: Google OAuth Setup

### 3.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add **Authorized redirect URIs**:
   - Development: `http://localhost:5000/api/auth/social/google/callback`
   - Production: `https://your-backend-domain.com/api/auth/social/google/callback`
7. Copy **Client ID** and **Client Secret** to `.env`

### 3.2 Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Fill in app information
3. Add your email as a test user (for development)
4. Submit for verification (for production)

---

## 📘 Step 4: Facebook OAuth Setup

### 4.1 Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose **Consumer** app type
4. Fill in app details

### 4.2 Configure Facebook Login

1. Go to **Settings** → **Basic**
2. Add **App Domains**: `your-domain.com`
3. Add **Website** → **Site URL**: `https://your-frontend-domain.com`
4. Go to **Products** → **Facebook Login** → **Settings**
5. Add **Valid OAuth Redirect URIs**:
   - Development: `http://localhost:5000/api/auth/social/facebook/callback`
   - Production: `https://your-backend-domain.com/api/auth/social/facebook/callback`
6. Copy **App ID** and **App Secret** to `.env`

---

## ✅ Step 5: Verify Setup

### Backend Routes Created:
- `GET /api/auth/social/google` - Initiate Google login
- `GET /api/auth/social/google/callback` - Google callback
- `GET /api/auth/social/facebook` - Initiate Facebook login
- `GET /api/auth/social/facebook/callback` - Facebook callback

### Frontend Integration:
The frontend will use these URLs to initiate social login:
- Google: `http://localhost:5000/api/auth/social/google`
- Facebook: `http://localhost:5000/api/auth/social/facebook`

---

## 🚀 Step 6: Test Social Authentication

1. Start backend server: `npm start`
2. Visit: `http://localhost:5000/api/auth/social/google`
3. You should be redirected to Google login
4. After login, you'll be redirected back with tokens

---

## 🔒 Security Notes

- ✅ Tokens stored in httpOnly cookies
- ✅ Refresh tokens stored in Redis
- ✅ Session-based OAuth flow
- ✅ Account linking (if email exists)
- ✅ Auto email verification for social accounts

---

## 📝 Next Steps

After backend setup:
1. Create frontend social login buttons
2. Handle OAuth callback redirects
3. Update AuthDrawer component
4. Test complete flow

---

## 🐛 Troubleshooting

### "Redirect URI mismatch"
- Check callback URLs in Google/Facebook console
- Ensure they match exactly (including http/https, port, path)

### "Invalid credentials"
- Verify CLIENT_ID and CLIENT_SECRET in `.env`
- Restart backend server after changing `.env`

### "Session expired"
- Increase session maxAge if needed
- Check SESSION_SECRET is set

---

## 📚 Resources

- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Docs](https://developers.facebook.com/docs/facebook-login)
- [Passport.js Docs](http://www.passportjs.org/)


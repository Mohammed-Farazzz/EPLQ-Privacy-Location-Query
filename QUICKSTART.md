# 🚀 EPLQ Quick Start Guide

## ⚡ Get Started in 5 Minutes!

### Step 1: Update Firebase Configuration (REQUIRED)

1. Open `public/js/config.js`
2. Replace the placeholder config with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "eplq-project-c1ac8.firebaseapp.com",
  projectId: "eplq-project-c1ac8",
  storageBucket: "eplq-project-c1ac8.firebasestorage.app",
  messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

**Where to find your config:**
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your project: `eplq-project-c1ac8`
- Click Settings ⚙️ > Project settings
- Scroll to "Your apps" section
- Copy the `firebaseConfig` object

### Step 2: Test Locally

```bash
# Navigate to project directory
cd d:\Projects\EPLQ

# Start Firebase local server
firebase serve
```

Open browser: `http://localhost:5000`

### Step 3: Test the Application

#### Test Admin Portal

1. Go to: `http://localhost:5000/admin/register.html`
2. Register with:
   - Email: `admin@test.com`
   - Password: `Admin@123`
   - Admin Code: `ADMIN2024`
3. Login and upload a POI:
   - Name: `Test Location`
   - Latitude: `40.785091`
   - Longitude: `-73.968285`
   - Description: `Test POI`

#### Test User Portal

1. Go to: `http://localhost:5000/user/register.html`
2. Register with:
   - Email: `user@test.com`
   - Password: `User@123`
3. Login and search:
   - Latitude: `40.785091`
   - Longitude: `-73.968285`
   - Radius: `5` km
4. Click "Decrypt & Search"

### Step 4: Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Or deploy only hosting
firebase deploy --only hosting
```

Your app will be live at: `https://eplq-project-c1ac8.web.app`

### Step 5: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: EPLQ Privacy-Preserving Location Query System"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/EPLQ-Privacy-Location-Query.git
git branch -M main
git push -u origin main
```

**Make sure repository is PUBLIC!**

### Step 6: Update README with Live URL

Edit `README.md` and update line 3:

```markdown
🔗 **Live Demo**: https://eplq-project-c1ac8.web.app
```

Commit and push:
```bash
git add README.md
git commit -m "Add live demo URL"
git push
```

## ✅ Verification Checklist

Before submission, verify:

- [ ] Firebase config updated in `config.js`
- [ ] Local testing successful
- [ ] Admin can upload POIs
- [ ] User can search and decrypt POIs
- [ ] Deployed to Firebase Hosting
- [ ] Live URL is working
- [ ] GitHub repository created
- [ ] Repository is PUBLIC
- [ ] README has live URL
- [ ] All files pushed to GitHub

## 🎯 Admin Code

**Admin Registration Code**: `ADMIN2024`

(This is hardcoded in `public/admin/register.html`)

## 📊 Sample Data

Use `sample_pois.csv` for bulk upload testing:
- Contains 10 POIs in New York City
- Ready to upload via admin dashboard
- CSV format: Name, Latitude, Longitude, Description

## 🆘 Troubleshooting

### Firebase Config Error
**Problem**: "Firebase not initialized"
**Solution**: Update `public/js/config.js` with your actual Firebase config

### Authentication Error
**Problem**: "Auth domain not authorized"
**Solution**: 
1. Go to Firebase Console > Authentication > Settings
2. Add `localhost` to authorized domains

### Deployment Error
**Problem**: "Permission denied"
**Solution**: 
```bash
firebase login
firebase use eplq-project-c1ac8
firebase deploy
```

### GitHub Push Error
**Problem**: "Authentication failed"
**Solution**: Use personal access token instead of password

## 📚 Full Documentation

For detailed instructions, see:
- [README.md](../README.md) - Complete project documentation
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Step-by-step Firebase setup
- [walkthrough.md](walkthrough.md) - Implementation details

## 🎉 You're Ready!

Your EPLQ project is complete and ready for submission. Good luck! 🚀

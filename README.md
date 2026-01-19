# Discord OAuth Login Setup Guide

## 🔐 Overview
Your website now supports Discord OAuth login! Users can login with their Discord account, and you can control who has admin access to manage products.

---

## 📋 Step-by-Step Setup

### Step 1: Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** (top right)
3. Give it a name (e.g., "My Product Store")
4. Click **"Create"**

### Step 2: Get Your Client ID

1. In your application, go to **"OAuth2"** in the left sidebar
2. Under **"Client information"**, you'll see your **Client ID**
3. **Copy this Client ID** - you'll need it for your website settings

### Step 3: Set Up Redirect URI

#### For Local Testing (Development):
1. Still in **OAuth2** section
2. Click **"Add Redirect"** under "Redirects"
3. Add: `http://localhost:8000` (or whatever port you're using)
4. Click **"Save Changes"**

#### For Live Website (Production):
1. Add your actual domain: `https://yourdomain.com`
2. Make sure it matches EXACTLY (no trailing slash unless your site uses one)
3. Click **"Save Changes"**

**Important**: The redirect URI must match exactly what you put in your website settings!

### Step 4: Get Your Discord User ID

You need your Discord User ID to set yourself as an admin.

1. Open Discord (desktop or web)
2. Go to **User Settings** (⚙️ icon bottom left)
3. Go to **Advanced** → Enable **Developer Mode**
4. Close settings
5. Right-click your username anywhere
6. Click **"Copy User ID"**
7. Save this number - this is your Discord User ID

### Step 5: Configure Your Website

1. Open your website
2. Click **"⚙️ Settings"**
3. Find the **"Discord OAuth Login"** section
4. Fill in:
   - **Client ID**: Paste the Client ID from Step 2
   - **Redirect URI**: Enter the EXACT URL (e.g., `http://localhost:8000` or `https://yourdomain.com`)
   - **Admin User IDs**: Paste your Discord User ID from Step 4
5. Check **"Enable Discord Login"**
6. Click **"Save Settings"**

### Step 6: Test the Login

1. Click **"Login with Discord"** button
2. You'll be redirected to Discord
3. Click **"Authorize"**
4. You'll be redirected back to your website
5. You should see your Discord avatar and username
6. The **"Admin Mode"** button should appear

---

## 👥 Adding Multiple Admins

To give multiple people admin access:

1. Get each person's Discord User ID (same method as Step 4)
2. Go to **⚙️ Settings** → **Discord OAuth Login**
3. In **Admin User IDs**, add all IDs separated by commas:
   ```
   123456789012345678, 987654321098765432, 456789012345678901
   ```
4. Save settings

Everyone with their ID in this list will be able to access Admin Mode!

---

## 🌐 Deployment Considerations

### Local Testing (using file://)
Discord OAuth **will not work** with `file://` protocol. You need to use a local server:

**Option 1: Python (if you have Python installed)**
```bash
python -m http.server 8000
```
Then visit: `http://localhost:8000`

**Option 2: VS Code Live Server**
- Install "Live Server" extension
- Right-click index.html → "Open with Live Server"

**Option 3: Node.js http-server**
```bash
npx http-server -p 8000
```

### Live Deployment
When deploying to a real domain:
1. Update the **Redirect URI** in Discord Developer Portal to your domain
2. Update the **Redirect URI** in website settings to match
3. Both must be HTTPS (except localhost)

---

## 🔒 Security Features

### What's Protected:
- ✅ Admin Mode requires Discord login
- ✅ Only users in Admin User IDs list can access Admin Mode
- ✅ Access tokens stored locally (per device)
- ✅ Logout clears session

### What Users Can Do:
- **Regular users** (not in admin list):
  - View products
  - See their Discord profile
  - Cannot access Admin Mode

- **Admin users** (in admin list):
  - View products
  - See their Discord profile
  - Access Admin Mode
  - Add/Edit/Delete products

---

## 🎯 Example Configuration

Here's a complete example setup:

```
Discord OAuth Settings:
├── Client ID: 1234567890123456789
├── Redirect URI: https://mystore.com
└── Admin User IDs: 987654321012345678, 123456789098765432

Discord Developer Portal:
├── Application Name: My Product Store
├── Client ID: 1234567890123456789 (same as above)
└── Redirect URIs:
    ├── https://mystore.com (production)
    └── http://localhost:8000 (development)
```

---

## 🐛 Troubleshooting

### "Discord login is not configured"
- Make sure you've enabled Discord Login in Settings
- Verify Client ID is entered correctly
- Check Redirect URI is set

### Redirected but not logged in
- Check browser console for errors (F12)
- Verify Redirect URI matches EXACTLY in both:
  - Discord Developer Portal
  - Website Settings
- Make sure you clicked "Authorize" on Discord

### "You do not have admin permissions"
- Check your Discord User ID is in the Admin User IDs list
- Make sure there are no extra spaces in the ID
- IDs should be comma-separated if multiple

### Login button not showing
- Clear browser cache
- Check if already logged in (you'll see your avatar)
- Reload the page

### OAuth error on Discord page
- Verify the application exists in Discord Developer Portal
- Check that the Client ID is correct
- Ensure Redirect URI is added in Discord Developer Portal

---

## 📱 How It Works

1. **User clicks "Login with Discord"**
   - Redirected to Discord authorization page
   
2. **User authorizes**
   - Discord redirects back with access token
   
3. **Website fetches user info**
   - Uses token to get username, ID, avatar
   
4. **Check admin status**
   - Compares user ID with admin list
   
5. **Update UI**
   - Shows user avatar and username
   - Shows Admin Mode button if user is admin

---

## 🔄 Session Management

- **Login persists** across browser refreshes
- **Stored locally** in browser localStorage
- **Per-device** - logging in on one device doesn't affect others
- **Logout** clears the session completely

---

## 🎨 Customization

### Change Discord Button Color
Edit in `style.css`:
```css
.login-btn {
    background: #5865F2; /* Discord blue */
}
```

### Change Required Scopes
Currently uses `identify` (basic user info). To request more, edit in `script.js`:
```javascript
const scope = 'identify email'; // Add email scope
```

Note: More scopes require updating OAuth settings in Discord Developer Portal.

---

## 📚 Additional Resources

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [Discord API Reference](https://discord.com/developers/docs/reference)

---

## ✅ Quick Checklist

Before going live:

- [ ] Discord Application created
- [ ] Client ID copied
- [ ] Redirect URI added in Discord Developer Portal
- [ ] Redirect URI matches in website settings
- [ ] Your Discord User ID added to admin list
- [ ] Discord Login enabled in settings
- [ ] Tested login flow
- [ ] Tested admin access
- [ ] Website deployed with HTTPS

---

**You're all set!** 🎉 Your website now has secure Discord authentication!
# 🚀 GitHub Pages Deployment Guide

## Complete Setup for GitHub Pages Hosting

---

## 📋 Prerequisites

- GitHub account (free)
- Git installed on your computer
- Supabase account (free)

---

## 🎯 Step-by-Step Deployment

### Step 1: Download & Extract Files

1. Download `marketplace-app.tar.gz` or the entire `marketplace-app` folder
2. Extract to your computer
3. You should see this structure:

```
marketplace-app/
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── admin.html
├── css/
├── js/
├── config/
├── assets/
└── *.md files
```

---

### Step 2: Setup Supabase (5 minutes)

#### A. Create Supabase Project

1. Go to **https://supabase.com**
2. Sign up / Login
3. Click **"New Project"**
4. Fill in:
   - Name: `marketplace`
   - Database Password: (create strong password)
   - Region: (closest to you)
5. Wait ~2 minutes
6. **Copy these:**
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJhbGc...`

#### B. Create Database Tables

1. In Supabase, go to **SQL Editor**
2. Copy this SQL and run it:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'seller', 'buyer')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'soldout')),
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view approved sellers"
    ON users FOR SELECT
    USING (role = 'seller' AND status = 'approved');

CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admin can view all users"
    ON users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update any user"
    ON users FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Products policies
CREATE POLICY "Anyone can view available products"
    ON products FOR SELECT
    USING (status = 'available');

CREATE POLICY "Sellers can view own products"
    ON products FOR SELECT
    TO authenticated
    USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can create products"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() 
            AND role = 'seller' 
            AND status = 'approved'
        )
        AND auth.uid() = seller_id
    );

CREATE POLICY "Sellers can update own products"
    ON products FOR UPDATE
    TO authenticated
    USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products"
    ON products FOR DELETE
    TO authenticated
    USING (auth.uid() = seller_id);

CREATE POLICY "Admin can view all products"
    ON products FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update any product"
    ON products FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can delete any product"
    ON products FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

3. Click **Run**
4. Verify tables created ✅

#### C. Create Storage Bucket

1. Go to **Storage** → **New Bucket**
2. Name: `products`
3. Make it **Public** ✅
4. Click **Create**

5. In **SQL Editor**, run:

```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
```

#### D. Enable Phone Authentication

1. Go to **Authentication** → **Settings**
2. Enable **"Phone"** provider
3. Choose SMS provider (Twilio recommended)
4. Add credentials

---

### Step 3: Configure Your App

1. Open `config/supabase.js`
2. Replace with your credentials:

```javascript
// Supabase Configuration
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// Discord OAuth Configuration (optional)
const DISCORD_CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';
const DISCORD_REDIRECT_URI = 'https://YOUR_USERNAME.github.io/marketplace-app/login.html';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase;
window.discordConfig = {
    clientId: DISCORD_CLIENT_ID,
    redirectUri: DISCORD_REDIRECT_URI
};
```

**Important:** Update `DISCORD_REDIRECT_URI` with your actual GitHub Pages URL!

---

### Step 4: Create GitHub Repository

#### Option A: Using GitHub Website (Easiest)

1. Go to **https://github.com**
2. Click **"New"** repository (green button)
3. Name: `marketplace-app`
4. Set to **Public**
5. ✅ Initialize with README (check this)
6. Click **"Create repository"**

#### Option B: Using Git Command Line

```bash
# Navigate to your project folder
cd marketplace-app

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Marketplace app"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/marketplace-app.git

# Push
git branch -M main
git push -u origin main
```

---

### Step 5: Upload Files to GitHub

#### Option A: Web Upload (Easiest)

1. In your GitHub repository
2. Click **"Add file"** → **"Upload files"**
3. Drag all files from `marketplace-app` folder
4. **Important:** Maintain folder structure!
5. Commit message: "Add marketplace files"
6. Click **"Commit changes"**

#### Option B: Git Command Line

```bash
# In marketplace-app folder
git add .
git commit -m "Add all marketplace files"
git push origin main
```

---

### Step 6: Enable GitHub Pages

1. In your repository, click **"Settings"**
2. Scroll to **"Pages"** (left sidebar)
3. Under **"Source"**, select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **"Save"**
5. Wait 1-2 minutes
6. Your site will be live at:
   ```
   https://YOUR_USERNAME.github.io/marketplace-app/
   ```

---

### Step 7: Create Admin Account

1. Visit your GitHub Pages URL
2. Click **"Register"**
3. Fill in details (use your real phone number)
4. Submit

5. Go to Supabase **SQL Editor**
6. Run:

```sql
UPDATE users 
SET role = 'admin', status = 'approved' 
WHERE phone = '+YOUR_PHONE_NUMBER';
```

Example:
```sql
UPDATE users 
SET role = 'admin', status = 'approved' 
WHERE phone = '+1234567890';
```

7. Now login as admin! 🎉

---

## 🔧 GitHub Pages Specific Configuration

### Update Discord Redirect URI

If using Discord OAuth:

1. **In your code** (`config/supabase.js`):
   ```javascript
   const DISCORD_REDIRECT_URI = 'https://YOUR_USERNAME.github.io/marketplace-app/login.html';
   ```

2. **In Discord Developer Portal**:
   - Add redirect URI: `https://YOUR_USERNAME.github.io/marketplace-app/login.html`

3. **In Supabase**:
   - Authentication → Settings → Discord → Update redirect URI

### Custom Domain (Optional)

To use your own domain:

1. In repository **Settings** → **Pages**
2. Under **"Custom domain"**, enter your domain
3. Update your domain's DNS:
   - Add CNAME record pointing to `YOUR_USERNAME.github.io`
4. Wait for DNS propagation (can take up to 24 hours)
5. GitHub will automatically provide SSL certificate

---

## ✅ Verification Checklist

After deployment:

- [ ] Site loads at GitHub Pages URL
- [ ] All CSS styles applied correctly
- [ ] Images and icons display
- [ ] Can navigate between pages
- [ ] Registration works
- [ ] Login works
- [ ] Dashboard accessible (after approval)
- [ ] Admin panel works
- [ ] Products can be created
- [ ] Images upload successfully
- [ ] Responsive on mobile

---

## 🐛 Troubleshooting

### Site Not Loading

**Problem:** 404 error
**Solutions:**
- Wait 2-5 minutes after enabling Pages
- Check that `index.html` is in root folder
- Verify repository is public
- Hard refresh browser (Ctrl+F5)

### CSS/JS Not Loading

**Problem:** Styling broken or features don't work
**Solutions:**
- Check file paths are correct
- Verify folder structure maintained
- Check browser console for errors (F12)
- Ensure all files uploaded

### "Supabase Error"

**Problem:** Database connection failed
**Solutions:**
- Verify Supabase URL and key in `config/supabase.js`
- Check Supabase project is active
- Verify RLS policies created
- Check browser console for specific error

### Phone Authentication Not Working

**Problem:** Can't register/login
**Solutions:**
- Verify phone provider configured in Supabase
- Use correct phone format: `+1234567890`
- Check Supabase Auth logs
- Test with different phone number

### Images Not Uploading

**Problem:** Product images fail
**Solutions:**
- Verify storage bucket `products` exists
- Check bucket is set to Public
- Verify storage policies created
- Check file size (< 5MB)

### Admin Can't Login

**Problem:** Admin access denied
**Solutions:**
- Verify SQL command ran successfully
- Check user role in Supabase database
- Ensure status is 'approved'
- Try logout and login again

---

## 📱 Testing Your Site

### Test as Different Users

**1. Test as Seller:**
```bash
# Register
- Role: Seller
- Should see "pending approval" message

# Admin approves in database
UPDATE users SET status = 'approved' WHERE username = 'testeller';

# Login as seller
- Can create products
- Can edit own products
- Can delete own products
```

**2. Test as Admin:**
```bash
# Set user as admin in database
UPDATE users SET role = 'admin', status = 'approved' WHERE username = 'admin';

# Login as admin
- See admin panel
- Can approve sellers
- Can delete any product
```

**3. Test as Buyer:**
```bash
# Register
- Role: Buyer
- Instant approval

# Login
- Browse products
- View details
```

---

## 🔄 Updating Your Site

When you make changes:

### Option A: GitHub Web Interface

1. Navigate to file
2. Click pencil icon (edit)
3. Make changes
4. Commit changes
5. Wait 1 minute for deployment

### Option B: Git Command Line

```bash
# Make your changes to files
# Then:
git add .
git commit -m "Description of changes"
git push origin main

# Wait 1-2 minutes for GitHub Pages to rebuild
```

---

## 📊 GitHub Pages Limits

**Free Tier Includes:**
- ✅ 1GB storage
- ✅ 100GB bandwidth/month
- ✅ 10 builds/hour
- ✅ Free SSL certificate
- ✅ Custom domain support

**Perfect for:**
- Personal projects
- Portfolios
- Small marketplaces
- MVPs
- Demos

---

## 🎯 Your Live URLs

After setup, you'll have:

```
Homepage: https://YOUR_USERNAME.github.io/marketplace-app/
Login:    https://YOUR_USERNAME.github.io/marketplace-app/login.html
Register: https://YOUR_USERNAME.github.io/marketplace-app/register.html
Dashboard: https://YOUR_USERNAME.github.io/marketplace-app/dashboard.html
Admin:    https://YOUR_USERNAME.github.io/marketplace-app/admin.html
```

---

## 🎉 You're Live!

Your marketplace is now:
- ✅ Hosted on GitHub Pages (FREE)
- ✅ Backed by Supabase (FREE)
- ✅ Accessible worldwide
- ✅ HTTPS enabled
- ✅ Production-ready

**Total Monthly Cost: $0** 🎊

---

## 📞 Support

- **GitHub Pages Docs:** https://pages.github.com
- **Supabase Docs:** https://supabase.com/docs
- **Check browser console** for JavaScript errors (F12)
- **Verify all configuration** in `config/supabase.js`

---

## 🚀 Next Steps

1. Share your site URL
2. Invite sellers to register
3. Approve seller applications
4. Monitor product uploads
5. Grow your marketplace!

**Congratulations! Your marketplace is live!** 🎉

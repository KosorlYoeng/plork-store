# 🚀 Quick Start Guide

## 5-Minute Setup

### Step 1: Supabase Setup (2 minutes)

1. Go to **https://supabase.com** → Sign up/Login
2. Click **"New Project"**
3. Fill in:
   - Name: `marketplace`
   - Database Password: (create one)
   - Region: (choose closest)
4. Wait 1 minute for project creation
5. Copy these from Settings → API:
   - `Project URL`
   - `anon/public key`

### Step 2: Create Database (1 minute)

1. In Supabase, go to **SQL Editor**
2. Copy the entire SQL from `README.md` (Database Tables section)
3. Click **Run**
4. ✅ Tables created!

### Step 3: Configure App (30 seconds)

1. Open `config/supabase.js`
2. Replace:
```javascript
const SUPABASE_URL = 'YOUR_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_KEY_HERE';
```

### Step 4: Enable Phone Auth (1 minute)

1. Supabase → Authentication → Settings
2. Enable **"Phone"** provider
3. Choose provider (Twilio recommended)
4. Add credentials

### Step 5: Deploy (30 seconds)

**Easiest - Netlify:**
1. Go to **netlify.com**
2. Drag & drop your `marketplace-app` folder
3. Done! ✅

**Or run locally:**
```bash
python -m http.server 8000
# Visit http://localhost:8000
```

### Step 6: Create Admin User (1 minute)

1. Register on your site with phone number
2. In Supabase SQL Editor, run:
```sql
UPDATE users 
SET role = 'admin', status = 'approved' 
WHERE phone = '+YOUR_PHONE';
```
3. Now you're admin! 👑

## 🎉 You're Ready!

- **Home**: Browse products
- **Register**: Create account
- **Login**: Sign in
- **Dashboard**: Manage products (sellers)
- **Admin Panel**: Approve sellers (admins)

## 📱 Test Flow

1. **As Admin**:
   - Login → Approve sellers
   - Manage all products

2. **As Seller**:
   - Register (role: seller)
   - Wait for approval
   - Login → Create products

3. **As Buyer**:
   - Register (role: buyer)
   - Browse products

## 🔥 Pro Tips

1. **Storage for Images**: Create bucket named `products` in Supabase Storage
2. **Discord Login**: Optional - configure in Supabase Auth settings
3. **Custom Domain**: Point your domain to Netlify
4. **SSL**: Automatic with Netlify/Vercel

## ⚠️ Important

- Phone format: `+1234567890` (international format)
- Sellers need admin approval before posting
- First user should be made admin via SQL

## 🆘 Problems?

**Can't login?**
- Check phone format
- Verify Supabase URL/Key
- Check browser console

**Products not showing?**
- Run SQL setup again
- Check RLS policies
- Verify authentication

**Images not uploading?**
- Create `products` storage bucket
- Make it public
- Check storage policies

---

**Need help? Check the full README.md**

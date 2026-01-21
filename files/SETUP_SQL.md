# Complete SQL Setup for Email + Discord Authentication

Copy and paste this entire SQL into your Supabase SQL Editor and click "Run"

```sql
-- ============================================
-- MARKETPLACE DATABASE SETUP WITH EMAIL AUTH
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table (using email instead of phone)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'seller', 'buyer')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
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

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view approved sellers" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update any user" ON users;

DROP POLICY IF EXISTS "Anyone can view available products" ON products;
DROP POLICY IF EXISTS "Sellers can view own products" ON products;
DROP POLICY IF EXISTS "Sellers can create products" ON products;
DROP POLICY IF EXISTS "Sellers can update own products" ON products;
DROP POLICY IF EXISTS "Sellers can delete own products" ON products;
DROP POLICY IF EXISTS "Admin can view all products" ON products;
DROP POLICY IF EXISTS "Admin can update any product" ON products;
DROP POLICY IF EXISTS "Admin can delete any product" ON products;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can view approved sellers
CREATE POLICY "Users can view approved sellers"
    ON users FOR SELECT
    USING (role = 'seller' AND status = 'approved');

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Admin can view all users
CREATE POLICY "Admin can view all users"
    ON users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin can update any user
CREATE POLICY "Admin can update any user"
    ON users FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- PRODUCTS TABLE POLICIES
-- ============================================

-- Anyone can view available products
CREATE POLICY "Anyone can view available products"
    ON products FOR SELECT
    USING (status = 'available');

-- Sellers can view their own products
CREATE POLICY "Sellers can view own products"
    ON products FOR SELECT
    TO authenticated
    USING (auth.uid() = seller_id);

-- Sellers can create products (only if approved)
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

-- Sellers can update their own products
CREATE POLICY "Sellers can update own products"
    ON products FOR UPDATE
    TO authenticated
    USING (auth.uid() = seller_id);

-- Sellers can delete their own products
CREATE POLICY "Sellers can delete own products"
    ON products FOR DELETE
    TO authenticated
    USING (auth.uid() = seller_id);

-- Admin can view all products
CREATE POLICY "Admin can view all products"
    ON products FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin can update any product
CREATE POLICY "Admin can update any product"
    ON products FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin can delete any product
CREATE POLICY "Admin can delete any product"
    ON products FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================

-- Note: Create the 'products' bucket first in Supabase Storage UI
-- Then run these policies:

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

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

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'products');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'products');

-- ============================================
-- SUCCESS!
-- ============================================

-- If you see the tables listed above, setup is complete!
-- Next steps:
-- 1. Create storage bucket 'products' (if not exists)
-- 2. Enable Email authentication in Supabase Auth settings
-- 3. Optionally enable Discord OAuth in Supabase Auth settings
-- 4. Update your config/supabase.js with your credentials
-- 5. Deploy your app!
```

## After Running This SQL:

### ✅ What You Have:
- Users table with email field
- Products table
- All RLS policies
- Auto-updating timestamps
- Storage policies

### 📝 Next Steps:

1. **Create Storage Bucket:**
   - Go to Storage in Supabase
   - Click "New Bucket"
   - Name: `products`
   - Make it Public ✅

2. **Enable Email Auth:**
   - Already enabled by default in Supabase! ✅

3. **Optional - Enable Discord:**
   - Go to Authentication → Providers
   - Enable Discord
   - Add Client ID and Secret

4. **Create Your First Admin:**
   ```sql
   -- After registering through your website:
   UPDATE users 
   SET role = 'admin', status = 'approved' 
   WHERE email = 'your-email@example.com';
   ```

## Test Your Setup:

```sql
-- Check if everything is ready:
SELECT 'Tables Created' as status, COUNT(*) as count
FROM information_schema.tables 
WHERE table_name IN ('users', 'products');

-- Should return: count = 2
```

✅ **You're ready to deploy!**

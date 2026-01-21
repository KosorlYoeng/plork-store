# Marketplace Platform

A full-featured marketplace platform with user authentication, role-based access control, and product management built with HTML, CSS, JavaScript, and Supabase.

## 🚀 Features

### Authentication
- ✅ Phone & Password login
- ✅ Discord OAuth login
- ✅ User registration with role selection
- ✅ Secure session management

### User Roles
- 👑 **Admin**: Manage sellers and approve products
- 🏪 **Seller**: Create, update, delete own products (requires approval)
- 🛒 **Buyer**: Browse and purchase products

### Product Management
- ✅ Create products with multiple images
- ✅ Update product details
- ✅ Delete products
- ✅ Product fields: name, category, description, quantity, price, status, images
- ✅ Auto timestamps (created_at, updated_at)

### Features
- 📱 Fully responsive design
- 🎨 Modern, clean UI
- ⚡ Real-time updates
- 🔒 Secure authentication
- 📊 Admin dashboard
- 🖼️ Image upload support

## 📁 Project Structure

```
marketplace-app/
├── index.html              # Home page
├── login.html              # Login page
├── register.html           # Registration page
├── dashboard.html          # User dashboard (to be created)
├── admin.html              # Admin panel (to be created)
│
├── css/
│   └── main.css            # All styles
│
├── js/
│   ├── utils/
│   │   ├── auth.js         # Authentication functions
│   │   └── helpers.js      # Utility functions
│   ├── components/
│   │   └── navbar.js       # Navbar component
│   └── pages/
│       ├── home.js         # Home page logic
│       ├── login.js        # Login page logic
│       ├── register.js     # Register page logic
│       ├── dashboard.js    # Dashboard logic (to be created)
│       └── admin.js        # Admin panel logic (to be created)
│
├── config/
│   └── supabase.js         # Supabase configuration
│
├── assets/
│   └── images/             # Static images
│
└── README.md               # This file
```

## 🛠️ Setup Instructions

### 1. Supabase Setup

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project
4. Note down:
   - Project URL
   - Anon/Public Key

#### Create Database Tables

Run these SQL commands in Supabase SQL Editor:

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

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all approved sellers"
    ON users FOR SELECT
    USING (role = 'seller' AND status = 'approved');

CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
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

-- Products policies
CREATE POLICY "Anyone can view available products"
    ON products FOR SELECT
    USING (status = 'available');

CREATE POLICY "Sellers can view their own products"
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

CREATE POLICY "Sellers can update their own products"
    ON products FOR UPDATE
    TO authenticated
    USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own products"
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
```

#### Create Storage Bucket for Images

1. Go to Storage in Supabase Dashboard
2. Create a new bucket named `products`
3. Set it to **Public**
4. Add policy for authenticated uploads:

```sql
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Enable Phone Authentication

1. Go to Authentication → Settings
2. Enable "Phone" provider
3. Configure your SMS provider (Twilio, etc.)

#### Enable Discord OAuth (Optional)

1. Go to Authentication → Settings
2. Enable "Discord" provider
3. Add your Discord Client ID and Secret
4. Add redirect URL: `https://yourdomain.com/login.html`

### 2. Configure Application

1. Open `config/supabase.js`
2. Replace placeholders with your Supabase credentials:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const DISCORD_CLIENT_ID = 'your-discord-client-id'; // Optional
```

### 3. Create First Admin User

Run this SQL to create an admin account:

```sql
-- First, sign up through the app with phone/password
-- Then run this to make that user an admin:

UPDATE users
SET role = 'admin', status = 'approved'
WHERE phone = '+1234567890'; -- Your phone number
```

### 4. Deploy

#### Option 1: Netlify (Recommended - FREE)
1. Drag and drop your project folder to Netlify
2. Site is live!

#### Option 2: Vercel (FREE)
1. Import project to Vercel
2. Deploy

#### Option 3: GitHub Pages (FREE)
1. Push to GitHub
2. Enable GitHub Pages

#### Option 4: Traditional Hosting
1. Upload all files via FTP
2. Ensure folder structure is maintained

## 🎯 Usage Guide

### For Admin

1. **Login** with admin credentials
2. **Approve/Reject** seller applications
3. **Manage** all products
4. **View** all users and statistics

### For Sellers

1. **Register** with role "Seller"
2. **Wait** for admin approval
3. **Login** after approval
4. **Create** products with:
   - Name, category, description
   - Quantity, price
   - Upload images
5. **Manage** your products

### For Buyers

1. **Register** with role "Buyer"
2. **Browse** products
3. **View** product details
4. **Purchase** products (coming soon)

## 🔐 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Secure authentication with Supabase Auth
- ✅ Role-based access control
- ✅ Protected API endpoints
- ✅ Seller approval system
- ✅ Input validation
- ✅ XSS protection

## 📱 Responsive Breakpoints

- **Mobile**: < 480px
- **Tablet**: 481px - 768px
- **Desktop**: > 768px

## 🎨 Customization

### Colors
Edit CSS variables in `css/main.css`:

```css
:root {
    --primary: #6366f1;
    --success: #10b981;
    --danger: #ef4444;
    /* ... more colors */
}
```

### Typography
Change fonts in HTML `<head>`:

```html
<link href="https://fonts.googleapis.com/css2?family=Your+Font&display=swap" rel="stylesheet">
```

## 🐛 Troubleshooting

### Products not loading
- Check Supabase connection
- Verify RLS policies
- Check browser console for errors

### Authentication not working
- Verify Supabase credentials
- Check phone authentication is enabled
- Ensure users table exists

### Images not uploading
- Check storage bucket exists and is public
- Verify storage policies
- Check file size limits

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🆘 Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase setup
3. Check network tab for failed requests

## 🎉 Next Steps

- [ ] Add product search
- [ ] Implement shopping cart
- [ ] Add payment processing
- [ ] Create order management
- [ ] Add reviews and ratings
- [ ] Implement notifications
- [ ] Add analytics dashboard

---

**Built with ❤️ using HTML, CSS, JavaScript, and Supabase**

# Product Website - Discord & Telegram Integration Guide

## 🎯 Overview
Your product website now sends automatic notifications to Discord and/or Telegram whenever you:
- ✅ Add a new product
- ✏️ Edit an existing product
- 🗑️ Delete a product

---

## 📱 Telegram Setup (Step-by-Step)

### Step 1: Create a Telegram Bot
1. Open Telegram and search for **@BotFather**
2. Start a chat and send `/newbot`
3. Follow the instructions:
   - Choose a name for your bot (e.g., "My Product Store")
   - Choose a username (must end in 'bot', e.g., "myproductstore_bot")
4. **Copy the bot token** that looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

### Step 2: Get Your Chat ID

**Option A: For Personal Notifications**
1. Search for **@userinfobot** on Telegram
2. Start a chat with it
3. It will send you your Chat ID (e.g., `987654321`)
4. Copy this number

**Option B: For Channel Notifications**
1. Create a channel (if you don't have one)
2. Add your bot as an administrator to the channel
3. Use the channel username in this format: `@yourchannel`

### Step 3: Configure in Website
1. Click **⚙️ Settings** button on your website
2. Under "Telegram Integration":
   - Paste your **Bot Token**
   - Paste your **Chat ID** or channel username
   - Check **"Enable Telegram notifications"**
3. Click **Save Settings**

### Step 4: Start Your Bot
1. Open a chat with your bot (search for the username you created)
2. Click **START** or send `/start`

**That's it! Now when you add/edit/delete products, you'll get Telegram messages!**

---

## 💬 Discord Setup (Step-by-Step)

### Step 1: Create a Discord Webhook
1. Open your Discord server
2. Go to **Server Settings** (⚙️ icon)
3. Click **Integrations** in the left menu
4. Click **Webhooks**
5. Click **New Webhook**
6. Configure your webhook:
   - Give it a name (e.g., "Product Updates")
   - Choose which channel to post in (e.g., #products)
   - Click **Copy Webhook URL** (it looks like: `https://discord.com/api/webhooks/...`)

### Step 2: Configure in Website
1. Click **⚙️ Settings** button on your website
2. Under "Discord Integration":
   - Paste your **Webhook URL**
   - Check **"Enable Discord notifications"**
3. Click **Save Settings**

**Done! Your Discord channel will now receive rich embed notifications!**

---

## 🎨 What Notifications Look Like

### Discord
- **Rich embed cards** with:
  - Product name, category, and price
  - Product description
  - Product image (thumbnail)
  - Color-coded: Green (added), Orange (updated), Red (deleted)
  - Timestamp

### Telegram
- **Formatted text messages** with:
  - Emoji indicators (✅ added, ✏️ updated, 🗑️ deleted)
  - Product details in bold
  - Separate product image (if available)

---

## 🔧 Testing Your Setup

1. Click **Admin Mode**
2. Add a test product
3. Check your Discord channel / Telegram chat
4. You should receive a notification!

If you don't receive anything:
- **Discord**: Check that the webhook URL is correct and the channel exists
- **Telegram**: Make sure you've sent `/start` to your bot first

---

## 💡 Pro Tips

### For Telegram:
- **Private notifications**: Use your personal Chat ID
- **Team notifications**: Create a group, add your bot, get group Chat ID
- **Public announcements**: Use a channel with @username format

### For Discord:
- Create separate channels for different notification types
- Use multiple webhooks if you want different categories in different channels
- Webhooks work even if you're offline

### Both Platforms:
- You can enable both simultaneously
- Disable notifications anytime from Settings
- All settings are saved in your browser

---

## 🛠️ Troubleshooting

### Telegram Not Working?
- ✅ Check that you started your bot (`/start` command)
- ✅ Verify the bot token is correct (no extra spaces)
- ✅ For channels, make sure your bot is an admin
- ✅ Chat ID should be a number or start with @

### Discord Not Working?
- ✅ Verify the webhook URL is complete and starts with `https://discord.com/api/webhooks/`
- ✅ Check that the channel still exists
- ✅ Make sure you haven't deleted the webhook from Discord

### Still Having Issues?
- Open your browser's Developer Console (F12)
- Check for any error messages
- Make sure "Enable notifications" is checked
- Try saving settings again

---

## 🌐 Using with Your Domain

Once you're ready to deploy:

1. **Upload the HTML file** to your web hosting
2. **Your settings will stay with each device** (browser localStorage)
3. **Each user can have their own notification setup** (not shared between browsers)

### Recommended Free Hosting:
- **Netlify**: netlify.com (drag & drop deployment)
- **Vercel**: vercel.com (GitHub integration)
- **GitHub Pages**: pages.github.com (free with GitHub)
- **Cloudflare Pages**: pages.cloudflare.com (fast CDN)

Just upload your HTML file and point your domain to it!

---

## 📋 Quick Reference

### Telegram Bot Commands
- `/start` - Start receiving messages from your bot
- `/help` - Get help from BotFather

### Important Links
- Telegram BotFather: https://t.me/BotFather
- Telegram UserInfo Bot: https://t.me/userinfobot
- Discord Webhooks Guide: https://support.discord.com/hc/en-us/articles/228383668

---

## 🎉 You're All Set!

Your product website is now fully integrated with Discord and Telegram. Every time you manage your products, your team or customers can get instant updates on their favorite platform!

**Need help?** Check the troubleshooting section above or review the setup steps again.

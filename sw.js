# Sam & Molly's Pantry — PWA Setup Guide

## Deploy to GitHub Pages (5 minutes)

### Step 1: Create a new repository
1. Go to [github.com/new](https://github.com/new)
2. Name it something like `pantry` (or whatever you want)
3. Make it **Public**
4. Click **Create repository**

### Step 2: Upload the files
1. On your new repo page, click **"uploading an existing file"**
2. Drag & drop ALL files from this folder:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icons/icon-192.png`
   - `icons/icon-512.png`
3. Click **Commit changes**

### Step 3: Enable GitHub Pages
1. Go to your repo → **Settings** → **Pages** (left sidebar)
2. Under "Source", select **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Click **Save**
5. Wait 1-2 minutes, then your site will be live at:
   `https://YOUR-USERNAME.github.io/pantry/`

### Step 4: Add to iPhone Home Screen
1. Open the URL in **Safari** on your iPhone
2. Tap the **Share button** (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it "Pantry" and tap **Add**
5. It now opens as a full-screen app!

## Features
- **📦 Pantry** — Full inventory with levels, urgency, sorting & filtering
- **📋 Check-in** — Weekly update for 12 priority items with auto-projection
- **👨‍🍳 Recipes** — 22 recipes from your cookbook, add/remove anytime
- **🛒 Grocery List** — Smart list that:
  - Adds meal ingredients first (skips items you already have > 50%)
  - Fills remaining slots from curated pools (meats, vegs, starches, fruits)
  - Breakfast for 4-5 days for 2 people
  - Fun/snack items for 4-5 days for 2 people
  - Flags all low-inventory items for restocking

## Data Persistence
All your data (inventory levels, recipes, check-ins) is saved in your phone's 
local storage. It persists between sessions. To reset to defaults, you can clear
your browser data for the site.

## Tips
- Tap any recipe card to expand/collapse ingredients & steps
- Hit "↻ New Meals" on the grocery list to re-roll meal picks
- Hit ✕ on a meal card to swap just that one meal
- Green "Recipe" badges show items needed specifically for your meals

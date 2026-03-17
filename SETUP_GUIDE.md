# Google Sheets Sync Setup (5 minutes)

This connects the Pantry app to a Google Sheet so you and Molly
share the same inventory, recipes, and grocery list in real time.

## Step 1: Create the Google Sheet
1. Go to https://sheets.google.com
2. Create a new blank spreadsheet
3. Name it "Pantry Data" (or whatever you want)

## Step 2: Add the Apps Script
1. In the spreadsheet, click **Extensions > Apps Script**
2. Delete any code already there
3. Open the file `google-apps-script.js` from this zip
4. Copy ALL the code and paste it into the Apps Script editor
5. Click the save icon (or Ctrl+S)

## Step 3: Deploy as Web App
1. Click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Set these options:
   - Description: "Pantry API"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Click **Authorize access** and follow the prompts
   - If you see "Google hasn't verified this app", click
     **Advanced > Go to Pantry API (unsafe)** — this is your own script, it's safe
6. **Copy the Web app URL** — it looks like:
   `https://script.google.com/macros/s/ABCDEF.../exec`

## Step 4: Paste the URL into app.js
1. Open `app.js` in a text editor
2. Find this line near the top:
   ```
   var SHEET_URL = "YOUR_APPS_SCRIPT_URL";
   ```
3. Replace `YOUR_APPS_SCRIPT_URL` with the URL you copied
4. Save the file

## Step 5: Upload to GitHub Pages
1. Replace all files in your GitHub repo with the new ones
2. Wait 1-2 minutes for GitHub Pages to update
3. Clear Safari data on both phones, then reload

## How It Works
- Green dot = synced successfully
- Yellow dot = syncing in progress  
- Red dot = offline (using local data, will sync when back)
- The app polls the Google Sheet every 30 seconds for changes
- When you make a change, it pushes immediately to the sheet
- Both phones read from the same sheet, so they stay in sync

## Troubleshooting
- **"Google hasn't verified this app"** — This is normal for personal scripts.
  Click Advanced > Go to (project name) to proceed.
- **Data not syncing** — Make sure the URL in app.js matches exactly 
  (no trailing spaces, starts with https://)
- **Want to see the raw data?** — Open the Google Sheet and look at 
  the "Data" tab. Column A has keys, Column B has JSON values.
- **Need to reset?** — Delete all rows in the Data sheet and reload 
  the app. It will re-seed with default data.

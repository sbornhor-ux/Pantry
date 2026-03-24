# Update Instructions

The sync wasn't working because Google Apps Script redirects POST
requests and the browser drops the data during the redirect. This
update fixes it by using a different method for both reads and writes.

## Step 1: Update the Apps Script (REQUIRED)
1. Open your Google Sheet
2. Go to Extensions > Apps Script
3. DELETE all existing code
4. Open `google-apps-script.js` from this zip and paste ALL the new code
5. Click Save (Ctrl+S)
6. Click Deploy > Manage deployments
7. Click the pencil/edit icon on your existing deployment
8. In the "Version" dropdown, select "New version"
9. Click Deploy
10. If prompted to authorize again, click through it

## Step 2: Upload files to GitHub
Replace ALL files in your GitHub repo with these new files.

## Step 3: Clear phone caches (one last time)
On both phones: Settings > Safari > Clear History and Website Data
Then reload the app.

## How to verify it's working
1. Open the app — the dot next to "Grocery" should turn green
2. Make a change (e.g. do a check-in on one item)
3. Open the Google Sheet — you should see rows in the "Data" tab
4. Open the app on the other phone — it should show the same data

## Troubleshooting
- Dot stays red: The Apps Script URL might be wrong, or you need to
  re-deploy (Step 1 above)
- Dot turns yellow then red: The script is deployed but returning an
  error. Check the Apps Script execution log (Executions tab)
- Data shows on Sheet but not other phone: Wait 30 seconds (poll
  interval) or close and reopen the app

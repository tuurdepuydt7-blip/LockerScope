LOCKERSCOPE - FIXED PROJECT LAYOUT

Deploy this folder's CONTENTS as the Vercel project root.

Required Vercel environment variable:
FORTNITE_API_KEY = your provider API key

Do not put the key in app.js, index.html, GitHub, or share it in chat.
After adding/changing the environment variable, redeploy on Vercel.

Expected layout:
public/index.html
public/style.css
public/app.js
api/player.js
package.json
vercel.json

Test after deployment:
1. Open https://YOUR-VERCEL-DOMAIN.vercel.app/
2. Open https://YOUR-VERCEL-DOMAIN.vercel.app/api/player?username=PLAYERNAME
   (This endpoint should return account info or a clear API error.)
3. Search from the website.

If you use GitHub Pages for the frontend instead of Vercel, app.js must use the full Vercel API URL rather than /api/player. The supplied version is configured for frontend and backend both hosted on Vercel.

LOCKERSCOPE - VERCEL DEPLOYMENT

1. Upload the CONTENTS of this folder to the ROOT of your GitHub repository.
   The repository root must contain:
     public/index.html
     public/style.css
     public/app.js
     api/player.js
     package.json
     vercel.json

2. In Vercel, set the project Root Directory to ./ (repository root).

3. In Vercel -> Settings -> Environment Variables, add:
     Name: FORTNITE_API_KEY
     Value: your API provider key
   Do not put this key in public/app.js or GitHub.

4. Redeploy on Vercel.

5. Test these URLs on your Vercel domain:
     https://YOUR-DOMAIN.vercel.app/api/player?username=PLAYERNAME
   This should return account lookup JSON (or a useful error JSON).

NOTE: This project uses the unofficial prod.api-fortnite.com API provider.
The exact stats response fields depend on that provider's response format.

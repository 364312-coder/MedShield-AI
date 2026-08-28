MedShield-AI SOURCE FIX V3

Why V2 appeared to do nothing:
The latest screenshot still showed the old hero behavior (center-stacked HUD cards and wrapped title),
which contradicts the V2 selectors. That means the browser/server was still serving the old public files
or cached URLs. V3 therefore includes an installer that force-copies the corrected files into ./public
and changes all CSS/JS cache-busting query strings.

How to use:
1. Extract this ZIP into:
   C:\Users\18950843148\Desktop\webpage-design (your project root)
2. Open PowerShell in the project root.
3. Run:
   powershell -ExecutionPolicy Bypass -File ".\install_source_fix_v3.ps1"
4. Stop any old Wrangler process if it is still running.
5. Run:
   npm run dev
6. Open:
   http://127.0.0.1:8787/?v=sourcefix3-20260828
7. Ctrl + Shift + R

The installer does not touch Worker, D1, API, app.js, or formal experiment data.

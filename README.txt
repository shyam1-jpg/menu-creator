================================================================================
  MENU CREATOR — Portable app for designing printable restaurant menus
================================================================================

*** IMPORTANT — PHONES / TABLETS ***
--------------------------------------
DO NOT email HTML, ZIP, or BAT files to phones and expect them to work.
Phones will show broken TEXT instead of the app.

To use on iPhone or Android:
  1. Upload this folder to a website (HTTPS) — see DEPLOY-GUIDE.txt
  2. Share the HTTPS link (e.g. https://pureprasadkitchen.com/menu/)
  3. Install on phone — see INSTALL-ON-PHONE.txt

Fastest way today: Netlify Drop — drag this folder to https://app.netlify.com/drop


WHAT IT DOES
------------
Menu Creator helps you build professional A4 menus for lunch and dinner.
You can paste a full menu and the app will format it automatically, add
allergen labels, pick a style template, and show a live print preview.

Everything runs on your PC in the web browser. No install, no account,
and no internet needed after you open the app.


HOW TO OPEN THE APP
-------------------
  Option 1 (easiest): Double-click "Start Menu Creator.bat"
  Option 2: Double-click "index.html" (opens in your default browser)

Optional: Run "Install Desktop Shortcut.bat" once to put a shortcut on
your Desktop.


PASTE A FULL MENU (QUICK START)
-------------------------------
1. Open the app.
2. In the left panel, find "Paste full menu — auto generate".
3. Paste your menu text (dish names in CAPS, descriptions below, and
   allergen lines starting with "Contains:").
4. Click "Generate menu" to replace the current menu, or "Add to existing"
   to append dishes.
5. Check the live preview on the right.


SAVE TO MENU LIBRARY
--------------------
1. Pick a date and choose Lunch or Dinner at the top of the editor.
2. Build or paste your menu.
3. Click "Save to library".

Menus are stored on this PC only (in the browser). Use "Load from library"
or "Browse all" to find past menus by day, week, month, or year.


PRINT OR SAVE AS PDF
--------------------
Click "Print / Save PDF" in the toolbar (top right of the preview).
In the print dialog, choose your printer or "Save as PDF".

You can also click "View as Ebook" for a flipbook-style preview, then
use Save PDF from there.


EXPORT TO WORD
--------------
Click "Word (all days)" to download a Word document with every menu day.

From the Menu Library browser you can also export a whole month or year.


SAVE / OPEN PROJECT FILES
-------------------------
Use "Save project" to download a .json backup you can email or keep.
Use "Open project" to load a saved project file.


QR CODE ON THE MENU
-------------------
Each printed menu includes a QR code that links to:

  https://pureprasadkitchen.com

Guests can scan it with a phone camera. The caption reads:
"Scan the QR code — Recipe by Shyam Prasad, Head Chef"


OTHER FEATURES
--------------
- Multiple days (Mon–Sun week menus)
- Several visual templates (Classic Gold, Modern Minimal, etc.)
- Upload a logo image or type logo text
- Edit dishes, allergens, and dietary tags one by one
- "Load sample" to see an example menu


SHARING THIS APP WITH OTHERS
----------------------------
PC users: send Menu-Creator-App.zip. They unzip and double-click
"Start Menu Creator.bat".

PHONE users: DO NOT send zip/html files. Upload to a website first,
then share the HTTPS link. See DEPLOY-GUIDE.txt and INSTALL-ON-PHONE.txt.


WORKS OFFLINE
-------------
The app has no online dependencies. It works fully offline on Windows
(and other systems with a modern browser) using the local index.html file.

When served over HTTPS or localhost, a service worker caches the app so it
works offline even after the first visit.


INSTALL AS APP (PWA)
--------------------
Menu Creator can be installed like a phone or desktop app — it opens in its
own window with no browser toolbar.

IMPORTANT: "Install app" requires HTTPS — NOT file:// and NOT emailed files

  • Opening via "Start Menu Creator.bat" or double-clicking index.html uses
    file:// — the app works on PC, but browsers will NOT offer install.

  • For phone install, host on HTTPS first:
      - pureprasadkitchen.com/menu/  (your domain)
      - Netlify Drop (fastest — see DEPLOY-GUIDE.txt)
      - GitHub Pages

  • Share link: https://pureprasadkitchen.com/menu/install.html
    or https://pureprasadkitchen.com/menu/

Once hosted on HTTPS:

  Desktop (Chrome / Edge): Click "Install App" in the toolbar, or use the
    install icon in the address bar.

  Android: Open in Chrome → menu (⋮) → "Install app" or "Add to Home screen".

  iPhone / iPad: Open in Safari → Share → "Add to Home Screen".
    (Must use Safari — Chrome on iPhone cannot install PWAs.)

The installed app works offline after the first load (service worker cache).
On mobile, use the Edit / Preview tabs at the top to switch panels.


QUESTIONS?
----------
Created by Shyam Prasad. QR menus link to pureprasadkitchen.com.

================================================================================

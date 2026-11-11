# Call-center English and teal palette update

Owner requested removing Persian from the call-center dashboard and applying the supplied palette.

- Call center is English/LTR, including login, and ignores an old Persian preference. Its language toggle is removed, and its production bundle excludes the Persian translation module. Management retains its language choice and existing theme.
- Palette: primary `#0B3D3B`, accent `#14B8A6`, secondary `#99F6E4`, surface `#E6FFFB`, background `#F8FFFE`. Dark primary text/buttons preserve contrast; warning/error states remain distinct.
- `apps/staff/src/main.tsx` scopes workspace language/theme. `apps/staff/src/callcenter-theme.css` applies the palette to navigation, cards, forms, tables, dialogs, and login without replacing layout foundations.
- Responsive regression fixed: hidden table headings are contained within their horizontal scroll area, avoiding page overflow on the mobile overview.
- Verification: staff TypeScript, both production role builds, workflow browser checks, and a dedicated English/palette/mobile/management-isolation browser check passed. Screenshots: `test-results/staff/callcenter-teal-desktop.png` and `callcenter-teal-mobile.png`.

Latest frontend builds: `releases/callcenter-english-teal-20261111-final/callcenter/` and `management/`. For the call-center update, copy the callcenter folder contents into the testing website's `/callcenter/` directory, including `.htaccess`. This is a frontend build only; keep the private service/database setup from the earlier full package. Earlier staff packages contain the previous call-center appearance. No database, backend, or live deployment changes were made in this update.

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUT_DIR = 'public/assets/kabul-plaza-saljuqi';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log('Extracting all architectural assets from Kabul Plaza Saljuqi PDF pages...');

// 1. Cover & Exterior
execSync(`convert ${OUT_DIR}/page_01.png -crop 2300x3200+2500+250 +repage ${OUT_DIR}/building_exterior_cover.png`);
execSync(`convert ${OUT_DIR}/page_02.png -crop 2600x3200+800+200 +repage ${OUT_DIR}/building_exterior_sunset.png`);

// 2. Masterplans
// 1st Floor (Commercial + Apt A)
execSync(`convert ${OUT_DIR}/page_03.png -crop 1400x2600+220+450 +repage ${OUT_DIR}/floor_01_commercial_furnished_masterplan.png`);
execSync(`convert ${OUT_DIR}/page_03.png -crop 1400x2600+2500+450 +repage ${OUT_DIR}/floor_01_commercial_technical_masterplan.png`);

// 2nd to 10th Floor (Typical Residential)
execSync(`convert ${OUT_DIR}/page_05.png -crop 1400x2700+550+400 +repage ${OUT_DIR}/floor_typical_2_to_10_furnished_masterplan.png`);
execSync(`convert ${OUT_DIR}/page_05.png -crop 1400x2700+2350+400 +repage ${OUT_DIR}/floor_typical_2_to_10_technical_masterplan.png`);

// 11th Floor (VIP / Penthouse Residential)
execSync(`convert ${OUT_DIR}/page_09.png -crop 1400x2700+550+400 +repage ${OUT_DIR}/floor_11_vip_furnished_masterplan.png`);
execSync(`convert ${OUT_DIR}/page_09.png -crop 1400x2700+2400+400 +repage ${OUT_DIR}/floor_11_vip_technical_masterplan.png`);

// 3. Apartments:
// 1st Floor Apt A (3+1)
execSync(`convert ${OUT_DIR}/page_04.png -crop 320x540+140+110 +repage ${OUT_DIR}/apt_1st_a_legend.png`);
execSync(`convert ${OUT_DIR}/page_04.png -crop 1900x1200+240+1150 +repage ${OUT_DIR}/apt_1st_a_furnished.png`);
execSync(`convert ${OUT_DIR}/page_04.png -crop 1900x1200+2160+1150 +repage ${OUT_DIR}/apt_1st_a_technical.png`);

// 2nd to 10th Floor Apt A (3+1)
execSync(`convert ${OUT_DIR}/page_06.png -crop 320x460+140+150 +repage ${OUT_DIR}/apt_typical_a_legend.png`);
execSync(`convert ${OUT_DIR}/page_06.png -crop 1900x1200+220+1150 +repage ${OUT_DIR}/apt_typical_a_furnished.png`);
execSync(`convert ${OUT_DIR}/page_06.png -crop 1900x1200+2180+1150 +repage ${OUT_DIR}/apt_typical_a_technical.png`);

// 2nd to 10th Floor Apt B (5+1)
execSync(`convert ${OUT_DIR}/page_07.png -crop 320x460+140+150 +repage ${OUT_DIR}/apt_typical_b_legend.png`);
execSync(`convert ${OUT_DIR}/page_07.png -crop 950x2600+900+500 +repage ${OUT_DIR}/apt_typical_b_furnished.png`);
execSync(`convert ${OUT_DIR}/page_07.png -crop 950x2600+2550+500 +repage ${OUT_DIR}/apt_typical_b_technical.png`);

// 2nd to 10th Floor Apt C (4+1)
execSync(`convert ${OUT_DIR}/page_08.png -crop 320x460+140+150 +repage ${OUT_DIR}/apt_typical_c_legend.png`);
execSync(`convert ${OUT_DIR}/page_08.png -crop 1050x2350+1050+650 +repage ${OUT_DIR}/apt_typical_c_furnished.png`);
execSync(`convert ${OUT_DIR}/page_08.png -crop 1050x2350+2680+650 +repage ${OUT_DIR}/apt_typical_c_technical.png`);

// 11th Floor VIP Apt A (4+1 with Terrace)
execSync(`convert ${OUT_DIR}/page_10.png -crop 360x480+140+140 +repage ${OUT_DIR}/apt_11th_vip_a_legend.png`);
execSync(`convert ${OUT_DIR}/page_10.png -crop 1950x1900+200+850 +repage ${OUT_DIR}/apt_11th_vip_a_furnished.png`);
execSync(`convert ${OUT_DIR}/page_10.png -crop 1950x1900+2200+850 +repage ${OUT_DIR}/apt_11th_vip_a_technical.png`);

// 11th Floor VIP Apt B (4+1 with Large Terrace)
execSync(`convert ${OUT_DIR}/page_11.png -crop 360x480+140+140 +repage ${OUT_DIR}/apt_11th_vip_b_legend.png`);
execSync(`convert ${OUT_DIR}/page_11.png -crop 1700x2050+400+800 +repage ${OUT_DIR}/apt_11th_vip_b_furnished.png`);
execSync(`convert ${OUT_DIR}/page_11.png -crop 1700x2050+2320+800 +repage ${OUT_DIR}/apt_11th_vip_b_technical.png`);

console.log('All Kabul Plaza Saljuqi PNG assets extracted successfully.');

import { execSync } from 'child_process';
import fs from 'fs';

const OUT_DIR = 'public/assets/moon-residency';
console.log('Extracting Moon Residency architectural PNGs...');

// 1. Cover & Exterior
execSync(`convert ${OUT_DIR}/page_01.png -crop 1700x1750+1280+130 +repage ${OUT_DIR}/building_exterior_cover.png`);

// 2. Masterplans
// First Floor Plan (Commercial)
execSync(`convert ${OUT_DIR}/page_02.png -crop 1160x1700+110+260 +repage ${OUT_DIR}/floor_01_commercial_furnished_masterplan.png`);
execSync(`convert ${OUT_DIR}/page_02.png -crop 1160x1700+1350+260 +repage ${OUT_DIR}/floor_01_commercial_technical_masterplan.png`);

// 2nd to 10th Floor Plan (Typical Residential 4-units)
execSync(`convert ${OUT_DIR}/page_03.png -crop 1160x1700+110+260 +repage ${OUT_DIR}/floor_typical_2_to_10_furnished_masterplan.png`);
execSync(`convert ${OUT_DIR}/page_03.png -crop 1160x1700+1350+260 +repage ${OUT_DIR}/floor_typical_2_to_10_technical_masterplan.png`);

// 3. Apartments
// Apartment 01 (3+1)
execSync(`convert ${OUT_DIR}/page_04.png -crop 360x360+110+90 +repage ${OUT_DIR}/apt_01_legend.png`);
execSync(`convert ${OUT_DIR}/page_04.png -crop 1120x1320+110+560 +repage ${OUT_DIR}/apt_01_furnished.png`);
execSync(`convert ${OUT_DIR}/page_04.png -crop 1120x1320+1350+560 +repage ${OUT_DIR}/apt_01_technical.png`);

// Apartment 02 (4+1)
execSync(`convert ${OUT_DIR}/page_05.png -crop 360x360+110+90 +repage ${OUT_DIR}/apt_02_legend.png`);
execSync(`convert ${OUT_DIR}/page_05.png -crop 1120x1360+160+520 +repage ${OUT_DIR}/apt_02_furnished.png`);
execSync(`convert ${OUT_DIR}/page_05.png -crop 1120x1360+1440+520 +repage ${OUT_DIR}/apt_02_technical.png`);

// Apartment 03 (3+1)
execSync(`convert ${OUT_DIR}/page_06.png -crop 360x360+110+90 +repage ${OUT_DIR}/apt_03_legend.png`);
execSync(`convert ${OUT_DIR}/page_06.png -crop 1120x1320+110+560 +repage ${OUT_DIR}/apt_03_furnished.png`);
execSync(`convert ${OUT_DIR}/page_06.png -crop 1120x1320+1350+560 +repage ${OUT_DIR}/apt_03_technical.png`);

// Apartment 04 (4+1)
execSync(`convert ${OUT_DIR}/page_07.png -crop 360x360+110+90 +repage ${OUT_DIR}/apt_04_legend.png`);
execSync(`convert ${OUT_DIR}/page_07.png -crop 1120x1360+160+520 +repage ${OUT_DIR}/apt_04_furnished.png`);
execSync(`convert ${OUT_DIR}/page_07.png -crop 1120x1360+1400+520 +repage ${OUT_DIR}/apt_04_technical.png`);

console.log('All Moon Residency assets extracted successfully!');

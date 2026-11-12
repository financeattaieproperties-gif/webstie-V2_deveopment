import original from "./assets/attaie-original.png";
import layer0 from "./assets/swoosh.png";
import layer1 from "./assets/tower.png";
import layer2 from "./assets/roof.png";
import layer3 from "./assets/window-1.png";
import layer4 from "./assets/window-2.png";
import layer5 from "./assets/window-3.png";
import layer6 from "./assets/window-4.png";
import layer7 from "./assets/attaie.png";
import layer8 from "./assets/properties.png";
import layer9 from "./assets/keys.png";
export { original };
export const logoLayers = [
  { name:"swoosh", source:layer0, bounds:[0, 15, 1867, 826], delay:0, duration:0.62, animation:"swoosh" },
  { name:"tower", source:layer1, bounds:[264, 0, 257, 465], delay:0.12, duration:0.65, animation:"tower" },
  { name:"roof", source:layer2, bounds:[152, 370, 503, 244], delay:0.43, duration:0.55, animation:"roof" },
  { name:"window-1", source:layer3, bounds:[328, 512, 61, 55], delay:0.64, duration:0.36, animation:"window" },
  { name:"window-2", source:layer4, bounds:[390, 512, 63, 55], delay:0.71, duration:0.36, animation:"window" },
  { name:"window-3", source:layer5, bounds:[328, 568, 61, 59], delay:0.78, duration:0.36, animation:"window" },
  { name:"window-4", source:layer6, bounds:[390, 568, 63, 59], delay:0.85, duration:0.36, animation:"window" },
  { name:"attaie", source:layer7, bounds:[710, 350, 1152, 253], delay:0.54, duration:0.61, animation:"attaie" },
  { name:"properties", source:layer8, bounds:[702, 603, 1154, 138], delay:0.76, duration:0.58, animation:"properties" },
  { name:"keys", source:layer9, bounds:[538, 608, 222, 233], delay:1, duration:0.62, animation:"keys" },
];

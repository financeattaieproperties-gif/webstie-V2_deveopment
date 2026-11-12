/** Complete floor number followed by a two-digit suffix; one corridor uses A. */
export function apartmentNumber(corridor, floor, suffix) {
  if (!/^[A-Z]$/.test(corridor) || !Number.isInteger(floor) || floor < 1 || !/^\d{1,2}$/.test(String(suffix)) || Number(suffix) < 1 || Number(suffix) > 99) throw new Error('Invalid corridor, floor or unit suffix.');
  return `${corridor}-${floor}${String(suffix).padStart(2, '0')}`;
}

/** Copy reviewed ordinary apartments only. VIP/roof exceptions require individual entry. */
export function copyTypicalFloor(units, sourceFloor, targetFloors, existing) {
  const source = units.filter(u => u.floor === sourceFloor && (u.kind || 'apartment') === 'apartment');
  if (!source.length || source.some(u => u.isVip || u.roofAreaSqm > 0)) throw new Error('Choose an ordinary residential source floor without roof exceptions.');
  if (!targetFloors.length || new Set(targetFloors).size !== targetFloors.length || targetFloors.includes(sourceFloor)) throw new Error('Choose distinct target floors excluding the source.');
  const names = new Set(existing.map(u => u.unitNumber.toUpperCase()));
  return targetFloors.flatMap(floor => source.map(unit => {
    const unitNumber = apartmentNumber(unit.corridor || 'A', floor, unit.unitNumber.slice(-2));
    if (names.has(unitNumber.toUpperCase())) throw new Error(`Duplicate unit: ${unitNumber}`);
    names.add(unitNumber.toUpperCase());
    return {...unit, id:0, serialNumber:unitNumber, floor, unitNumber, status:'available', isVip:false, roofAreaSqm:0, totalPrice: Math.round(unit.areaSqm * unit.pricePerSqm * 100) / 100};
  }));
}

export function validateInventoryLayout(project) {
  const errors = [];
  const { floors, corridorCount, commercialFloors = [], residentialFloors = [], apartments = [] } = project;
  if (!Number.isInteger(floors) || floors < 1 || floors > 200) errors.push('Floors must be between 1 and 200.');
  if (!Number.isInteger(corridorCount) || corridorCount < 1 || corridorCount > 26) errors.push('Corridors must be between 1 and 26.');
  const floorSet = [...commercialFloors, ...residentialFloors];
  if (floorSet.some(f => !Number.isInteger(f) || f < 1 || f > floors) || new Set(floorSet).size !== floorSet.length) errors.push('Choose valid, non-overlapping commercial and residential floors.');
  if (floorSet.length !== floors) errors.push('Classify every floor as commercial or residential.');
  const names = new Set();
  for (const unit of apartments) {
    const key = String(unit.unitNumber || '').trim().toUpperCase();
    if (!key || names.has(key)) errors.push('Each unit needs a unique identifier.');
    names.add(key);
    const residential = (unit.kind || 'apartment') === 'apartment';
    if (!(residential ? residentialFloors : commercialFloors).includes(unit.floor)) errors.push(`Invalid floor for ${key}.`);
    if (!(Number.isFinite(unit.areaSqm) && unit.areaSqm > 0 && Number.isFinite(unit.pricePerSqm) && unit.pricePerSqm > 0)) errors.push(`Area and price must be positive for ${key}.`);
    if (residential && (!/^[A-Z]$/.test(unit.corridor || 'A') || (unit.corridor || 'A').charCodeAt(0) - 65 >= corridorCount)) errors.push(`Invalid corridor for ${key}.`);
    if (residential) {
      try { if (apartmentNumber(unit.corridor || 'A', unit.floor, key.slice(-2)) !== key) errors.push(`Invalid apartment number: ${key}.`); }
      catch { errors.push(`Invalid apartment number: ${key}.`); }
    }
    if (!Number.isFinite(unit.roofAreaSqm ?? 0) || (unit.roofAreaSqm || 0) < 0 || (unit.roofAreaSqm > 0 && !unit.isVip) || (unit.isVip && (!residential || unit.floor !== floors))) errors.push('VIP roof area is separate and allowed only on the top residential floor.');
  }
  return [...new Set(errors)];
}

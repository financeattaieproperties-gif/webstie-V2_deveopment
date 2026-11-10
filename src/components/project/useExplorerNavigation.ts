import { useState, useCallback } from 'react';
import type { ExplorerFloor, ApartmentPlacement } from '../../../shared/visual-config';

export type ExplorerStage = 'exterior' | 'floor' | 'apartment';

export interface ExplorerNavigationState {
  stage: ExplorerStage;
  selectedFloor: ExplorerFloor | null;
  selectedApartment: ApartmentPlacement | null;
  revealPercent: number;
}

export function useExplorerNavigation(initialFloor: ExplorerFloor | null = null) {
  const [stage, setStage] = useState<ExplorerStage>('exterior');
  const [selectedFloor, setSelectedFloor] = useState<ExplorerFloor | null>(initialFloor);
  const [selectedApartment, setSelectedApartment] = useState<ApartmentPlacement | null>(null);
  const [revealPercent, setRevealPercent] = useState<number>(50);

  const selectFloor = useCallback((floor: ExplorerFloor) => {
    setSelectedFloor(floor);
    setSelectedApartment(null);
    setStage('floor');
  }, []);

  const selectApartment = useCallback((apartment: ApartmentPlacement) => {
    setSelectedApartment(apartment);
    setStage('apartment');
  }, []);

  const goBackToExterior = useCallback(() => {
    setStage('exterior');
    setSelectedApartment(null);
  }, []);

  const goBackToFloor = useCallback(() => {
    setStage('floor');
    setSelectedApartment(null);
  }, []);

  return {
    stage,
    selectedFloor,
    selectedApartment,
    revealPercent,
    setRevealPercent,
    selectFloor,
    selectApartment,
    goBackToExterior,
    goBackToFloor,
  };
}

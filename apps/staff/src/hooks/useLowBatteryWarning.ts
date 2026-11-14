import { useCallback, useEffect, useRef, useState } from "react";
import {
  LOW_BATTERY_WARNING_THRESHOLD,
  shouldWarnLowBattery,
} from "../../../../packages/staff-contracts/offline-cache.mjs";
import { useBatteryStatus } from "./useBatteryStatus";

/**
 * Listens for battery state changes (native Android DeviceBatteryBridge or Web Battery API)
 * and raises a low-battery warning whenever charge drops strictly below 15% while unplugged.
 * Dismissal resets automatically if the device starts charging or recovers >= 15%.
 */
export function useLowBatteryWarning(
  enabled: boolean,
  thresholdPercent = LOW_BATTERY_WARNING_THRESHOLD,
) {
  const battery = useBatteryStatus(enabled);
  const isLow = enabled && shouldWarnLowBattery(battery, thresholdPercent);
  const [dismissed, setDismissed] = useState(false);
  const wasLowRef = useRef(false);

  useEffect(() => {
    if (!isLow) {
      if (wasLowRef.current) {
        wasLowRef.current = false;
      }
      setDismissed(false);
      return;
    }

    if (!wasLowRef.current) {
      wasLowRef.current = true;
      setDismissed(false);
    }
  }, [isLow]);

  const dismissWarning = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    battery,
    isLowBattery: isLow,
    showWarning: isLow && !dismissed,
    thresholdPercent,
    dismissWarning,
  };
}

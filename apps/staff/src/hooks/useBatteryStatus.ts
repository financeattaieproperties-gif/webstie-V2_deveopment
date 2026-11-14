import { useEffect, useState } from "react";
import {
  formatBatteryStatus,
  parseBatteryBridgePayload,
} from "../../../../packages/staff-contracts/offline-cache.mjs";

interface BatteryManagerLike extends EventTarget {
  level: number;
  charging: boolean;
}

interface AttaieBatteryBridge {
  getBatteryStatusJson?: () => string;
}

type BatteryWindow = Window & {
  AttaieBattery?: AttaieBatteryBridge;
  __attaieBatteryUpdate?: (payload: unknown) => void;
};

export function useBatteryStatus(enabled: boolean) {
  const [rawStatus, setRawStatus] = useState<{
    available: boolean;
    level: number;
    charging: boolean;
  }>(() => {
    if (!enabled || typeof window === "undefined") {
      return { available: false, level: 1, charging: false };
    }
    const bridge = (window as BatteryWindow).AttaieBattery;
    if (bridge?.getBatteryStatusJson) {
      try {
        return parseBatteryBridgePayload(bridge.getBatteryStatusJson());
      } catch {
        return { available: false, level: 1, charging: false };
      }
    }
    return { available: false, level: 1, charging: false };
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let cancelled = false;
    const win = window as BatteryWindow;

    win.__attaieBatteryUpdate = (payload: unknown) => {
      if (cancelled) return;
      const parsed = parseBatteryBridgePayload(payload as never);
      if (parsed.available) setRawStatus(parsed);
    };

    if (win.AttaieBattery?.getBatteryStatusJson) {
      try {
        const initial = parseBatteryBridgePayload(
          win.AttaieBattery.getBatteryStatusJson(),
        );
        if (initial.available) setRawStatus(initial);
      } catch {
        // Ignore bridge errors
      }
      return () => {
        cancelled = true;
        delete win.__attaieBatteryUpdate;
      };
    }

    const nav = navigator as Navigator & {
      getBattery?: () => Promise<BatteryManagerLike>;
    };
    if (typeof nav.getBattery !== "function") {
      return () => {
        cancelled = true;
        delete win.__attaieBatteryUpdate;
      };
    }

    let batteryObj: BatteryManagerLike | null = null;
    const syncFromWebBattery = () => {
      if (cancelled || !batteryObj) return;
      setRawStatus({
        available: true,
        level: batteryObj.level,
        charging: batteryObj.charging,
      });
    };

    nav
      .getBattery()
      .then((battery) => {
        if (cancelled) return;
        batteryObj = battery;
        syncFromWebBattery();
        battery.addEventListener("levelchange", syncFromWebBattery);
        battery.addEventListener("chargingchange", syncFromWebBattery);
      })
      .catch(() => {
        // Battery API blocked or unavailable
      });

    return () => {
      cancelled = true;
      delete win.__attaieBatteryUpdate;
      if (batteryObj) {
        batteryObj.removeEventListener("levelchange", syncFromWebBattery);
        batteryObj.removeEventListener("chargingchange", syncFromWebBattery);
      }
    };
  }, [enabled]);

  return formatBatteryStatus(rawStatus);
}

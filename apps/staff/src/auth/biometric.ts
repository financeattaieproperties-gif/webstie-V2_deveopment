import {
  STAFF_QUICK_BIOMETRIC_KEY,
  parseBiometricBridgeStatus,
  readQuickSignInPreference,
  writeQuickSignInPreference,
} from "../../../../packages/staff-contracts/role-preference.mjs";

export interface BiometricStatus {
  available: boolean;
  enrolled: boolean;
  email: string;
  quickSignInEnabled: boolean;
  statusCode: number;
}

export interface BiometricPromptLabels {
  title: string;
  subtitle: string;
  cancelLabel: string;
}

export interface BiometricCallbackPayload {
  ok: boolean;
  cancelled?: boolean;
  email?: string;
  password?: string;
  errorCode?: number;
  message?: string;
}

interface AndroidBiometricBridge {
  getStatusJson: () => string;
  setQuickSignInEnabled?: (enabled: boolean) => boolean;
  clearCredentials: () => boolean;
  enroll: (
    requestId: string,
    email: string,
    password: string,
    promptTitle: string,
    promptSubtitle: string,
    negativeText: string,
  ) => void;
  authenticate: (
    requestId: string,
    promptTitle: string,
    promptSubtitle: string,
    negativeText: string,
  ) => void;
}

declare global {
  interface Window {
    AttaieBiometric?: AndroidBiometricBridge;
    __attaieBiometricCallback?: (
      requestId: string,
      payload: BiometricCallbackPayload,
    ) => void;
    __ATTAIE_ANDROID_APP__?: boolean;
  }
}

const pendingRequests = new Map<
  string,
  (payload: BiometricCallbackPayload) => void
>();

function ensureDispatcher() {
  if (typeof window === "undefined") return;
  if (!window.__attaieBiometricCallback) {
    window.__attaieBiometricCallback = (requestId, payload) => {
      const resolver = pendingRequests.get(requestId);
      if (!resolver) return;
      pendingRequests.delete(requestId);
      resolver(payload);
    };
  }
}

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `bio_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isBiometricBridgeAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.AttaieBiometric?.getStatusJson === "function"
  );
}

export function getBiometricStatus(): BiometricStatus {
  if (!isBiometricBridgeAvailable()) {
    return parseBiometricBridgeStatus(null);
  }
  try {
    const parsed = parseBiometricBridgeStatus(
      window.AttaieBiometric!.getStatusJson(),
    );
    const hasLocalOverride =
      typeof window !== "undefined" &&
      window.localStorage?.getItem(STAFF_QUICK_BIOMETRIC_KEY) !== null;
    return {
      ...parsed,
      quickSignInEnabled: hasLocalOverride
        ? readQuickSignInPreference()
        : parsed.quickSignInEnabled,
    };
  } catch {
    return parseBiometricBridgeStatus(null);
  }
}

export function setQuickSignInPreference(enabled: boolean): boolean {
  const next = Boolean(enabled);
  writeQuickSignInPreference(next);
  if (typeof window !== "undefined") {
    try {
      window.AttaieBiometric?.setQuickSignInEnabled?.(next);
    } catch {
      // Ignore bridge write error; localStorage still holds preference
    }
  }
  return next;
}

export function clearBiometricEnrollment(): boolean {
  if (!isBiometricBridgeAvailable()) return false;
  try {
    return Boolean(window.AttaieBiometric!.clearCredentials());
  } catch {
    return false;
  }
}

export function enrollBiometric(
  email: string,
  password: string,
  labels: BiometricPromptLabels,
): Promise<BiometricCallbackPayload> {
  if (!isBiometricBridgeAvailable()) {
    return Promise.resolve({
      ok: false,
      message: "Biometric authentication is only available in the Android app.",
    });
  }
  ensureDispatcher();
  const requestId = nextRequestId();
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        resolve({
          ok: false,
          cancelled: true,
          message: "Biometric verification timed out.",
        });
      }
    }, 60_000);

    pendingRequests.set(requestId, (payload) => {
      window.clearTimeout(timer);
      if (payload.ok) {
        setQuickSignInPreference(true);
      }
      resolve(payload);
    });

    try {
      window.AttaieBiometric!.enroll(
        requestId,
        email,
        password,
        labels.title,
        labels.subtitle,
        labels.cancelLabel,
      );
    } catch {
      window.clearTimeout(timer);
      pendingRequests.delete(requestId);
      resolve({
        ok: false,
        message: "Unable to open device biometric prompt.",
      });
    }
  });
}

export function authenticateWithBiometric(
  labels: BiometricPromptLabels,
): Promise<BiometricCallbackPayload> {
  if (!isBiometricBridgeAvailable()) {
    return Promise.resolve({
      ok: false,
      message: "Biometric authentication is only available in the Android app.",
    });
  }
  ensureDispatcher();
  const requestId = nextRequestId();
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        resolve({
          ok: false,
          cancelled: true,
          message: "Biometric verification timed out.",
        });
      }
    }, 60_000);

    pendingRequests.set(requestId, (payload) => {
      window.clearTimeout(timer);
      resolve(payload);
    });

    try {
      window.AttaieBiometric!.authenticate(
        requestId,
        labels.title,
        labels.subtitle,
        labels.cancelLabel,
      );
    } catch {
      window.clearTimeout(timer);
      pendingRequests.delete(requestId);
      resolve({
        ok: false,
        message: "Unable to open device biometric prompt.",
      });
    }
  });
}

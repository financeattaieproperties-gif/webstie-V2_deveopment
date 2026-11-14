package af.attaieproperties.sales

import android.content.SharedPreferences
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONObject

/**
 * AndroidX BiometricPrompt + Android Keystore EncryptedSharedPreferences bridge
 * for the Attaie Sales CRM Android WebView.
 *
 * Security model:
 * - Credentials are stored ONLY in AES-256-GCM EncryptedSharedPreferences backed by Android Keystore.
 * - Credentials are NEVER exposed synchronously to JavaScript; they are delivered to the active
 *   callback ONLY after BiometricPrompt.AuthenticationCallback.onAuthenticationSucceeded fires
 *   and the WebView is verified on the local virtual origin (https://sales.attaieproperties.com/).
 * - Supports Class 3 (BIOMETRIC_STRONG: hardware Fingerprint/3D Face) and Class 2 (BIOMETRIC_WEAK:
 *   convenience Face Unlock) authenticators across Android 7+ (API 24+) devices.
 */
class BiometricAuthBridge(
    private val activity: AppCompatActivity,
    private val webView: WebView
) {
    companion object {
        private const val PREFS_FILE = "attaie_sales_biometric_vault"
        private const val KEY_EMAIL = "enrolled_email"
        private const val KEY_PASSWORD = "enrolled_password"
        private const val KEY_ENROLLED_AT = "enrolled_at"
        private const val KEY_QUICK_SIGN_IN = "quick_sign_in_enabled"
        private const val TRUSTED_ORIGIN_PREFIX = "https://sales.attaieproperties.com/"
        private const val ALLOWED_AUTHENTICATORS =
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.BIOMETRIC_WEAK
    }

    private fun openVault(): SharedPreferences? {
        return try {
            val masterKey = MasterKey.Builder(activity.applicationContext)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            EncryptedSharedPreferences.create(
                activity.applicationContext,
                PREFS_FILE,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (_: Exception) {
            // If Android Keystore keys were invalidated (e.g. lock screen changed), reset corrupted vault
            try {
                activity.applicationContext.deleteSharedPreferences(PREFS_FILE)
            } catch (_: Exception) {
            }
            null
        }
    }

    private fun isTrustedOrigin(url: String?): Boolean {
        return url != null && url.startsWith(TRUSTED_ORIGIN_PREFIX)
    }

    private fun deliverResult(requestId: String, payload: JSONObject) {
        activity.runOnUiThread {
            if (!isTrustedOrigin(webView.url)) return@runOnUiThread
            val script =
                "window.__attaieBiometricCallback && window.__attaieBiometricCallback(" +
                    "${JSONObject.quote(requestId)}, ${payload});"
            webView.evaluateJavascript(script, null)
        }
    }

    @JavascriptInterface
    fun getStatusJson(): String {
        val manager = BiometricManager.from(activity)
        val statusCode = manager.canAuthenticate(ALLOWED_AUTHENTICATORS)
        val hardwareReady = statusCode == BiometricManager.BIOMETRIC_SUCCESS
        val vault = openVault()
        val email = vault?.getString(KEY_EMAIL, "").orEmpty()
        val password = vault?.getString(KEY_PASSWORD, "").orEmpty()
        val enrolled = hardwareReady && email.isNotEmpty() && password.isNotEmpty()
        val quickSignInEnabled = vault?.getBoolean(KEY_QUICK_SIGN_IN, true) ?: true

        return JSONObject().apply {
            put("available", hardwareReady)
            put("enrolled", enrolled)
            put("email", if (enrolled) email else "")
            put("quickSignInEnabled", quickSignInEnabled)
            put("statusCode", statusCode)
        }.toString()
    }

    @JavascriptInterface
    fun setQuickSignInEnabled(enabled: Boolean): Boolean {
        activity.runOnUiThread {
            if (!isTrustedOrigin(webView.url)) return@runOnUiThread
            openVault()?.edit()?.putBoolean(KEY_QUICK_SIGN_IN, enabled)?.apply()
        }
        return true
    }

    @JavascriptInterface
    fun clearCredentials(): Boolean {
        val vault = openVault() ?: return true
        vault.edit().clear().apply()
        return true
    }

    @JavascriptInterface
    fun enroll(
        requestId: String,
        email: String,
        password: String,
        promptTitle: String?,
        promptSubtitle: String?,
        negativeText: String?
    ) {
        val cleanEmail = email.trim()
        if (cleanEmail.isEmpty() || password.isEmpty()) {
            deliverResult(
                requestId,
                JSONObject()
                    .put("ok", false)
                    .put("cancelled", false)
                    .put("message", "Email and password are required to enable biometric unlock.")
            )
            return
        }

        activity.runOnUiThread {
            if (!isTrustedOrigin(webView.url)) {
                return@runOnUiThread
            }
            val manager = BiometricManager.from(activity)
            if (manager.canAuthenticate(ALLOWED_AUTHENTICATORS) != BiometricManager.BIOMETRIC_SUCCESS) {
                deliverResult(
                    requestId,
                    JSONObject()
                        .put("ok", false)
                        .put("cancelled", false)
                        .put("message", "Biometric authentication is not set up on this device.")
                )
                return@runOnUiThread
            }

            val executor = ContextCompat.getMainExecutor(activity)
            val prompt = BiometricPrompt(
                activity,
                executor,
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                        val vault = openVault()
                        if (vault == null) {
                            deliverResult(
                                requestId,
                                JSONObject()
                                    .put("ok", false)
                                    .put("cancelled", false)
                                    .put("message", "Secure credential storage is unavailable on this device.")
                            )
                            return
                        }
                        vault.edit()
                            .putString(KEY_EMAIL, cleanEmail)
                            .putString(KEY_PASSWORD, password)
                            .putLong(KEY_ENROLLED_AT, System.currentTimeMillis())
                            .apply()
                        deliverResult(
                            requestId,
                            JSONObject()
                                .put("ok", true)
                                .put("email", cleanEmail)
                        )
                    }

                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                        val isCancel = errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON ||
                            errorCode == BiometricPrompt.ERROR_USER_CANCELED ||
                            errorCode == BiometricPrompt.ERROR_CANCELED
                        deliverResult(
                            requestId,
                            JSONObject()
                                .put("ok", false)
                                .put("cancelled", isCancel)
                                .put("errorCode", errorCode)
                                .put("message", errString.toString())
                        )
                    }
                }
            )

            val title = promptTitle?.takeIf { it.isNotBlank() }
                ?: activity.getString(R.string.biometric_prompt_title)
            val subtitle = promptSubtitle?.takeIf { it.isNotBlank() }
                ?: activity.getString(R.string.biometric_prompt_enroll_subtitle)
            val cancelLabel = negativeText?.takeIf { it.isNotBlank() }
                ?: activity.getString(R.string.biometric_prompt_negative)

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle(title)
                .setSubtitle(subtitle)
                .setNegativeButtonText(cancelLabel)
                .setAllowedAuthenticators(ALLOWED_AUTHENTICATORS)
                .setConfirmationRequired(true)
                .build()

            prompt.authenticate(promptInfo)
        }
    }

    @JavascriptInterface
    fun authenticate(
        requestId: String,
        promptTitle: String?,
        promptSubtitle: String?,
        negativeText: String?
    ) {
        activity.runOnUiThread {
            if (!isTrustedOrigin(webView.url)) {
                return@runOnUiThread
            }
            val vault = openVault()
            val savedEmail = vault?.getString(KEY_EMAIL, "").orEmpty()
            val savedPassword = vault?.getString(KEY_PASSWORD, "").orEmpty()
            if (savedEmail.isEmpty() || savedPassword.isEmpty()) {
                deliverResult(
                    requestId,
                    JSONObject()
                        .put("ok", false)
                        .put("cancelled", false)
                        .put("message", "No biometric account is currently saved on this device.")
                )
                return@runOnUiThread
            }

            val manager = BiometricManager.from(activity)
            if (manager.canAuthenticate(ALLOWED_AUTHENTICATORS) != BiometricManager.BIOMETRIC_SUCCESS) {
                deliverResult(
                    requestId,
                    JSONObject()
                        .put("ok", false)
                        .put("cancelled", false)
                        .put("message", "Biometric hardware is unavailable. Please sign in with your password.")
                )
                return@runOnUiThread
            }

            val executor = ContextCompat.getMainExecutor(activity)
            val prompt = BiometricPrompt(
                activity,
                executor,
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                        deliverResult(
                            requestId,
                            JSONObject()
                                .put("ok", true)
                                .put("email", savedEmail)
                                .put("password", savedPassword)
                        )
                    }

                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                        val isCancel = errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON ||
                            errorCode == BiometricPrompt.ERROR_USER_CANCELED ||
                            errorCode == BiometricPrompt.ERROR_CANCELED
                        deliverResult(
                            requestId,
                            JSONObject()
                                .put("ok", false)
                                .put("cancelled", isCancel)
                                .put("errorCode", errorCode)
                                .put("message", errString.toString())
                        )
                    }
                }
            )

            val title = promptTitle?.takeIf { it.isNotBlank() }
                ?: activity.getString(R.string.biometric_prompt_title)
            val subtitle = promptSubtitle?.takeIf { it.isNotBlank() }
                ?: activity.getString(R.string.biometric_prompt_subtitle)
            val cancelLabel = negativeText?.takeIf { it.isNotBlank() }
                ?: activity.getString(R.string.biometric_prompt_negative)

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle(title)
                .setSubtitle(subtitle)
                .setNegativeButtonText(cancelLabel)
                .setAllowedAuthenticators(ALLOWED_AUTHENTICATORS)
                .setConfirmationRequired(false)
                .build()

            prompt.authenticate(promptInfo)
        }
    }
}

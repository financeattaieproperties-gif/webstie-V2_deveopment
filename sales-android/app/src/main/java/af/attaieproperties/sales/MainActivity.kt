package af.attaieproperties.sales

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.webkit.CookieManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import androidx.webkit.WebViewAssetLoader
import java.io.File

/**
 * Dedicated Android Activity for the Attaie Properties Sales Agent Workspace (/sales).
 *
 * - Loads the compiled Sales Agent bundle from app/src/main/assets/www/index.html via HTTPS WebViewAssetLoader
 * - Connects to the exact same backend (/staff-api/v1/*) with persistent session & CSRF cookies
 * - Bridges tel: and WhatsApp links to the native Android dialer
 * - Supports camera/gallery file uploads for Buyer 3x4 Portrait & Tazkira photos when closing a deal
 * - Handles hardware Back navigation across Sales CRM tabs (Leads, Follow-ups, Customers, Projects, Overview)
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var batteryBridge: DeviceBatteryBridge
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingCameraUri: Uri? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = filePathCallback ?: return@registerForActivityResult
        filePathCallback = null
        val capturedUri = pendingCameraUri
        pendingCameraUri = null

        if (result.resultCode == Activity.RESULT_OK) {
            val dataUri = result.data?.data
            val clipData = result.data?.clipData
            val uris = when {
                clipData != null -> Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                dataUri != null -> arrayOf(dataUri)
                capturedUri != null -> arrayOf(capturedUri)
                else -> null
            }
            callback.onReceiveValue(uris)
        } else {
            callback.onReceiveValue(null)
        }
    }

    private fun createCameraCaptureIntent(): Intent? {
        val hasCamera = packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)
        if (!hasCamera) return null
        val hasCameraPerm = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
        if (!hasCameraPerm) return null

        val captureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        if (captureIntent.resolveActivity(packageManager) == null) return null

        return try {
            val capturesDir = File(cacheDir, "captures").apply { mkdirs() }
            val photoFile = File.createTempFile("buyer_doc_", ".jpg", capturesDir)
            val uri = FileProvider.getUriForFile(
                this,
                "${BuildConfig.APPLICATION_ID}.fileprovider",
                photoFile
            )
            pendingCameraUri = uri
            captureIntent.putExtra(MediaStore.EXTRA_OUTPUT, uri)
            captureIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            captureIntent
        } catch (_: Exception) {
            pendingCameraUri = null
            null
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        swipeRefresh = SwipeRefreshLayout(this).apply {
            setColorSchemeColors(0xFF0F172A.toInt())
            setProgressBackgroundColorSchemeColor(0xFFFFFFFF.toInt())
        }
        webView = WebView(this)
        val biometricBridge = BiometricAuthBridge(this, webView)
        batteryBridge = DeviceBatteryBridge(applicationContext, webView)
        webView.addJavascriptInterface(biometricBridge, "AttaieBiometric")
        webView.addJavascriptInterface(batteryBridge, "AttaieBattery")
        swipeRefresh.addView(webView)
        setContentView(swipeRefresh)

        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("sales.attaieproperties.com")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            userAgentString = "$userAgentString AttaieSalesAndroid/2.0"
        }

        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url.toString()
                // Open tel:, mailto:, and WhatsApp links in native Android apps
                if (
                    url.startsWith("tel:") ||
                    url.startsWith("mailto:") ||
                    url.startsWith("whatsapp:") ||
                    url.contains("wa.me/")
                ) {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, request.url))
                    } catch (_: ActivityNotFoundException) {
                        // Ignore gracefully if target app is unavailable
                    }
                    return true
                }
                return false
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                swipeRefresh.isRefreshing = false
                cookieManager.flush()
                // Ensure the shared backend URL and native runtime flag are injected for API and biometric calls
                val apiBase = BuildConfig.STAFF_API_BASE_URL
                view.evaluateJavascript(
                    "window.__ATTAIE_ANDROID_APP__ = true; window.__ATTAIE_STAFF_API_BASE_URL__ = ${org.json.JSONObject.quote(apiBase)};",
                    null
                )
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView,
                filePathCallback: ValueCallback<Array<Uri>>,
                fileChooserParams: FileChooserParams
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback
                pendingCameraUri = null
                return try {
                    val contentIntent = fileChooserParams.createIntent()
                    val cameraIntent = createCameraCaptureIntent()
                    val launchIntent = if (cameraIntent != null) {
                        Intent.createChooser(contentIntent, getString(R.string.app_name)).apply {
                            putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(cameraIntent))
                        }
                    } else {
                        contentIntent
                    }
                    fileChooserLauncher.launch(launchIntent)
                    true
                } catch (_: Exception) {
                    pendingCameraUri = null
                    this@MainActivity.filePathCallback = null
                    false
                }
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        // Load the bundled Sales Agent Workspace over virtual HTTPS origin
        webView.loadUrl("https://sales.attaieproperties.com/assets/www/index.html")
    }

    override fun onResume() {
        super.onResume()
        if (::batteryBridge.isInitialized) {
            batteryBridge.startObserving()
        }
    }

    override fun onPause() {
        super.onPause()
        if (::batteryBridge.isInitialized) {
            batteryBridge.stopObserving()
        }
        CookieManager.getInstance().flush()
    }
}

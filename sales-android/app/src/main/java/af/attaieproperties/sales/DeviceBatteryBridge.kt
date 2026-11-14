package af.attaieproperties.sales

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.content.ContextCompat
import org.json.JSONObject

/**
 * Exposes real-time Android hardware battery level and charging state
 * to the Sales Agent WebView header (AttaieBattery JavascriptInterface).
 */
class DeviceBatteryBridge(
    private val context: Context,
    private val webView: WebView
) {
    private var receiverRegistered = false

    private val batteryReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context?, intent: Intent?) {
            val payload = readBatteryJson(intent)
            webView.post {
                val url = webView.url ?: return@post
                if (!url.startsWith("https://sales.attaieproperties.com/")) return@post
                webView.evaluateJavascript(
                    "window.__attaieBatteryUpdate && window.__attaieBatteryUpdate(${payload});",
                    null
                )
            }
        }
    }

    private fun readBatteryJson(intent: Intent?): JSONObject {
        val statusIntent = intent ?: ContextCompat.registerReceiver(
            context,
            null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED),
            ContextCompat.RECEIVER_NOT_EXPORTED
        )
        val level = statusIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = statusIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val status = statusIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1

        val fraction = if (level >= 0 && scale > 0) {
            (level.toDouble() / scale.toDouble()).coerceIn(0.0, 1.0)
        } else {
            val manager = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
            val pct = manager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: -1
            if (pct in 0..100) pct / 100.0 else -1.0
        }

        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
            status == BatteryManager.BATTERY_STATUS_FULL

        return JSONObject().apply {
            put("available", fraction >= 0.0)
            put("level", if (fraction >= 0.0) fraction else 1.0)
            put("charging", isCharging)
        }
    }

    @JavascriptInterface
    fun getBatteryStatusJson(): String {
        return readBatteryJson(null).toString()
    }

    fun startObserving() {
        if (receiverRegistered) return
        ContextCompat.registerReceiver(
            context,
            batteryReceiver,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED),
            ContextCompat.RECEIVER_NOT_EXPORTED
        )
        receiverRegistered = true
    }

    fun stopObserving() {
        if (!receiverRegistered) return
        try {
            context.unregisterReceiver(batteryReceiver)
        } catch (_: IllegalArgumentException) {
            // Already unregistered
        }
        receiverRegistered = false
    }
}

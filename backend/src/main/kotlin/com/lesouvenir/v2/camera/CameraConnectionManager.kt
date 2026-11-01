package com.lesouvenir.v2.camera

import com.lesouvenir.v2.camera.demo.DemoCameraAdapter
import com.lesouvenir.v2.camera.real.CameraController
import java.nio.file.Path
import java.util.Base64
import java.util.concurrent.atomic.AtomicBoolean

enum class CameraConnectionState { DISCONNECTED, DISCOVERING, CONNECTING, CONNECTED, LIVE_VIEW_READY, RECONNECTING, ERROR }

class CameraConnectionManager(
    val hardwareController: CameraController,
    val mockAdapter: DemoCameraAdapter = DemoCameraAdapter(),
    val checkIntervalMillis: Long = 2000L,
    startMonitor: Boolean = true,
) : AutoCloseable {
    @Volatile var connectionState: CameraConnectionState = CameraConnectionState.DISCONNECTED
        private set
    @Volatile var lastError: String? = null
        private set
    @Volatile var lastSeenTimestamp: Long = 0L
        private set
    @Volatile var consecutiveNullFrames: Int = 0
        private set
    private val active = AtomicBoolean(true)
    private val monitor: Thread? = if (startMonitor) Thread({ monitorLoop() }, "v2-camera-monitor").apply {
        isDaemon = true
        start()
    } else null

    init { require(checkIntervalMillis > 0) }

    private fun monitorLoop() {
        while (active.get()) {
            try {
                when (connectionState) {
                    CameraConnectionState.DISCONNECTED, CameraConnectionState.RECONNECTING -> {
                        if (hardwareController.isHardwareConnected()) {
                            connectionState = CameraConnectionState.CONNECTED
                            lastError = null
                            lastSeenTimestamp = System.currentTimeMillis()
                        } else if (connectionState == CameraConnectionState.RECONNECTING) {
                            connectionState = CameraConnectionState.DISCONNECTED
                        }
                    }
                    CameraConnectionState.CONNECTED, CameraConnectionState.LIVE_VIEW_READY -> {
                        if (!hardwareController.isHardwareConnected()) connectionState = CameraConnectionState.RECONNECTING
                        else lastSeenTimestamp = System.currentTimeMillis()
                    }
                    else -> Unit
                }
            } catch (e: Exception) {
                lastError = e.message ?: e.javaClass.simpleName
                connectionState = CameraConnectionState.RECONNECTING
            }
            try { Thread.sleep(checkIntervalMillis) } catch (_: InterruptedException) { if (!active.get()) break }
        }
    }

    fun isHardwareConnected(): Boolean = hardwareController.isHardwareConnected()
    fun resolveCaptureMode(): String = if (isHardwareConnected()) "REAL" else "DEMO"

    fun startLiveView(captureMode: String, onFrame: (String) -> Unit) {
        when (captureMode) {
            "DEMO" -> mockAdapter.startPreview { bytes -> onFrame("data:image/jpeg;base64," + Base64.getEncoder().encodeToString(bytes)) }
            "REAL" -> {
                hardwareController.startLiveView(onFrame)
                connectionState = CameraConnectionState.LIVE_VIEW_READY
                lastError = null
            }
            else -> throw IllegalArgumentException("Unsupported camera capture mode: $captureMode")
        }
    }

    fun stopLiveView(captureMode: String) {
        runCatching { mockAdapter.stopPreview() }
        runCatching { hardwareController.stopLiveView() }
        if (connectionState == CameraConnectionState.LIVE_VIEW_READY) connectionState = CameraConnectionState.CONNECTED
    }

    fun capture(captureMode: String, outputDir: Path, shotIndex: Int, aspectRatio: Float): Path = when (captureMode) {
        "DEMO" -> mockAdapter.capture(outputDir, shotIndex, aspectRatio)
        "REAL" -> hardwareController.capturePhoto(outputDir, shotIndex, aspectRatio)
        else -> throw IllegalArgumentException("Unsupported camera capture mode: $captureMode")
    }

    fun getStatus(): Map<String, Any?> = mapOf(
        "connected" to runCatching { isHardwareConnected() }.getOrDefault(false),
        "state" to connectionState.name,
        "lastError" to lastError,
        "lastSeenTimestamp" to lastSeenTimestamp,
        "consecutiveNullFrames" to consecutiveNullFrames,
    )

    override fun close() {
        if (!active.compareAndSet(true, false)) return
        monitor?.interrupt()
        runCatching { monitor?.join(1000) }
        runCatching { mockAdapter.stopPreview() }
        runCatching { hardwareController.stopLiveView() }
        runCatching { hardwareController.close() }
        runCatching { mockAdapter.close() }
        connectionState = CameraConnectionState.DISCONNECTED
    }
}

package com.lesouvenir.v2.camera.legacy

import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.nio.file.LinkOption
import java.nio.file.Path
import java.util.concurrent.atomic.AtomicReference
import javax.imageio.ImageIO
import kotlin.math.abs

/** No permission is granted by constructing a port. Never wire to production until approved. */
class HardwareAuthorization(private val explicitlyApproved: Boolean = false) {
    fun requireApproval() = check(explicitlyApproved) { "Explicit hardware authorization required" }
}

/** Adapted from WebcamStillCaptureService.kt:54-70; retains V1's 16:9 crop semantics. */
fun BufferedImage.legacyCenterCropToAspect(targetAspectRatio: Float): BufferedImage {
    require(targetAspectRatio.isFinite() && targetAspectRatio > 0)
    val sourceAspectRatio = width.toFloat() / height.toFloat()
    if (abs(sourceAspectRatio - targetAspectRatio) < 0.01f) return this
    val cropWidth: Int
    val cropHeight: Int
    if (sourceAspectRatio > targetAspectRatio) {
        cropHeight = height
        cropWidth = (height * targetAspectRatio).toInt().coerceAtMost(width)
    } else {
        cropWidth = width
        cropHeight = (width / targetAspectRatio).toInt().coerceAtMost(height)
    }
    val left = ((width - cropWidth) / 2).coerceAtLeast(0)
    val top = ((height - cropHeight) / 2).coerceAtLeast(0)
    return getSubimage(left, top, cropWidth.coerceAtLeast(1), cropHeight.coerceAtLeast(1))
}

/** Bounded latest JPEG; no Beauty, and no full-resolution frame is sent to a bridge. */
class LatestLegacyPreview {
    private val frame = AtomicReference<ByteArray?>(null)
    fun publish(image: BufferedImage) {
        val scale = minOf(1.0, 640.0 / image.width, 640.0 / image.height)
        val thumb = BufferedImage(maxOf(1, (image.width * scale).toInt()), maxOf(1, (image.height * scale).toInt()), BufferedImage.TYPE_INT_RGB)
        val g = thumb.createGraphics()
        try { g.drawImage(image, 0, 0, thumb.width, thumb.height, null) } finally { g.dispose() }
        val jpeg = ByteArrayOutputStream().use { check(ImageIO.write(thumb, "jpeg", it)); it.toByteArray() }
        check(jpeg.size <= 384 * 1024) { "Preview exceeds frame budget" }
        frame.set(jpeg)
    }
    fun latest(): ByteArray? = frame.get()?.copyOf()
    fun clear() = frame.set(null)
}

/** Actual Canon class resolution occurs only after permission; no initialization at construction. */
class LegacyCanonPort(private val authorization: HardwareAuthorization) {
    private var camera: Any? = null
    @Synchronized fun open(): Boolean {
        authorization.requireApproval()
        check(camera == null)
        // V1 NativeEosCaptureService.kt:29,38; constructor itself initializes EDSDK.
        val type = Class.forName("edsdk.api.CanonCamera")
        val instance = type.getDeclaredConstructor().newInstance()
        camera = instance
        return type.getMethod("openSession").invoke(instance) as Boolean
    }
    @Synchronized fun beginLiveView(): Boolean {
        authorization.requireApproval()
        val instance = checkNotNull(camera)
        return instance.javaClass.getMethod("beginLiveView").invoke(instance) as Boolean
    }
    @Synchronized fun downloadLiveView(): BufferedImage? {
        authorization.requireApproval()
        val instance = checkNotNull(camera)
        return instance.javaClass.getMethod("downloadLiveView").invoke(instance) as BufferedImage?
    }
    @Synchronized fun close() {
        authorization.requireApproval()
        val instance = camera ?: return
        try { instance.javaClass.getMethod("closeSession").invoke(instance) } finally { camera = null }
    }
}

/** Port of V1 selection preference; enumeration is deliberately deferred behind the gate. */
class LegacyWebcamPort(private val authorization: HardwareAuthorization) {
    fun cameraNames(): List<String> {
        authorization.requireApproval()
        val type = Class.forName("com.github.sarxos.webcam.Webcam")
        val devices = type.getMethod("getWebcams").invoke(null) as List<*>
        return devices.map { checkNotNull(it).javaClass.getMethod("getName").invoke(it) as String }
            .sortedByDescending { it.contains("DroidCam", ignoreCase = true) }
    }
}

/** The input must be a dedicated pre-existing V2 directory. Never consumes or deletes input. */
class LegacyHotFolderPort(private val authorization: HardwareAuthorization, workspace: Path, input: Path) {
    private val root = workspace.toRealPath()
    private val folder = input.toAbsolutePath().normalize()
    init {
        require(root.fileName.toString().equals("PhotoboothDesktop_v2", true))
        require(folder.startsWith(root) && folder != root)
        var part = root
        for (component in root.relativize(folder)) {
            part = part.resolve(component)
            require(!Files.isSymbolicLink(part))
        }
        require(Files.isDirectory(folder, LinkOption.NOFOLLOW_LINKS) && folder.toRealPath() == folder)
    }
    /** V1 snapshots names and waits for new .jpg; callers own bounded polling and readiness. */
    fun snapshotNames(): Set<String> {
        authorization.requireApproval()
        return Files.list(folder).use { stream -> stream.map { it.fileName.toString() }.toList().toSet() }
    }
    fun candidates(previous: Set<String>): List<Path> {
        authorization.requireApproval()
        return Files.list(folder).use { stream -> stream.filter {
            it.fileName.toString() !in previous && it.fileName.toString().endsWith(".jpg", ignoreCase = true) && Files.isRegularFile(it, LinkOption.NOFOLLOW_LINKS)
        }.sorted().toList() }
    }
}

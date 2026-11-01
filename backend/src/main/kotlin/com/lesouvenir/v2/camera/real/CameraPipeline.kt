package com.lesouvenir.v2.camera.real

import com.lesouvenir.v2.camera.legacy.HardwareAuthorization
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.imageio.ImageIO

enum class CameraMode { CANON_DSLR, WEBCAM, HOT_FOLDER }
data class CameraDescriptor(val id: String, val name: String, val mode: CameraMode, val connected: Boolean)

/** Serial command executor and bounded latest-frame transport for hardware implementations. */
interface CameraDevice : AutoCloseable {
    fun isConnected(): Boolean
    fun startPreview(onFrame: (ByteArray) -> Unit)
    fun stopPreview()
    fun capture(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path
}
interface LiveViewStream { fun start(onFrame: (ByteArray) -> Unit); fun stop() }
interface CameraController : AutoCloseable {
    fun getAvailableCameras(): List<CameraDescriptor>
    fun setMode(mode: CameraMode)
    fun isHardwareConnected(): Boolean
    fun startLiveView(onFrame: (String) -> Unit)
    fun stopLiveView()
    fun capturePhoto(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path
}

/** No synthetic fallback: adapters fail closed when unavailable or unapproved. */
class CameraManager(
    private val authorization: HardwareAuthorization,
    private val discover: (CameraMode) -> List<CameraDevice>,
) : CameraController {
    private val executor = Executors.newSingleThreadExecutor { r -> Thread(r, "v2-camera-commands").apply { isDaemon = true } }
    @Volatile private var mode: CameraMode? = null
    @Volatile private var device: CameraDevice? = null
    private val gate = Any()

    override fun getAvailableCameras(): List<CameraDescriptor> {
        authorization.requireApproval()
        return CameraMode.entries.flatMap { m -> discover(m).mapIndexed { i, d -> CameraDescriptor("${m.name.lowercase()}-$i", m.name, m, d.isConnected()) } }
    }
    override fun setMode(mode: CameraMode) = synchronized(gate) {
        authorization.requireApproval(); stopLiveView()
        device?.close(); device = null
        val selected = discover(mode).firstOrNull { it.isConnected() }
            ?: throw IllegalStateException("No connected ${mode.name} camera; real capture is unavailable")
        this.mode = mode; device = selected
    }
    override fun isHardwareConnected(): Boolean = device?.isConnected() == true
    override fun startLiveView(onFrame: (String) -> Unit) {
        authorization.requireApproval()
        val d = device?.takeIf { it.isConnected() } ?: throw IllegalStateException("Selected camera is disconnected")
        d.startPreview { bytes -> onFrame("data:image/jpeg;base64," + java.util.Base64.getEncoder().encodeToString(bytes)) }
    }
    override fun stopLiveView() { device?.stopPreview() }
    override fun capturePhoto(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path {
        authorization.requireApproval(); require(shotIndex >= 0 && aspectRatio.isFinite() && aspectRatio > 0)
        val d = device?.takeIf { it.isConnected() } ?: throw IllegalStateException("Selected camera is disconnected; no synthetic capture will be substituted")
        val f = executor.submit<Path> { d.capture(outputDir, shotIndex, aspectRatio) }
        return try { f.get(90, TimeUnit.SECONDS) } catch (e: Exception) { f.cancel(true); throw IllegalStateException("Camera capture failed or timed out", e) }
    }
    override fun close() { stopLiveView(); device?.close(); device = null; executor.shutdownNow() }
}

/** Webcam adapter is initialized only after explicit authorization and mode selection. */
class WebcamCameraAdapter(private val authorization: HardwareAuthorization) : CameraDevice {
    @Volatile private var webcam: com.github.sarxos.webcam.Webcam? = null
    @Volatile private var running = false
    @Volatile private var previewThread: Thread? = null
    override fun isConnected() = webcam?.isOpen == true
    fun open(): Boolean {
        authorization.requireApproval()
        val candidates = com.github.sarxos.webcam.Webcam.getWebcams()
        val chosen = candidates.sortedByDescending { it.name.contains("DroidCam", true) }.firstOrNull() ?: return false
        if (!chosen.open()) return false
        webcam = chosen; return true
    }
    override fun startPreview(onFrame: (ByteArray) -> Unit) {
        authorization.requireApproval(); check(isConnected()) { "Webcam is not connected" }; running = true
        if (previewThread?.isAlive == true) return
        previewThread = Thread({ while (running && isConnected()) { try { webcam?.image?.let { onFrame(jpeg(it)) }; Thread.sleep(33) } catch (_: InterruptedException) { Thread.currentThread().interrupt(); break } } }, "v2-webcam-preview").apply { isDaemon = true; start() }
    }
    override fun stopPreview() { running = false }
    override fun capture(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path {
        authorization.requireApproval(); val image = webcam?.image ?: throw IllegalStateException("Webcam unavailable")
        Files.createDirectories(outputDir); val target = outputDir.resolve("original-shot-$shotIndex.jpg")
        Files.write(target, jpeg(mirror(crop(image, aspectRatio)))); return target
    }
    override fun close() { running = false; webcam?.close(); webcam = null }
    private fun jpeg(i: BufferedImage) = ByteArrayOutputStream().use { check(ImageIO.write(i, "jpeg", it)); it.toByteArray() }
    private fun crop(i: BufferedImage, ratio: Float): BufferedImage { val w=if(i.width.toFloat()/i.height>ratio)(i.height*ratio).toInt() else i.width; val h=if(i.width.toFloat()/i.height>ratio)i.height else (i.width/ratio).toInt(); return i.getSubimage((i.width-w)/2,(i.height-h)/2,w,h) }
    private fun mirror(i: BufferedImage): BufferedImage { val o=BufferedImage(i.width,i.height,BufferedImage.TYPE_INT_RGB); val g=o.createGraphics(); try { g.drawImage(i,i.width,0,-i.width,i.height,null) } finally { g.dispose() }; return o }
}

/** Hot-folder adapter requires an explicit V2-owned input directory; it never deletes source files. */
class HotFolderCameraAdapter(
    private val authorization: HardwareAuthorization,
    private val inputDir: Path,
    private val timeoutMillis: Long = 15_000,
) : CameraDevice {
    @Volatile private var waiting = false
    init { require(timeoutMillis in 1..60_000); require(Files.isDirectory(inputDir) && inputDir.toRealPath() == inputDir.toAbsolutePath().normalize()) }
    override fun isConnected() = Files.isDirectory(inputDir)
    override fun startPreview(onFrame: (ByteArray) -> Unit) { authorization.requireApproval() }
    override fun stopPreview() {}
    override fun capture(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path {
        authorization.requireApproval(); check(!waiting) { "Hot-folder capture already active" }; waiting = true
        try {
            val before = Files.list(inputDir).use { it.map { p -> p.fileName.toString() }.toList().toSet() }
            val deadline = System.nanoTime() + timeoutMillis * 1_000_000
            while (System.nanoTime() < deadline && !Thread.currentThread().isInterrupted) {
                authorization.requireApproval()
                val file = Files.list(inputDir).use { it.filter { p -> p.fileName.toString() !in before && p.fileName.toString().endsWith(".jpg", true) && Files.isRegularFile(p) }.sorted().findFirst().orElse(null) }
                if (file != null) {
                    val size = Files.size(file); Thread.sleep(150)
                    if (Files.size(file) == size && size > 0) {
                        val image = ImageIO.read(file.toFile()) ?: continue
                        Files.createDirectories(outputDir); val target = outputDir.resolve("original-shot-$shotIndex.jpg")
                        Files.write(target, jpeg(mirror(crop(image, aspectRatio)))); return target
                    }
                }
                Thread.sleep(100)
            }
            throw IllegalStateException("No ready JPEG arrived in hot folder within ${timeoutMillis}ms")
        } finally { waiting = false }
    }
    override fun close() {}
    private fun jpeg(i: BufferedImage) = ByteArrayOutputStream().use { check(ImageIO.write(i, "jpeg", it)); it.toByteArray() }
    private fun crop(i: BufferedImage, ratio: Float): BufferedImage { val w=if(i.width.toFloat()/i.height>ratio)(i.height*ratio).toInt() else i.width; val h=if(i.width.toFloat()/i.height>ratio)i.height else (i.width/ratio).toInt(); return i.getSubimage((i.width-w)/2,(i.height-h)/2,w,h) }
    private fun mirror(i: BufferedImage): BufferedImage { val o=BufferedImage(i.width,i.height,BufferedImage.TYPE_INT_RGB); val g=o.createGraphics(); try { g.drawImage(i,i.width,0,-i.width,i.height,null) } finally { g.dispose() }; return o }
}

/** Canon SDK adapter deliberately loads native code only on explicit open. */
class CanonCameraAdapter(
    private val authorization: HardwareAuthorization,
    private val autoReconnect: Boolean = true,
) : CameraDevice {
    @Volatile private var camera: Any? = null
    @Volatile private var connected = false
    @Volatile private var preview = false
    @Volatile private var closed = false
    private val lock = Any()
    private val reconnect = Executors.newSingleThreadScheduledExecutor { r -> Thread(r, "v2-canon-reconnect").apply { isDaemon = true } }
    init { if (autoReconnect) reconnect.scheduleWithFixedDelay({ if (!closed) runCatching { if (!connected) open() else property("getApertureValue") } }, 0, 2, TimeUnit.SECONDS) }
    @Synchronized private fun open(): Boolean {
        authorization.requireApproval()
        return try { val base = Path.of(System.getProperty("user.dir"), "EDSDK_64"); System.setProperty("jna.library.path", base.toAbsolutePath().toString() + ";" + System.getProperty("jna.library.path", "")); val cls=Class.forName("edsdk.api.CanonCamera"); val c=cls.getDeclaredConstructor().newInstance(); camera=c; connected=cls.getMethod("openSession").invoke(c) as Boolean; connected } catch (_: Throwable) { connected=false; false }
    }
    override fun isConnected() = connected
    override fun startPreview(onFrame: (ByteArray) -> Unit) {
        authorization.requireApproval(); check(isConnected()) { "Canon camera is disconnected" }; preview=true
        Thread({
            while (preview && connected) {
                try {
                    val image = synchronized(lock) {
                        val current = camera
                        if (current == null) null else current.javaClass.getMethod("downloadLiveView").invoke(current) as? BufferedImage
                    }
                    if (image != null) {
                        val width = minOf(640, image.width)
                        val height = (image.height.toDouble() * minOf(1.0, 640.0 / image.width)).toInt().coerceAtLeast(1)
                        val thumb = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)
                        val graphics = thumb.createGraphics()
                        try { graphics.drawImage(image, 0, 0, width, height, null) } finally { graphics.dispose() }
                        onFrame(ByteArrayOutputStream().use { output ->
                            check(ImageIO.write(thumb, "jpeg", output))
                            output.toByteArray()
                        })
                        image.flush()
                    }
                    Thread.sleep(33)
                } catch (_: Exception) { connected = false }
            }
        }, "v2-canon-preview").apply { isDaemon = true; start() }
    }
    override fun stopPreview() { preview=false }
    override fun capture(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path = synchronized(lock) {
        authorization.requireApproval(); check(connected && camera != null) { "Canon camera disconnected; real capture unavailable" }
        try { Files.createDirectories(outputDir); val c=camera!!; val command=Class.forName("edsdk.api.commands.SafeShootCommand").getConstructor(Class.forName("edsdk.utils.CanonConstants\$EdsSaveTo"),Int::class.javaPrimitiveType).newInstance(Class.forName("edsdk.utils.CanonConstants\$EdsSaveTo").getField("kEdsSaveTo_Host").get(null),3); val photos=c.javaClass.getMethod("execute",Class.forName("edsdk.api.CanonCommand")).invoke(c,command); val files=photos.javaClass.getMethod("get").invoke(photos) as? Array<*> ?: error("Canon returned no downloaded image"); val source=(files.lastOrNull() as? java.io.File)?.toPath() ?: error("Canon returned no downloaded image"); val image=ImageIO.read(source.toFile()) ?: error("Canon image is unreadable"); val out=BufferedImage(image.width,image.height,BufferedImage.TYPE_INT_RGB); val g=out.createGraphics(); try { g.scale(-1.0,1.0);g.drawImage(image,-image.width,0,null) } finally {g.dispose()}; val target=outputDir.resolve("original-shot-$shotIndex.jpg"); check(ImageIO.write(out,"jpeg",target.toFile())); target } catch(e: Exception) { connected=false; throw IllegalStateException("Canon capture failed: ${e.message}",e) }
    }
    private fun property(method: String) { camera?.javaClass?.getMethod(method)?.invoke(camera) }
    override fun close() { closed=true; preview=false; reconnect.shutdownNow(); synchronized(lock) { runCatching { camera?.javaClass?.getMethod("closeSession")?.invoke(camera) }; camera=null;connected=false } }
}

package com.lesouvenir.v2.camera.legacy

import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.imageio.ImageIO
import kotlin.test.*

class IsolatedHotFolderTest {
    private val root = Path.of("").toAbsolutePath().let { if (it.fileName.toString() == "backend") it.parent else it }
    private fun fixture(test: (Path, Path) -> Unit) {
        val input = Files.createTempDirectory(root, "synthetic-hotfolder-")
        val output = Files.createTempDirectory(root, "synthetic-sessions-")
        try { test(input, output) } finally {
            for (dir in listOf(input, output)) {
                Files.newDirectoryStream(dir).use { it.forEach(Files::deleteIfExists) }
                Files.deleteIfExists(dir)
            }
        }
    }
    private fun jpeg(color: Int): ByteArray {
        val image = BufferedImage(60, 40, BufferedImage.TYPE_INT_RGB)
        val g = image.createGraphics()
        try { g.color = java.awt.Color(color); g.fillRect(0, 0, image.width, image.height) } finally { g.dispose() }
        return ByteArrayOutputStream().use { check(ImageIO.write(image, "jpeg", it)); it.toByteArray() }
    }
    @Test fun partialReadinessOrderingDuplicatesAndLateFiles() = fixture { input, output ->
        val camera = IsolatedHotFolder(HardwareAuthorization(true), root, input, output)
        val pool = Executors.newSingleThreadExecutor()
        try {
            val first = camera.beginShot("session", "one")
            val a = jpeg(0xff0000); val b = jpeg(0x00ff00)
            Files.write(input.resolve("a.jpg"), a.copyOf(a.size / 2))
            val future = pool.submit<Path?> { first.await(3000, 30) }
            Thread.sleep(160)
            assertFalse(future.isDone)
            Files.write(input.resolve("b.jpg"), b)
            Files.write(input.resolve("a.jpg"), a)
            val result = assertNotNull(future.get(3, TimeUnit.SECONDS))
            assertContentEquals(a, Files.readAllBytes(result))
            assertNotNull(ImageIO.read(result.toFile()))
            val second = camera.beginShot("session", "two")
            Files.write(input.resolve("copy.jpg"), a)
            assertNull(second.await(250, 30))
            // A file present before the next shot (including a late arrival) is not eligible.
            Files.write(input.resolve("late.jpg"), b)
            val third = camera.beginShot("session", "three")
            Files.write(input.resolve("new.jpg"), b)
            assertContentEquals(b, Files.readAllBytes(assertNotNull(third.await(1000, 30))))
            assertContentEquals(a, Files.readAllBytes(input.resolve("a.jpg")))
        } finally { pool.shutdownNow() }
    }
    @Test fun denialCancelTimeoutAndPaths() = fixture { input, output ->
        val denied = IsolatedHotFolder(HardwareAuthorization(), root, input, output)
        assertFailsWith<IllegalStateException> { denied.beginShot("s", "a") }
        assertFailsWith<IllegalArgumentException> { IsolatedHotFolder(HardwareAuthorization(true), root, root.parent, output) }
        val camera = IsolatedHotFolder(HardwareAuthorization(true), root, input, output)
        val cancelled = camera.beginShot("s", "cancel")
        assertNull(cancelled.await(100, 10) { true })
        assertNull(camera.beginShot("s", "timeout").await(80, 10))
        val shot = camera.beginShot("s", "repeat")
        Files.write(input.resolve("x.jpg"), jpeg(1))
        val original = assertNotNull(shot.await(1000, 20))
        val bytes = Files.readAllBytes(original)
        val retry = camera.beginShot("s", "repeat")
        Files.write(input.resolve("y.jpg"), jpeg(0xffffff))
        assertFails { retry.await(1000, 20) }
        assertContentEquals(bytes, Files.readAllBytes(original))
    }
}

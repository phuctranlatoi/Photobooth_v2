package com.lesouvenir.v2.camera.legacy

import java.awt.image.BufferedImage
import java.nio.file.Files
import java.nio.file.Path
import javax.imageio.ImageIO
import kotlin.test.*

class LegacyCameraPortTest {
    private val workspace = Path.of("").toAbsolutePath().let { if (it.fileName.toString() == "backend") it.parent else it }
    @Test fun deniedBeforeNativeResolutionAndFilesystemEnumeration() {
        val denied = HardwareAuthorization()
        assertFailsWith<IllegalStateException> { LegacyCanonPort(denied).open() }
        assertFailsWith<IllegalStateException> { LegacyWebcamPort(denied).cameraNames() }
        val folder = Files.createTempDirectory(workspace, "legacy-test-")
        try {
            val hotFolder = LegacyHotFolderPort(denied, workspace, folder)
            assertFailsWith<IllegalStateException> { hotFolder.snapshotNames() }
            assertFailsWith<IllegalStateException> { hotFolder.candidates(emptySet()) }
            assertFailsWith<IllegalArgumentException> { LegacyHotFolderPort(denied, workspace, workspace.parent) }
            assertFailsWith<IllegalStateException> { LegacyOriginalStore(workspace).retain(denied, folder.resolve("missing"), folder, "one") }
        } finally { Files.deleteIfExists(folder) }
    }
    @Test fun cropAndBoundedPreview() {
        val image = BufferedImage(800, 800, BufferedImage.TYPE_INT_RGB)
        val cropped = image.legacyCenterCropToAspect(16f / 9f)
        assertEquals(800, cropped.width)
        assertEquals(450, cropped.height)
        val preview = LatestLegacyPreview()
        preview.publish(cropped)
        val bytes = assertNotNull(preview.latest())
        assertTrue(bytes.size <= 384 * 1024)
        assertTrue(assertNotNull(ImageIO.read(bytes.inputStream())).width <= 640)
        bytes.fill(0)
        assertNotNull(ImageIO.read(assertNotNull(preview.latest()).inputStream()))
    }
}

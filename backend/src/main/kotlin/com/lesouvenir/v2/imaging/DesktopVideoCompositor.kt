package com.lesouvenir.v2.imaging

import com.lesouvenir.v2.foundation.LayoutMode
import com.lesouvenir.v2.integrations.CapturedMoment
import java.awt.Rectangle
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.TimeUnit
import kotlin.math.roundToInt

/** V1 canvas/slot and encoding settings; missing video inputs loop their saved still for three seconds. */
class DesktopVideoCompositor(private val workspace: Path) {
    fun createCompositeVideo(layout: LayoutMode, frame: FramePack, selectedMoments: List<CapturedMoment>, outputDir: Path, sessionId: String): Path? {
        val frameFile = frame.customImagePath ?: workspace.resolve("data/frames").resolve(frame.id).resolve("frame.png")
        if (!Files.isRegularFile(frameFile) || selectedMoments.size < layout.selectCount || layout.selectCount < 1) return null
        val strip = layout.printSizeLabel.contains("5x15", true) || layout.printSizeLabel.contains("5 x 15", true)
        val wide = !strip && (layout.printSizeLabel.contains("15x10", true) || layout.printSizeLabel.contains("15 x 10", true))
        val width = if (strip) 592 else if (wide) 1790 else 1184
        val height = if (wide) 1184 else 1790
        val slots = computeSlots(layout, width, height)
        if (slots.size < layout.selectCount || slots.take(layout.selectCount).any { it.width < 2 || it.height < 2 }) return null
        val executable = listOfNotNull(workspace.resolve("bin/ffmpeg.exe"),
            System.getenv("LOCALAPPDATA")?.let { Path.of(it).resolve("Microsoft/WinGet/Links/ffmpeg.exe") })
            .firstOrNull { Files.isRegularFile(it) }?.toAbsolutePath()?.toString() ?: "ffmpeg"
        val cmd = mutableListOf(executable, "-y")
        selectedMoments.take(layout.selectCount).forEach { moment ->
            val video = moment.videoPath?.takeIf { Files.isRegularFile(it) }
            if (video != null) cmd += listOf("-i", video.toAbsolutePath().toString())
            else {
                val photo = moment.photoPath?.takeIf { Files.isRegularFile(it) } ?: return null
                cmd += listOf("-loop", "1", "-framerate", "15", "-t", "3", "-i", photo.toAbsolutePath().toString())
            }
        }
        cmd += listOf("-loop", "1", "-i", frameFile.toAbsolutePath().toString())
        val filter = StringBuilder()
        slots.take(layout.selectCount).forEachIndexed { i, slot ->
            val w = slot.width - slot.width % 2
            val h = slot.height - slot.height % 2
            filter.append("[$i:v]scale=$w:$h:force_original_aspect_ratio=increase,crop=$w:$h,setsar=1[v$i];")
        }
        filter.append("color=c=white:s=${width}x${height}:d=15[bg];")
        var previous = "bg"
        slots.take(layout.selectCount).forEachIndexed { i, slot ->
            val next = "bg${i + 1}"
            filter.append("[$previous][v$i]overlay=${slot.x}:${slot.y}:shortest=1[$next];")
            previous = next
        }
        filter.append("[${layout.selectCount}:v]scale=$width:$height[scaled_frame];")
        filter.append("[$previous][scaled_frame]overlay=0:0:shortest=1,scale='trunc(iw*1080/ih/2)*2':1080,format=yuv420p[out]")
        Files.createDirectories(outputDir)
        val output = outputDir.resolve("final_video_$sessionId.mp4")
        cmd += listOf("-filter_complex", filter.toString(), "-map", "[out]", "-c:v", "libx264",
            "-profile:v", "main", "-level", "3.1", "-preset", "fast", "-crf", "23",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", output.toAbsolutePath().toString())
        return try {
            val process = ProcessBuilder(cmd).redirectErrorStream(true).start()
            val drainer = Thread({ process.inputStream.use { it.copyTo(java.io.OutputStream.nullOutputStream()) } }, "v2-ffmpeg-output").apply { isDaemon = true; start() }
            val completed = process.waitFor(120, TimeUnit.SECONDS)
            if (!completed) process.destroyForcibly()
            drainer.join(1000)
            output.takeIf { completed && process.exitValue() == 0 && Files.isRegularFile(it) && Files.size(it) > 0 }
                ?: run { Files.deleteIfExists(output); null }
        } catch (_: Exception) { Files.deleteIfExists(output); null }
    }

    private fun computeSlots(layout: LayoutMode, canvasWidth: Int, canvasHeight: Int): List<Rectangle> {
        if (layout.absoluteSlots.isNotEmpty()) return layout.absoluteSlots.map { slot -> Rectangle(
            (slot.x * canvasWidth).roundToInt(), (slot.y * canvasHeight).roundToInt(),
            (slot.width * canvasWidth).roundToInt(), (slot.height * canvasHeight).roundToInt()) }
        val width = canvasWidth.toFloat()
        val top = (width * layout.paddingTopRatio).roundToInt()
        val left = (width * layout.paddingLeftRatio).roundToInt()
        val right = (width * layout.paddingRightRatio).roundToInt()
        val gapX = (width * layout.gapHorizontalRatio).roundToInt()
        val gapY = (width * layout.gapVerticalRatio).roundToInt()
        val columns = layout.gridColumns.coerceAtLeast(1)
        val slotWidth = ((canvasWidth - left - right - gapX * (columns - 1)).toFloat() / columns).roundToInt().coerceAtLeast(1)
        val slotHeight = (slotWidth / layout.photoAspectRatio).roundToInt().coerceAtLeast(1)
        return List(layout.selectCount) { index -> Rectangle(left + index % columns * (slotWidth + gapX),
            top + index / columns * (slotHeight + gapY), slotWidth, slotHeight) }
    }
}

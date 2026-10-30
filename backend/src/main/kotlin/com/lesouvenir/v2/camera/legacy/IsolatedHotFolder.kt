package com.lesouvenir.v2.camera.legacy

import java.nio.file.Files
import java.nio.file.LinkOption
import java.nio.file.Path
import java.security.MessageDigest
import javax.imageio.ImageIO

/** Synthetic-fixture-only input. Construct only for a fresh, exclusively owned test directory. */
class IsolatedHotFolder(
    private val authorization: HardwareAuthorization,
    workspace: Path,
    input: Path,
    output: Path,
) {
    private val root = workspace.toRealPath().also { require(it.fileName.toString().equals("PhotoboothDesktop_v2", true)) }
    private val inputDir = safeDirectory(input)
    private val outputDir = safeDirectory(output)
    private val consumed = mutableSetOf<String>()
    private var active = false

    init {
        require(inputDir != outputDir && !inputDir.startsWith(outputDir) && !outputDir.startsWith(inputDir))
        require(inputDir.fileName.toString().startsWith("synthetic-hotfolder-"))
        require(outputDir.fileName.toString().startsWith("synthetic-sessions-"))
    }

    private fun safeDirectory(path: Path): Path {
        val dir = path.toAbsolutePath().normalize()
        require(dir.startsWith(root) && dir != root)
        var current = root
        for (part in root.relativize(dir)) { current = current.resolve(part); require(!Files.isSymbolicLink(current)) }
        require(Files.isDirectory(dir, LinkOption.NOFOLLOW_LINKS) && dir.toRealPath() == dir)
        return dir
    }

    /** Snapshot at shot start makes files from previous or timed-out shots ineligible. */
    @Synchronized fun beginShot(sessionId: String, shotId: String): Shot {
        authorization.requireApproval()
        require(sessionId.matches(Regex("[A-Za-z0-9_-]{1,64}")) && shotId.matches(Regex("[A-Za-z0-9_-]{1,64}")))
        check(!active) { "A shot is already active" }
        safeDirectory(inputDir); safeDirectory(outputDir)
        val existing = names()
        active = true
        return Shot(sessionId, shotId, existing)
    }

    private fun names(): Set<String> = Files.list(inputDir).use { s -> s.map { it.fileName.toString() }.toList().toSet() }

    inner class Shot internal constructor(val sessionId: String, val shotId: String, private val baseline: Set<String>) : AutoCloseable {
        private var closed = false
        private val observations = mutableMapOf<String, Pair<Long, java.nio.file.attribute.FileTime>>()

        /** V1 polls every 100ms up to 15s; this additionally verifies stability and JPEG decode. */
        fun await(timeoutMillis: Long, pollMillis: Long = 100, cancelled: () -> Boolean = { false }): Path? {
            require(timeoutMillis in 1..60_000 && pollMillis in 1..1000)
            val deadline = System.nanoTime() + timeoutMillis * 1_000_000
            try {
                while (System.nanoTime() < deadline) {
                    if (cancelled() || Thread.currentThread().isInterrupted) return null
                    authorization.requireApproval()
                    synchronized(this@IsolatedHotFolder) { check(!closed && active) }
                    safeDirectory(inputDir); safeDirectory(outputDir)
                    val candidates = Files.list(inputDir).use { s -> s.filter {
                        val name = it.fileName.toString()
                        name !in baseline && name !in consumed && name.endsWith(".jpg", true) && Files.isRegularFile(it, LinkOption.NOFOLLOW_LINKS)
                    }.sorted().toList() }
                    for (file in candidates) {
                        if (cancelled() || Thread.currentThread().isInterrupted || System.nanoTime() >= deadline) return null
                        val name = file.fileName.toString()
                        val attrs = try { Files.readAttributes(file, java.nio.file.attribute.BasicFileAttributes::class.java, LinkOption.NOFOLLOW_LINKS) } catch (_: java.io.IOException) { continue }
                        val signature = attrs.size() to attrs.lastModifiedTime()
                        if (attrs.size() !in 1..(32L * 1024 * 1024) || observations.put(name, signature) != signature) continue
                        // Snapshot bytes first; a mutation during reading invalidates this observation.
                        val bytes = try { Files.readAllBytes(file) } catch (_: java.io.IOException) { continue }
                        val after = try { Files.readAttributes(file, java.nio.file.attribute.BasicFileAttributes::class.java, LinkOption.NOFOLLOW_LINKS) } catch (_: java.io.IOException) { continue }
                        if (!after.isRegularFile || after.size() != signature.first || after.lastModifiedTime() != signature.second || bytes.size.toLong() != signature.first) continue
                        if (bytes.size < 4 || bytes[0] != 0xff.toByte() || bytes[1] != 0xd8.toByte() || bytes[bytes.lastIndex - 1] != 0xff.toByte() || bytes.last() != 0xd9.toByte()) continue
                        if (try { ImageIO.read(bytes.inputStream()) == null } catch (_: Exception) { true }) continue
                        val digest = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
                        if (digest in consumed) { consumed.add(name); continue }
                        if (cancelled() || Thread.currentThread().isInterrupted || System.nanoTime() >= deadline) return null
                        val target = outputDir.resolve("original-$sessionId-$shotId.jpg")
                        val temp = Files.createTempFile(outputDir, ".hotfolder-", ".tmp")
                        try { Files.write(temp, bytes); Files.createLink(target, temp) } finally { Files.deleteIfExists(temp) }
                        consumed.add(name); consumed.add(digest)
                        return target
                    }
                    val left = deadline - System.nanoTime()
                    if (left > 0) try { Thread.sleep(minOf(pollMillis, maxOf(1, left / 1_000_000))) } catch (_: InterruptedException) { Thread.currentThread().interrupt(); return null }
                }
                return null
            } finally { close() }
        }
        override fun close() { synchronized(this@IsolatedHotFolder) { if (!closed) { closed = true; active = false } } }
    }
}

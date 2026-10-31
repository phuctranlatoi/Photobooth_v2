package com.lesouvenir.v2.camera.legacy

import java.nio.file.Files
import java.nio.file.LinkOption
import java.nio.file.Path

/** Stages transferred camera bytes before any derivative processor receives them. */
class LegacyOriginalStore(workspace: Path) {
    private val root = workspace.toRealPath().also {
        require(it.fileName.toString().equals("PhotoboothDesktop_v2", true))
    }
    fun retain(authorization: HardwareAuthorization, transfer: Path, sessionDirectory: Path, shotId: String): Path {
        authorization.requireApproval()
        require(shotId.matches(Regex("[A-Za-z0-9_-]{1,64}")))
        val dir = sessionDirectory.toAbsolutePath().normalize()
        require(dir.startsWith(root) && dir != root)
        var p = root
        for (part in root.relativize(dir)) { p = p.resolve(part); require(!Files.isSymbolicLink(p)) }
        require(Files.isDirectory(dir, LinkOption.NOFOLLOW_LINKS) && dir.toRealPath() == dir)
        val target = dir.resolve("original-$shotId.jpg")
        val temp = Files.createTempFile(dir, ".original-", ".tmp")
        try {
            Files.copy(transfer, temp, java.nio.file.StandardCopyOption.REPLACE_EXISTING)
            Files.createLink(target, temp)
        } finally { Files.deleteIfExists(temp) }
        return target
    }
}

package com.lesouvenir.v2.imaging.facemask

import java.nio.file.Files
import java.nio.file.Path

internal object ModelPathResolver {
    fun resolve(name: String): Path {
        val packaged = System.getProperty("compose.application.resources.dir")
            ?.takeIf { it.isNotBlank() }
            ?.let { Path.of(it).resolve("models").resolve(name) }
        if (packaged != null && Files.isRegularFile(packaged)) return packaged
        val local = Path.of("app-resources", "models", name)
        if (Files.isRegularFile(local)) return local
        val fromRoot = Path.of("backend", "app-resources", "models", name)
        if (Files.isRegularFile(fromRoot)) return fromRoot
        return local
    }
}

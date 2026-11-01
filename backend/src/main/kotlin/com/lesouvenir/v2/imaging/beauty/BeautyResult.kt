package com.lesouvenir.v2.imaging.beauty

import java.awt.image.BufferedImage

data class BeautyResult(
    val image: BufferedImage,
    val status: String,
    val latencyMs: Double,
    val diagnostics: Map<String, Any> = emptyMap()
)

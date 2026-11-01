package com.lesouvenir.v2.imaging

import java.nio.file.Path

// V1 BoothModels fields needed by the compositor, without the Compose runtime.
typealias LayoutMode = com.lesouvenir.v2.foundation.LayoutMode

data class FramePack(
    val id: String,
    val title: String,
    val description: String,
    val accentColor: Long,
    val isCustom: Boolean = false,
    val isSpecial: Boolean = false,
    val specialEventName: String? = null,
    val customImagePath: Path? = null,
    val targetPrintSize: String? = null,
    val targetLayoutId: String? = null,
    val qrCodeX: Int? = null,
    val qrCodeY: Int? = null,
    val qrCodeSize: Int? = null
)

data class RenderResult(val finalImagePath: Path, val printImagePath: Path, val selectedCount: Int, val frameTitle: String)

data class EffectMode(
    val id: String,
    val title: String = id,
    val description: String = "",
    val accentColor: Long = 0L,
    val saturation: Float = 1f,
    val contrast: Float = 1f,
    val brightness: Float = 0f,
    val warmth: Float = 0f,
    val tint: Float = 0f,
    val isLut: Boolean = false,
    val lutPath: String? = null,
    val lutIntensity: Float = 1f,
    val enabled: Boolean = true,
    val isSystemDefault: Boolean = false
)

val DefaultEffectModes = listOf(EffectMode(id = "normal"))

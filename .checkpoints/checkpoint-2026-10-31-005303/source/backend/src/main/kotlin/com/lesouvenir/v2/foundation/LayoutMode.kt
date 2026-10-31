package com.lesouvenir.v2.foundation

import kotlin.math.ceil

// Extracted without algorithm changes from V1 BoothModels.kt:6-76.
enum class LayoutFamily { Row, Column, Grid }

data class LayoutSlot(val index: Int, val x: Float, val y: Float, val width: Float, val height: Float)

data class LayoutMode(
    val id: String,
    val title: String,
    val subtitle: String,
    val description: String,
    val family: LayoutFamily,
    val shotCount: Int,
    val selectCount: Int,
    val countdownSeconds: Int = 3,
    val basePrice: Long,
    val mediaLabel: String,
    val accentColor: Long,
    val absoluteSlots: List<LayoutSlot> = emptyList(),
    val gridColumns: Int = 1,
    val printSizeLabel: String = "15 x 10 cm",
    val printAspectRatio: Float = 15f / 10f,
    val paddingTopRatio: Float = 0.04f,
    val paddingBottomRatio: Float = 0.24f,
    val paddingHorizontalRatio: Float = 0.04f,
    val paddingLeftRatio: Float = paddingHorizontalRatio,
    val paddingRightRatio: Float = paddingHorizontalRatio,
    val gapRatio: Float = paddingTopRatio,
    val gapHorizontalRatio: Float = gapRatio,
    val gapVerticalRatio: Float = gapRatio,
    val qrCodeX: Int? = null,
    val qrCodeY: Int? = null,
    val qrCodeSize: Int? = null,
    val photoAspectRatio: Float = photoSlotAspectRatio(
        printAspectRatio, selectCount, gridColumns, paddingTopRatio,
        paddingBottomRatio, paddingHorizontalRatio, gapHorizontalRatio, gapVerticalRatio
    )
)

private fun photoSlotAspectRatio(
    printAspectRatio: Float, selectedPhotos: Int, gridColumns: Int,
    paddingTopRatio: Float, paddingBottomRatio: Float, paddingHorizontalRatio: Float,
    gapHorizontalRatio: Float, gapVerticalRatio: Float
): Float {
    val safeColumns = gridColumns.coerceAtLeast(1)
    val safePhotos = selectedPhotos.coerceAtLeast(1)
    val rows = ceil(safePhotos / safeColumns.toFloat()).toInt().coerceAtLeast(1)
    val slotWidthRatio = (1f - 2 * paddingHorizontalRatio - (safeColumns - 1) * gapHorizontalRatio) / safeColumns
    val availableHeightRatio = (1f / printAspectRatio) - paddingTopRatio - paddingBottomRatio - (rows - 1) * gapVerticalRatio
    val slotHeightRatio = availableHeightRatio / rows
    return (slotWidthRatio / slotHeightRatio).coerceAtLeast(0.2f)
}

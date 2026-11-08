package com.lesouvenir.v2.storage

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.lesouvenir.v2.imaging.EffectMode
import com.lesouvenir.v2.imaging.lut.CubeLutParser
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.util.UUID

class FilterStore(private val workspace: Path) {
    private val gson = Gson()
    private val file = workspace.resolve("data/config/filters.json")
    private val luts = workspace.resolve("data/filters/luts")
    private val defaults = listOf(
        EffectMode("normal", "Gốc", "Không áp dụng hiệu ứng"),
        EffectMode("black_white", "Trắng đen", "Đơn sắc hoài niệm", saturation = 0f, contrast = 1.1f),
        EffectMode("vintage", "Vintage Warm", "Tông ấm cổ điển", saturation = 0.9f, contrast = 1.05f, warmth = 0.2f)
    )
    @Synchronized fun loadFilters(): List<EffectMode> = if (!Files.isRegularFile(file)) defaults else
        gson.fromJson<List<EffectMode>>(Files.readString(file), object : TypeToken<List<EffectMode>>() {}.type)
            ?: throw IllegalArgumentException("Invalid filters JSON")

    @Synchronized fun saveFilter(effect: EffectMode) {
        require(effect.id.matches(Regex("[a-zA-Z0-9_-]{1,100}"))) { "Invalid filter ID" }
        require(!effect.isLut || effect.lutPath?.matches(Regex("[a-zA-Z0-9_-]+\\.cube")) == true &&
            Files.isRegularFile(luts.resolve(effect.lutPath))) { "Invalid LUT reference" }
        saveFilters(loadFilters().filterNot { it.id == effect.id } + effect)
    }
    @Synchronized fun saveFilters(effects: List<EffectMode>) {
        require(effects.map { it.id }.distinct().size == effects.size && effects.all { it.id.matches(Regex("[a-zA-Z0-9_-]{1,100}")) })
        Files.createDirectories(file.parent)
        val temp = Files.createTempFile(file.parent, ".filters-", ".json")
        try {
            Files.writeString(temp, gson.toJson(effects))
            Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING)
        } finally { Files.deleteIfExists(temp) }
    }
    @Synchronized fun deleteFilter(id: String): Boolean {
        val existing = loadFilters()
        if (existing.none { it.id == id }) return false
        saveFilters(existing.filterNot { it.id == id })
        return true
    }
    fun importLut(name: String, content: String): String {
        require(name.isNotBlank() && content.length <= 16 * 1024 * 1024) { "Invalid LUT" }
        CubeLutParser.parse(content)
        Files.createDirectories(luts)
        val filename = "${UUID.randomUUID()}.cube"
        Files.writeString(luts.resolve(filename), content)
        return filename
    }
}

package com.lesouvenir.v2.foundation

import kotlin.test.*

class FoundationTest {
    private fun layout(shots: Int, selected: Int, seconds: Int) = LayoutMode(
        "synthetic", "test", "", "", LayoutFamily.Grid, shots, selected, seconds,
        123L, "synthetic", 0L
    )

    @Test fun dynamicFieldsRemainIndependent() {
        for ((shots, selected, seconds) in listOf(Triple(2, 1, 7), Triple(9, 4, 2))) {
            val value = layout(shots, selected, seconds)
            assertEquals(shots, value.shotCount)
            assertEquals(selected, value.selectCount)
            assertEquals(seconds, value.countdownSeconds)
            assertEquals(seconds, (value.countdownSeconds downTo 1).count())
        }
    }

    @Test fun geometryDefaultAndCopySemanticsRemainLegacy() {
        val value = layout(4, 2, 8)
        val expected = .92f / ((1f / (15f / 10f) - .04f - .24f - .04f) / 2)
        assertEquals(expected, value.photoAspectRatio, .00001f)
        // Kotlin data-class copy retains computed field unless explicitly supplied.
        assertEquals(value.photoAspectRatio, value.copy(selectCount = 1).photoAspectRatio)
        assertEquals(8, value.copy(shotCount = 7).countdownSeconds)
    }

    @Test fun legacyStateMachineAllowsEveryPairAndResets() {
        val machine = SessionStateMachine()
        assertEquals(SessionState.IDLE, machine.currentState.value)
        for (from in SessionState.entries) for (to in SessionState.entries) {
            machine.transitionTo(from)
            machine.transitionTo(to)
            assertEquals(to, machine.currentState.value)
        }
        machine.reset()
        assertEquals(SessionState.IDLE, machine.currentState.value)
    }

    @Test fun pricingCharacterization() {
        assertEquals(110000L, PricingCalculator.calculatePrice("5 x 15 cm", 4).totalAmount)
        assertEquals(100000L, PricingCalculator.calculatePrice("15x10", 3).totalAmount)
        for ((size, quantities, prices) in listOf(
            Triple("5x15", listOf(2, 4, 6, 8), listOf(70000L, 110000L, 150000L, 190000L)),
            Triple("10x15", listOf(2, 3, 4, 5), listOf(70000L, 100000L, 130000L, 160000L)),
            Triple("15x10", listOf(2, 3, 4, 5), listOf(70000L, 100000L, 130000L, 160000L))
        )) {
            quantities.zip(prices).forEach { (quantity, price) ->
                assertEquals(price, PricingCalculator.calculatePrice(size, quantity).totalAmount)
            }
        }
        assertEquals("10x15", PricingCalculator.calculatePrice("15x10", 2).printSize)
        assertEquals(4, PricingCalculator.sanitizeQuantity("5x15", 3))
        assertEquals(52, PricingCalculator.sanitizeQuantity("5x15", 51)) // no upper clamp in V1
        assertEquals(25, PricingCalculator.allowedOptions("5x15").size)
        assertEquals(49, PricingCalculator.allowedOptions("10x15").size)
        assertEquals((2..50 step 2).toList(), PricingCalculator.allowedOptions("5x15"))
        assertEquals((2..50).toList(), PricingCalculator.allowedOptions("15x10"))
        assertFailsWith<IllegalArgumentException> { PricingCalculator.calculatePrice("5x15", 3) }
        assertFailsWith<IllegalArgumentException> { PricingCalculator.calculatePrice("square", 2) }
    }

    @Test fun simulationIsDeniedByDefaultAndNeverChangesLegacyState() {
        assertFailsWith<IllegalStateException> { SimulatorAuthorization().requireSyntheticCapturePermission() }
        SimulatorAuthorization(true).requireSyntheticCapturePermission()
    }
}

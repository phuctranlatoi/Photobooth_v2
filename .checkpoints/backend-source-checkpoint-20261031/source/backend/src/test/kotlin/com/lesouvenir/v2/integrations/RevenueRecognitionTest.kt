package com.lesouvenir.v2.integrations

import com.lesouvenir.v2.printing.legacy.PrintResult
import kotlin.test.*
import org.junit.jupiter.api.Test

class RevenueRecognitionTest {
    private val sale = SaleTransaction("s", "l", "Layout", "10x15", 2, 2, 0, "100", "0", "0", "100", "cash", 123)
    private fun evidence() = RecognitionEvidence(sale, "s", "s", "s", true, false, PrintResult.Submitted("fixture"))

    @Test fun fullPredicateTruthTable() {
        for (manual in listOf(false, true)) for (accepted in listOf(false, true)) for (same in listOf(false, true)) {
            var calls = 0
            val gate = RevenueRecognition(InMemoryRecognitionJournal(), RecognitionSink { calls++; true })
            val input = evidence().copy(userConfirmed = manual, activeSessionId = if (same) "s" else "other",
                printResult = if (accepted) PrintResult.Submitted("fixture") else PrintResult.Denied)
            val eligible = manual && accepted && same
            assertEquals(if (eligible) RecognitionResult.RECORDED else RecognitionResult.INELIGIBLE, gate.recognize(input))
            assertEquals(if (eligible) 1 else 0, calls)
        }
    }

    @Test fun staleMissingDryRunAndUncertainNeverRecord() {
        var calls = 0
        val gate = RevenueRecognition(InMemoryRecognitionJournal(), RecognitionSink { calls++; true })
        val e = evidence()
        for (input in listOf(e.copy(confirmationSessionId = "stale"), e.copy(printSessionId = "stale"),
            e.copy(sale = sale.copy(externalSessionId = "")), e.copy(dryRun = true), e.copy(userConfirmed = false),
            e.copy(printResult = PrintResult.Uncertain(java.util.concurrent.TimeoutException())),
            e.copy(printResult = PrintResult.Rejected("fixture")), e.copy(printResult = PrintResult.Denied))) {
            assertEquals(RecognitionResult.INELIGIBLE, gate.recognize(input))
        }
        assertEquals(0, calls)
    }

    @Test fun duplicateManualConfirmationRecordsFrozenSaleOnceAcrossGates() {
        val journal = InMemoryRecognitionJournal()
        val received = mutableListOf<SaleTransaction>()
        val sink = RecognitionSink { received.add(it); true }
        assertEquals(RecognitionResult.RECORDED, RevenueRecognition(journal, sink).recognize(evidence()))
        assertEquals(RecognitionResult.ALREADY_RECORDED, RevenueRecognition(journal, sink).recognize(evidence()))
        assertEquals(listOf(sale), received)
    }

    @Test fun falseTimeoutAndFailureRequireReconciliationWithoutRetry() {
        for (failure in 0..2) {
            var calls = 0
            val journal = InMemoryRecognitionJournal()
            val sink = RecognitionSink {
                calls++
                when (failure) { 0 -> false; 1 -> throw java.util.concurrent.TimeoutException(); else -> throw IllegalStateException("fixture") }
            }
            repeat(2) {
                assertEquals(RecognitionResult.RECONCILIATION_REQUIRED, RevenueRecognition(journal, sink).recognize(evidence()))
            }
            assertEquals(1, calls)
            assertEquals(RecognitionState.RECONCILIATION_REQUIRED, journal.state("s"))
        }
    }
}

package com.lesouvenir.v2.integrations

import com.lesouvenir.v2.printing.legacy.PrintResult

enum class RecognitionResult { INELIGIBLE, RECORDED, ALREADY_RECORDED, RECONCILIATION_REQUIRED }
enum class RecognitionState { IN_FLIGHT, RECORDED, RECONCILIATION_REQUIRED }

/** Must atomically reserve a session across all users of the journal. No durable implementation supplied. */
interface RecognitionJournal {
    fun reserve(sessionId: String): Boolean
    fun state(sessionId: String): RecognitionState?
    fun finish(sessionId: String, state: RecognitionState)
}

/** Explicitly process-local, NOT durable or production exactly-once storage. */
class InMemoryRecognitionJournal : RecognitionJournal {
    private val states = mutableMapOf<String, RecognitionState>()
    @Synchronized override fun reserve(sessionId: String): Boolean {
        if (states.containsKey(sessionId)) return false
        states[sessionId] = RecognitionState.IN_FLIGHT
        return true
    }
    @Synchronized override fun state(sessionId: String) = states[sessionId]
    @Synchronized override fun finish(sessionId: String, state: RecognitionState) { states[sessionId] = state }
}

fun interface RecognitionSink { fun record(sale: SaleTransaction): Boolean }

/** Backend-observed frozen evidence, never an authoritative customer/IPC DTO. */
data class RecognitionEvidence(
    val sale: SaleTransaction,
    val activeSessionId: String,
    val confirmationSessionId: String,
    val printSessionId: String,
    val userConfirmed: Boolean,
    val dryRun: Boolean,
    val printResult: PrintResult
)

/** Offline injected gate only: no HTTP/session wiring, printing or physical-completion claim. */
class RevenueRecognition(private val journal: RecognitionJournal, private val sink: RecognitionSink) {
    fun recognize(evidence: RecognitionEvidence): RecognitionResult {
        val id = evidence.sale.externalSessionId
        if (id.isBlank() || id != evidence.activeSessionId || id != evidence.confirmationSessionId ||
            id != evidence.printSessionId || !evidence.userConfirmed || evidence.dryRun ||
            evidence.printResult !is PrintResult.Submitted) return RecognitionResult.INELIGIBLE
        if (!journal.reserve(id)) return when (journal.state(id)) {
            RecognitionState.RECORDED -> RecognitionResult.ALREADY_RECORDED
            else -> RecognitionResult.RECONCILIATION_REQUIRED
        }
        // Even false/exception can mean a remote commit happened: never automatically retry.
        val recorded = try { sink.record(evidence.sale) } catch (_: Exception) { false }
        journal.finish(id, if (recorded) RecognitionState.RECORDED else RecognitionState.RECONCILIATION_REQUIRED)
        return if (recorded) RecognitionResult.RECORDED else RecognitionResult.RECONCILIATION_REQUIRED
    }
}

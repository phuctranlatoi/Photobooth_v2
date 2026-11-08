package com.lesouvenir.v2.data

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import kotlin.test.*
import java.nio.file.Path
import java.sql.DriverManager

class SqliteSalesRepositoryTest {
    @TempDir lateinit var workspace: Path
    @Test fun durableIdempotentPendingAndSync() {
        val ledger = SqliteSalesRepository(workspace)
        val sale = SaleTransaction(sessionId = "session-1", boothId = "booth-1", layoutId = "strip",
            layoutTitle = "Strip", printSize = "5x15", quantity = 2, includedQuantity = 2,
            extraQuantity = 0, basePrice = 70000, extraUnitPrice = 20000, extraAmount = 0,
            totalAmount = 70000, paymentMethod = "PAYOS", createdAt = 1234)
        ledger.recordSale(sale)
        ledger.recordSale(sale.copy(totalAmount = 99999))
        assertEquals(1, SqliteSalesRepository(workspace).getPendingSales().size)
        assertEquals(70000, ledger.getSale("session-1")?.totalAmount)
        assertNull(ledger.getSale("missing"))
        DriverManager.getConnection("jdbc:sqlite:${workspace.resolve("data/sales.db")}").use { db ->
            db.createStatement().use { stmt ->
                stmt.executeQuery("PRAGMA journal_mode").use { assertEquals("wal", it.apply { next() }.getString(1)) }
                stmt.executeQuery("SELECT sync_status,original_quantity,original_total_amount FROM sales").use {
                    assertTrue(it.next()); assertEquals("PENDING", it.getString(1)); assertEquals(2, it.getInt(2)); assertEquals(70000, it.getLong(3))
                }
            }
        }
        ledger.markSaleSynced("session-1")
        assertTrue(SqliteSalesRepository(workspace).getPendingSales().isEmpty())
        assertNotNull(ledger.getSale("session-1"))
    }
    @Test fun reportingExcludesVoidsAndUsesHalfOpenInterval() {
        val ledger = SqliteSalesRepository(workspace)
        fun sale(id: String, at: Long, size: String) = SaleTransaction(sessionId = id, boothId = "booth-1",
            layoutId = "strip", layoutTitle = "Strip", printSize = size, quantity = 3, includedQuantity = 2,
            extraQuantity = 1, basePrice = 70000, extraUnitPrice = 20000, extraAmount = 20000,
            totalAmount = 90000, paymentMethod = "MOCK", createdAt = at)
        ledger.recordSale(sale("a", 1_700_000_000_000L, "5x15"))
        ledger.recordSale(sale("b", 1_700_000_001_000L, "10x15"))
        ledger.recordSale(sale("excluded", 1_700_000_002_000L, "10x15"))
        val start = 1_700_000_000_000L
        val end = 1_700_000_002_000L
        assertEquals(180000, ledger.getSummary(start, end).revenue)
        assertEquals(2, ledger.getSummary(start, end).sessions)
        assertEquals(6, ledger.getSummary(start, end).prints)
        assertEquals(2, ledger.getSizeBreakdowns(start, end).size)
        assertEquals(1, ledger.getDailyPoints(start, end).size)
        assertEquals(listOf("b", "a"), ledger.getRecentTransactions(start, end).map { it.sessionId })
        ledger.markSaleSynced("a")
        assertTrue(ledger.voidTransaction("a", "test"))
        assertFalse(ledger.voidTransaction("a", "again"))
        assertEquals("VOIDED", ledger.getSale("a")?.status)
        assertEquals(1, ledger.getSummary(start, end).sessions)
        assertEquals(listOf("b", "a"), ledger.getRecentTransactions(start, end).map { it.sessionId })
        assertTrue(ledger.getPendingSales().any { it.sessionId == "a" })
    }
}

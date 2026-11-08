package com.lesouvenir.v2.data

import com.lesouvenir.v2.config.DesktopBoothConfig
import com.lesouvenir.v2.integrations.*
import java.nio.file.Files
import java.nio.file.Path
import java.sql.DriverManager
import java.sql.ResultSet

/** V1 sales fields, kept distinct from the remote REST payload. */
data class SaleTransaction(
    val id: Long = 0, val sessionId: String, val boothId: String, val layoutId: String,
    val layoutTitle: String, val printSize: String, val quantity: Int, val includedQuantity: Int,
    val extraQuantity: Int, val basePrice: Long, val extraUnitPrice: Long, val extraAmount: Long,
    val totalAmount: Long, val paymentMethod: String, val createdAt: Long,
    val status: String = "completed", val originalQuantity: Int? = null,
    val originalTotalAmount: Long? = null, val adjustReason: String? = null, val adjustedAt: Long? = null
)

class SqliteSalesRepository(workspace: Path) {
    private val url: String
    init {
        val root = workspace.toAbsolutePath().normalize()
        val directory = root.resolve("data")
        Files.createDirectories(directory)
        url = "jdbc:sqlite:${directory.resolve("sales.db")}"
        connection().use { db -> db.createStatement().use { stmt ->
            stmt.execute("""CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL UNIQUE,
                booth_id TEXT NOT NULL, layout_id TEXT NOT NULL, layout_title TEXT NOT NULL,
                print_size TEXT NOT NULL, quantity INTEGER NOT NULL, included_quantity INTEGER NOT NULL,
                extra_quantity INTEGER NOT NULL, base_price INTEGER NOT NULL, extra_unit_price INTEGER NOT NULL,
                extra_amount INTEGER NOT NULL, total_amount INTEGER NOT NULL, payment_method TEXT NOT NULL,
                created_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'completed',
                sync_status TEXT NOT NULL DEFAULT 'PENDING', original_quantity INTEGER,
                original_total_amount INTEGER, adjust_reason TEXT, adjusted_at INTEGER)""")
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)")
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_sales_sync_status ON sales(sync_status)")
        } }
    }
    private fun connection() = DriverManager.getConnection(url).apply {
        createStatement().use { it.execute("PRAGMA busy_timeout = 5000"); it.execute("PRAGMA journal_mode = WAL") }
    }
    fun recordSale(transaction: SaleTransaction) {
        require(transaction.sessionId.isNotBlank())
        connection().use { db -> db.prepareStatement("""INSERT OR IGNORE INTO sales
            (session_id, booth_id, layout_id, layout_title, print_size, quantity, included_quantity,
             extra_quantity, base_price, extra_unit_price, extra_amount, total_amount, payment_method,
             created_at, status, sync_status, original_quantity, original_total_amount, adjust_reason, adjusted_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'PENDING',?,?,?,?)""").use { stmt ->
            listOf(transaction.sessionId, transaction.boothId, transaction.layoutId, transaction.layoutTitle,
                transaction.printSize, transaction.quantity, transaction.includedQuantity, transaction.extraQuantity,
                transaction.basePrice, transaction.extraUnitPrice, transaction.extraAmount, transaction.totalAmount,
                transaction.paymentMethod, transaction.createdAt, transaction.status,
                transaction.originalQuantity ?: transaction.quantity,
                transaction.originalTotalAmount ?: transaction.totalAmount, transaction.adjustReason,
                transaction.adjustedAt).forEachIndexed { index, value -> stmt.setObject(index + 1, value) }
            stmt.executeUpdate()
        } }
    }
    private fun read(r: ResultSet) = SaleTransaction(r.getLong("id"), r.getString("session_id"),
        r.getString("booth_id"), r.getString("layout_id"), r.getString("layout_title"), r.getString("print_size"),
        r.getInt("quantity"), r.getInt("included_quantity"), r.getInt("extra_quantity"),
        r.getLong("base_price"), r.getLong("extra_unit_price"), r.getLong("extra_amount"),
        r.getLong("total_amount"), r.getString("payment_method"), r.getLong("created_at"), r.getString("status"),
        r.getInt("original_quantity").takeUnless { r.wasNull() },
        r.getLong("original_total_amount").takeUnless { r.wasNull() }, r.getString("adjust_reason"),
        r.getLong("adjusted_at").takeUnless { r.wasNull() })
    fun getPendingSales(): List<SaleTransaction> = connection().use { db ->
        db.prepareStatement("SELECT * FROM sales WHERE sync_status='PENDING' ORDER BY id").use { stmt ->
            stmt.executeQuery().use { rows -> buildList { while (rows.next()) add(read(rows)) } }
        }
    }
    fun markSaleSynced(sessionId: String) {
        connection().use { db -> db.prepareStatement("UPDATE sales SET sync_status='SYNCED' WHERE session_id=? AND sync_status='PENDING'").use {
            it.setString(1, sessionId); it.executeUpdate()
        } }
    }
    fun getSale(sessionId: String): SaleTransaction? = connection().use { db ->
        db.prepareStatement("SELECT * FROM sales WHERE session_id=?").use { stmt ->
            stmt.setString(1, sessionId)
            stmt.executeQuery().use { rows -> if (rows.next()) read(rows) else null }
        }
    }
    fun getSummary(startTime: Long, endTime: Long): SalesSummary = connection().use { db ->
        db.prepareStatement("""SELECT COALESCE(SUM(total_amount),0), COUNT(*), COALESCE(SUM(quantity),0),
            COALESCE(SUM(extra_amount),0), COALESCE(SUM(extra_quantity),0) FROM sales
            WHERE status='completed' AND created_at >= ? AND created_at < ?""").use { stmt ->
            stmt.setLong(1, startTime); stmt.setLong(2, endTime)
            stmt.executeQuery().use { r -> r.next(); SalesSummary(r.getLong(1), r.getLong(2), r.getLong(3), r.getLong(4), r.getLong(5)) }
        }
    }
    fun getDailyPoints(startTime: Long, endTime: Long): List<DailyRevenuePoint> = connection().use { db ->
        db.prepareStatement("""SELECT date(created_at / 1000, 'unixepoch', 'localtime'), SUM(total_amount), COUNT(*)
            FROM sales WHERE status='completed' AND created_at >= ? AND created_at < ? GROUP BY 1 ORDER BY 1""").use { stmt ->
            stmt.setLong(1, startTime); stmt.setLong(2, endTime)
            stmt.executeQuery().use { r -> buildList { while (r.next()) add(DailyRevenuePoint(r.getString(1), r.getLong(2), r.getLong(3))) } }
        }
    }
    fun getSizeBreakdowns(startTime: Long, endTime: Long): List<SizeBreakdown> = connection().use { db ->
        db.prepareStatement("""SELECT print_size, COUNT(*), SUM(quantity), SUM(total_amount), SUM(extra_amount)
            FROM sales WHERE status='completed' AND created_at >= ? AND created_at < ? GROUP BY print_size ORDER BY print_size""").use { stmt ->
            stmt.setLong(1, startTime); stmt.setLong(2, endTime)
            stmt.executeQuery().use { r -> buildList { while (r.next()) add(SizeBreakdown(r.getString(1), r.getLong(2), r.getLong(3), r.getLong(4), r.getLong(5))) } }
        }
    }
    fun getRecentTransactions(startTime: Long, endTime: Long, limit: Int = 50): List<SaleTransaction> = connection().use { db ->
        db.prepareStatement("""SELECT * FROM sales WHERE status IN ('completed','VOIDED','voided')
            AND created_at >= ? AND created_at < ? ORDER BY created_at DESC, id DESC LIMIT ?""").use { stmt ->
            stmt.setLong(1, startTime); stmt.setLong(2, endTime); stmt.setInt(3, limit.coerceIn(1, 100))
            stmt.executeQuery().use { r -> buildList { while (r.next()) add(read(r)) } }
        }
    }
    fun getRecentTransactions(limit: Int = 50): List<SaleTransaction> = connection().use { db ->
        db.prepareStatement("SELECT * FROM sales WHERE status IN ('completed','VOIDED','voided') ORDER BY created_at DESC, id DESC LIMIT ?").use { stmt ->
            stmt.setInt(1, limit.coerceIn(1, 100))
            stmt.executeQuery().use { r -> buildList { while (r.next()) add(read(r)) } }
        }
    }
    /** A void is an UPDATE, never a second revenue INSERT. Failed remote updates stay pending. */
    fun syncPendingSales(client: NeonDirectRevenueClient, config: DesktopBoothConfig) {
        getPendingSales().forEach { sale ->
            val synced = when (sale.status) {
                "completed" -> client.recordTransaction(config, sale)
                "VOIDED", "voided" -> client.voidTransaction(config, sale.sessionId, sale.adjustReason)
                else -> false
            }
            if (synced) markSaleSynced(sale.sessionId)
        }
    }
    fun voidTransaction(sessionId: String, reason: String?): Boolean = connection().use { db ->
        db.prepareStatement("""UPDATE sales SET status='VOIDED', sync_status='PENDING', adjust_reason=?, adjusted_at=?
            WHERE session_id=? AND status='completed'""").use { stmt ->
            stmt.setString(1, reason); stmt.setLong(2, System.currentTimeMillis()); stmt.setString(3, sessionId)
            stmt.executeUpdate() > 0
        }
    }
}

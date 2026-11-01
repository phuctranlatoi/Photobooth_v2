package com.lesouvenir.v2.integrations

import com.lesouvenir.v2.config.DesktopBoothConfig
import com.lesouvenir.v2.data.SaleTransaction
import java.net.URI
import java.net.URLDecoder
import java.sql.Connection
import java.sql.DriverManager
import java.sql.ResultSet
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.Properties
import java.util.UUID

data class SalesSummary(val revenue: Long, val sessions: Long, val prints: Long, val extraRevenue: Long, val extraPrints: Long)
data class DailyRevenuePoint(val date: String, val revenue: Long, val sessions: Long)
data class SizeBreakdown(val printSize: String, val sessions: Long, val prints: Long, val revenue: Long, val extraRevenue: Long)

/** V1 direct JDBC revenue route. No schema migration or automatic session/print wiring in V2. */
class NeonDirectRevenueClient {
    private var resolvedBooth: Pair<String, String>? = null

    private fun connection(config: DesktopBoothConfig): Connection {
        val url = config.get("NEON_DATABASE_URL").ifBlank { config.get("DATABASE_URL") }
        val uri = URI.create(url)
        require(uri.scheme == "postgresql" || uri.scheme == "postgres")
        val credentials = uri.rawUserInfo?.split(':', limit = 2)
        val properties = Properties()
        if (credentials != null) {
            properties.setProperty("user", URLDecoder.decode(credentials[0].replace("+", "%2B"), Charsets.UTF_8))
            if (credentials.size > 1) properties.setProperty("password", URLDecoder.decode(credentials[1].replace("+", "%2B"), Charsets.UTF_8))
        }
        properties.setProperty("connectTimeout", "5")
        properties.setProperty("socketTimeout", "10")
        val host = requireNotNull(uri.host)
        val port = if (uri.port >= 0) ":${uri.port}" else ""
        val path = uri.rawPath?.takeIf { it.isNotBlank() } ?: "/"
        val query = uri.rawQuery?.let { "?$it" } ?: ""
        return DriverManager.getConnection("jdbc:postgresql://$host$port$path$query", properties)
    }

    /** SELECT only; failures are deliberately silent to avoid leaking JDBC URLs or credentials. */
    fun testConnection(config: DesktopBoothConfig): Boolean = try {
        connection(config).use { db ->
            db.isReadOnly = true
            db.createStatement().use { stmt ->
                stmt.executeQuery("SELECT 1").use { rows -> rows.next() && rows.getInt(1) == 1 }
            }
        }
    } catch (_: Exception) { false }

    private fun boothId(db: Connection, config: DesktopBoothConfig): String {
        config.get("NEON_REVENUE_BOOTH_ID").takeIf { it.isNotBlank() }?.let { return it }
        synchronized(this) {
            val url = config.get("NEON_DATABASE_URL").ifBlank { config.get("DATABASE_URL") }
            resolvedBooth?.takeIf { it.first == url }?.let { return it.second }
            val id = db.prepareStatement("SELECT id FROM booths WHERE status = 'ACTIVE' ORDER BY created_at ASC LIMIT 1").use { stmt ->
                stmt.executeQuery().use { rows -> if (rows.next()) rows.getString(1) else error("No active revenue booth") }
            }
            resolvedBooth = url to id
            return id
        }
    }

    private fun timestamp(millis: Long): LocalDateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(millis), ZoneOffset.UTC)
    private fun java.sql.PreparedStatement.period(booth: String, start: Long, end: Long) {
        setString(1, booth); setObject(2, timestamp(start)); setObject(3, timestamp(end))
    }
    private fun ResultSet.money(column: Int): Long = getBigDecimal(column).longValueExact()

    /** Only call after backend-confirmed print submission; this method is not wired to UI or diagnostics. */
    fun recordTransaction(config: DesktopBoothConfig, transaction: SaleTransaction): Boolean = runCatching {
        require(transaction.sessionId.isNotBlank() && transaction.status == "completed")
        connection(config).use { db ->
            val booth = boothId(db, config)
            require(transaction.boothId == booth)
            db.prepareStatement("""INSERT INTO revenue_transactions (
                id, booth_id, external_session_id, layout_id, layout_title,
                print_size, quantity, included_quantity, extra_quantity,
                base_price, extra_unit_price, extra_amount, total_amount,
                payment_method, status, created_at, original_quantity, original_total_amount, adjust_reason, adjusted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (external_session_id) DO NOTHING""").use { stmt ->
                listOf(UUID.randomUUID().toString(), booth, transaction.sessionId, transaction.layoutId,
                    transaction.layoutTitle, transaction.printSize, transaction.quantity, transaction.includedQuantity,
                    transaction.extraQuantity, transaction.basePrice, transaction.extraUnitPrice, transaction.extraAmount,
                    transaction.totalAmount, transaction.paymentMethod, transaction.status, timestamp(transaction.createdAt),
                    transaction.originalQuantity ?: transaction.quantity, transaction.originalTotalAmount ?: transaction.totalAmount,
                    transaction.adjustReason, transaction.adjustedAt?.let(::timestamp))
                    .forEachIndexed { index, value -> stmt.setObject(index + 1, value) }
                if (stmt.executeUpdate() > 0) return@runCatching true
            }
            db.prepareStatement("SELECT booth_id FROM revenue_transactions WHERE external_session_id = ?").use { stmt ->
                stmt.setString(1, transaction.sessionId)
                stmt.executeQuery().use { rows -> rows.next() && rows.getString(1) == booth }
            }
        }
    }.getOrDefault(false)

    fun adjustTransaction(config: DesktopBoothConfig, sessionId: String, actualQuantity: Int, reason: String?): Boolean = runCatching {
        require(actualQuantity >= 2)
        connection(config).use { db ->
            val booth = boothId(db, config)
            db.autoCommit = false
            try {
                val snapshot = db.prepareStatement("SELECT base_price, included_quantity, extra_unit_price, quantity, total_amount FROM revenue_transactions WHERE external_session_id=? AND booth_id=? AND status='completed' FOR UPDATE").use { stmt ->
                    stmt.setString(1, sessionId); stmt.setString(2, booth)
                    stmt.executeQuery().use { r -> if (r.next()) listOf(r.money(1), r.getInt(2).toLong(), r.money(3), r.getInt(4).toLong(), r.money(5)) else null }
                } ?: return@use false
                val extra = maxOf(0, actualQuantity - snapshot[1].toInt().coerceAtLeast(2))
                val extraAmount = Math.multiplyExact(extra.toLong(), snapshot[2])
                val total = Math.addExact(snapshot[0], extraAmount)
                if (snapshot[3] == actualQuantity.toLong() && snapshot[4] == total) {
                    db.commit(); return@use true
                }
                val updated = db.prepareStatement("""UPDATE revenue_transactions SET quantity=?, extra_quantity=?, extra_amount=?, total_amount=?,
                    original_quantity=COALESCE(original_quantity, quantity), original_total_amount=COALESCE(original_total_amount, total_amount),
                    adjust_reason=?, adjusted_at=? WHERE external_session_id=? AND booth_id=? AND status='completed'""").use { stmt ->
                    listOf(actualQuantity, extra, extraAmount, total, reason, timestamp(System.currentTimeMillis()), sessionId, booth)
                        .forEachIndexed { i, value -> stmt.setObject(i + 1, value) }
                    stmt.executeUpdate() > 0
                }
                db.commit(); updated
            } catch (e: Exception) { db.rollback(); throw e }
        }
    }.getOrDefault(false)

    fun voidTransaction(config: DesktopBoothConfig, sessionId: String, reason: String?): Boolean = runCatching {
        connection(config).use { db ->
            val booth = boothId(db, config)
            val alreadyVoided = db.prepareStatement("SELECT status FROM revenue_transactions WHERE external_session_id=? AND booth_id=?").use { stmt ->
                stmt.setString(1, sessionId); stmt.setString(2, booth)
                stmt.executeQuery().use { rows -> rows.next() && rows.getString(1).equals("VOIDED", ignoreCase = true) }
            }
            if (alreadyVoided) return@use true
            db.prepareStatement("UPDATE revenue_transactions SET status='VOIDED', adjust_reason=?, adjusted_at=? WHERE external_session_id=? AND booth_id=?").use { stmt ->
                stmt.setString(1, reason); stmt.setObject(2, timestamp(System.currentTimeMillis()))
                stmt.setString(3, sessionId); stmt.setString(4, booth)
                stmt.executeUpdate() > 0
            }
        }
    }.getOrDefault(false)

    fun getDashboard(config: DesktopBoothConfig, startTime: Long, endTime: Long):
        Triple<SalesSummary, List<DailyRevenuePoint>, List<SizeBreakdown>>? = runCatching {
        connection(config).use { db ->
            val booth = boothId(db, config)
            val where = "WHERE booth_id = ? AND status = 'completed' AND created_at >= ? AND created_at < ?"
            val summary = db.prepareStatement("""SELECT COALESCE(SUM(total_amount), 0), COUNT(*),
                COALESCE(SUM(quantity), 0), COALESCE(SUM(extra_amount), 0), COALESCE(SUM(extra_quantity), 0)
                FROM revenue_transactions $where""").use { stmt ->
                stmt.period(booth, startTime, endTime)
                stmt.executeQuery().use { r -> r.next(); SalesSummary(r.money(1), r.money(2), r.money(3), r.money(4), r.money(5)) }
            }
            val daily = db.prepareStatement("""SELECT to_char((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'),
                SUM(total_amount), COUNT(*) FROM revenue_transactions $where GROUP BY 1 ORDER BY 1""").use { stmt ->
                stmt.period(booth, startTime, endTime)
                stmt.executeQuery().use { r -> buildList { while (r.next()) add(DailyRevenuePoint(r.getString(1), r.money(2), r.money(3))) } }
            }
            val sizes = db.prepareStatement("""SELECT print_size, COUNT(*), SUM(quantity), SUM(total_amount), SUM(extra_amount)
                FROM revenue_transactions $where GROUP BY print_size ORDER BY print_size""").use { stmt ->
                stmt.period(booth, startTime, endTime)
                stmt.executeQuery().use { r -> buildList {
                    while (r.next()) add(SizeBreakdown(r.getString(1), r.money(2), r.money(3), r.money(4), r.money(5)))
                } }
            }
            Triple(summary, daily, sizes)
        }
    }.getOrNull()

    fun getRecentTransactions(config: DesktopBoothConfig, startTime: Long, endTime: Long, limit: Int = 20): List<SaleTransaction>? = runCatching {
        connection(config).use { db ->
            val booth = boothId(db, config)
            db.prepareStatement("""SELECT external_session_id, booth_id, layout_id, layout_title, print_size,
                quantity, included_quantity, extra_quantity, base_price, extra_unit_price, extra_amount,
                total_amount, payment_method, created_at, status, original_quantity, original_total_amount,
                adjust_reason, adjusted_at FROM revenue_transactions
                WHERE booth_id = ? AND status IN ('completed','VOIDED','voided') AND created_at >= ? AND created_at < ?
                ORDER BY created_at DESC, id DESC LIMIT ?""").use { stmt ->
                stmt.period(booth, startTime, endTime)
                stmt.setInt(4, limit.coerceIn(1, 100))
                stmt.executeQuery().use { r -> buildList {
                    while (r.next()) add(SaleTransaction(sessionId = r.getString(1), boothId = r.getString(2),
                        layoutId = r.getString(3), layoutTitle = r.getString(4), printSize = r.getString(5),
                        quantity = r.getInt(6), includedQuantity = r.getInt(7), extraQuantity = r.getInt(8),
                        basePrice = r.money(9), extraUnitPrice = r.money(10), extraAmount = r.money(11),
                        totalAmount = r.money(12), paymentMethod = r.getString(13),
                        createdAt = r.getObject(14, LocalDateTime::class.java).toInstant(ZoneOffset.UTC).toEpochMilli(),
                        status = r.getString(15), originalQuantity = r.getInt(16).takeUnless { r.wasNull() },
                        originalTotalAmount = r.getLong(17).takeUnless { r.wasNull() }, adjustReason = r.getString(18),
                        adjustedAt = r.getObject(19, LocalDateTime::class.java)?.toInstant(ZoneOffset.UTC)?.toEpochMilli()))
                } }
            }
        }
    }.getOrNull()
}

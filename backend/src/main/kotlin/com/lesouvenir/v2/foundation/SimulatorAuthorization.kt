package com.lesouvenir.v2.foundation

/** V2-only local safety boundary, not an IPC or production session contract.
 * No synthetic capture may be authorized implicitly after a hardware failure.
 */
class SimulatorAuthorization(private val explicitlyEnabled: Boolean = false) {
    fun requireSyntheticCapturePermission() {
        check(explicitlyEnabled) { "Synthetic capture requires explicit simulator authorization" }
    }
}

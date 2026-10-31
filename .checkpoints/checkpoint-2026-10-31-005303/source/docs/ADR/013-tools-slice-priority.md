# Architecture Decision: Test Baseline Corrections & Tools Slice Priority

**Date**: 2026-10-31T00:49:51.375Z  
**Status**: APPROVED (Conditional)  
**Context**: Checkpoint verified, baseline tests reveal 1 timeout test failure, Camera engineer proposes Tools slice

---

## Decision Summary

### 1. Timeout Test Fix: ✅ **APPROVED**

**Scope**: Modify ONLY `backend/src/test/kotlin/com/lesouvenir/v2/ipc/SimulatorSessionTest.kt`

**Required Changes**:
```kotlin
// Add helper for isolated workspace
private fun isolatedWorkspace(id: String): Path {
    val isolated = root.resolve("backend/build/isolated-$id/PhotoboothDesktop_v2")
    Files.createDirectories(isolated)
    val normalized = isolated.toAbsolutePath().normalize()
    require(normalized.startsWith(root.toAbsolutePath().normalize()))
    require(!Files.isSymbolicLink(normalized) && 
            !normalized.nameCount.let { count -> (0 until count).any { i -> 
                Files.isSymbolicLink(normalized.root.resolve(normalized.subpath(0, i + 1))) 
            }})
    return normalized
}

@Test fun timeoutAutoPrintNoSaleAndCancelMatrix() {
    // Timeout half: isolated workspace with NO persisted settings
    val timeoutWorkspace = isolatedWorkspace("timeout-${id()}")
    require(!Files.exists(timeoutWorkspace.resolve("backend/config/operator-settings.json")))
    
    SimulatorSessionEngine(
        workspace = timeoutWorkspace,
        config = config(),
        enabled = true,
        tickMillis = 1,
        prepareMillis = 1,
        inactivityMillis = 500,  // Fallback timeout
        outputRoot = timeoutWorkspace.resolve("backend/build/timeout-${id()}")
    ).use { e ->
        val c = Client(e)
        c.capture("strip-2")
        c.waitFor("DELIVERY")
        val snap = c.call("session.getState")
        assertFalse(snap["userConfirmed"].asBoolean)
        assertFalse(snap["printAccepted"].asBoolean)  // ADD THIS
        assertFalse(snap["revenueRecorded"].asBoolean)
    }
    
    // Cancellation half: separate isolated workspace
    val cancelWorkspace = isolatedWorkspace("cancel-${id()}")
    require(!Files.exists(cancelWorkspace.resolve("backend/config/operator-settings.json")))
    
    SimulatorSessionEngine(
        workspace = cancelWorkspace,
        config = config(),
        enabled = true,
        tickMillis = 1,
        prepareMillis = 30,
        inactivityMillis = 60000,
        outputRoot = cancelWorkspace.resolve("backend/build/cancel-${id()}")
    ).use { e ->
        // ... existing cancellation matrix unchanged ...
    }
}
```

**Approval Conditions**:
1. ✅ NO changes to `SimulatorSessionEngine.kt`, `OperatorSettingsStore.kt`, or production code
2. ✅ NO changes to timeout algorithms, defaults, or IPC contracts
3. ✅ Isolated workspaces under `backend/build/isolated-*/PhotoboothDesktop_v2`
4. ✅ Assert settings file absent before engine construction
5. ✅ Add missing `printAccepted == false` assertion
6. ✅ Preserve 10-second wait (no deadline extension)
7. ✅ Keep cancellation matrix assertions unchanged
8. ✅ Symlink rejection in path validation

**Expected Result**: 42/42 tests pass after fix

---

### 2. Test Harness Fix: ✅ **APPROVED**

**File**: `backend/test-foundation.ps1`  
**Scope**: Fix stderr handling without changing test behavior

**Required Changes**:
```powershell
# Keep strict error handling for setup
$ErrorActionPreference = 'Stop'

# Setup (existing code)
$env:TEMP = "$PWD/.tmp"
$env:TMP = $env:TEMP
$env:GRADLE_USER_HOME = "$PWD/.gradle-user-home"
$env:JAVA_TOOL_OPTIONS = "-Djava.io.tmpdir=$PWD/.tmp -Duser.home=$PWD/.toolchain-home"

$gradle = ".\.toolchain\gradle-8.14.3\bin\gradle.bat"

# Relax stderr handling ONLY for Gradle invocation
try {
    $ErrorActionPreference = 'Continue'
    & $gradle --offline --no-daemon --project-cache-dir .\.gradle-project test --rerun-tasks
    $exitCode = $LASTEXITCODE
} finally {
    $ErrorActionPreference = 'Stop'
}

# Exit with exact Gradle exit code
exit $exitCode
```

**Approval Conditions**:
1. ✅ Preserve `$ErrorActionPreference='Stop'` for setup failures
2. ✅ Keep all V2-local paths unchanged (TEMP, TMP, Gradle cache, etc.)
3. ✅ Add `--offline` flag
4. ✅ Narrow relaxed stderr handling to single Gradle invocation
5. ✅ Restore strict error handling in `finally`
6. ✅ Exit with exact native exit code
7. ✅ Keep stdout/stderr visible
8. ✅ Preserve missing-toolchain hard failure

**Expected Result**: Benign stderr (JAVA_TOOL_OPTIONS) does not fail harness; real test failures still exit nonzero

---

### 3. Tools vs LUT Slice Priority: ✅ **TOOLS FIRST**

**Decision**: **Layout Tools (FrameModels + SlotDetectionEngine + PhotoCompositor) before LUT**

**Rationale**:

| Factor | Tools | LUT |
|--------|-------|-----|
| **Dependency Closure** | ✅ 3 files, zero external deps | ✅ 2 files, zero external deps |
| **License Risk** | ⚠️ Unverified (same as LUT) | ⚠️ Unverified |
| **Functional Complexity** | Higher (detection, composition) | Lower (parser, interpolation) |
| **Integration Dependencies** | Self-contained (BufferedImage in/out) | Requires effect config + compositor |
| **Test Fixtures** | Can generate synthetic transparent frames | Requires synthetic .cube files |
| **Migration Path** | Enables frame/layout tooling immediately | Depends on compositor for runtime use |
| **V1 Usage** | Operator layout tool (local, safe) | Effect selection (customer-facing) |
| **Business Value** | Unblocks frame management workflow | Aesthetic enhancement only |

**Decision Factors**:
1. **Tools are self-contained**: Detection + composition work standalone with BufferedImage I/O
2. **LUT requires compositor**: Can't apply effects until composition pipeline exists
3. **Tools enable operator workflow**: Frame detection/punching is operator-facing, lower risk
4. **Camera engineer ownership**: Tools audit already complete with detailed contract
5. **Parallelizable**: Different engineers can work simultaneously (Tools vs LUT)

**Approved Implementation Order**:
```
Slice 1: Layout Tools (Camera Engineer)
  ├─ FrameModels.kt (namespace-only change)
  ├─ SlotDetectionEngine.kt (namespace-only change)
  ├─ PhotoCompositor.kt (namespace-only change)
  └─ LayoutToolService.kt (NEW: bounded wrapper)

Slice 2: LUT Catalog (Backend Engineer)
  ├─ CubeLutParser.kt (namespace-only change)
  ├─ Lut3D.kt (namespace-only change)
  └─ IsolatedLutCatalog.kt (NEW: bounded wrapper)
```

---

## Approved Tools Slice (Slice 1)

### Source Files (Namespace-Only Copy)

**From V1**:
```
src/main/kotlin/com/phuctran/photobooth/desktop/engine/
├─ FrameModels.kt
├─ SlotDetectionEngine.kt
└─ PhotoCompositor.kt
```

**To V2**:
```
backend/src/main/kotlin/com/lesouvenir/v2/operatortools/legacy/
├─ FrameModels.kt         [ONLY change: package declaration line 1]
├─ SlotDetectionEngine.kt [ONLY change: package declaration line 1]
└─ PhotoCompositor.kt     [ONLY change: package declaration line 1]
```

**Transformation**:
```kotlin
// Line 1 only
package com.phuctran.photobooth.desktop.engine
  → package com.lesouvenir.v2.operatortools.legacy
```

**Verification**:
1. Read V1 source as bytes
2. Read V2 copy as bytes
3. Normalize: package line + line endings only
4. Compare remaining bytes (MUST be identical)
5. Document SHA-256 hashes of both normalized versions

### New Wrapper Service

**File**: `backend/src/main/kotlin/com/lesouvenir/v2/operatortools/LayoutToolService.kt`

**Contract** (Bounded, No IPC Yet):
```kotlin
package com.lesouvenir.v2.operatortools

import com.lesouvenir.v2.operatortools.legacy.*
import java.awt.image.BufferedImage
import java.nio.file.Path
import javax.imageio.ImageIO

data class FrameDetectionResult(
    val sourceWidth: Int,
    val sourceHeight: Int,
    val slots: List<FrameSlot>,
    val warnings: List<String>,
    val qrSlot: FrameSlot?,
    val punchedPngBytes: ByteArray  // PNG-encoded punched output
)

data class CompositionResult(
    val composedImage: BufferedImage,
    val targetWidth: Int,
    val targetHeight: Int
)

class LayoutToolService(
    private val workspace: Path,
    private val maxInputBytes: Long = 10_000_000,      // 10 MB
    private val maxDimension: Int = 8192               // 8K pixels
) {
    init {
        val normalized = workspace.toAbsolutePath().normalize()
        require(normalized.toString().endsWith("PhotoboothDesktop_v2")) {
            "Workspace must end with PhotoboothDesktop_v2"
        }
        require(!Files.isSymbolicLink(normalized))
    }
    
    fun detectFrame(
        inputPngBytes: ByteArray,
        config: DetectionConfig = DetectionConfig()
    ): Result<FrameDetectionResult> = runCatching {
        // Validate size before decode
        require(inputPngBytes.size <= maxInputBytes) {
            "Input exceeds $maxInputBytes bytes"
        }
        
        // Decode and validate dimensions
        val image = ImageIO.read(inputPngBytes.inputStream())
            ?: throw IllegalArgumentException("Invalid or unsupported image format")
        require(image.width <= maxDimension && image.height <= maxDimension) {
            "Image dimensions exceed $maxDimension px"
        }
        
        // Call V1 detector (unchanged algorithm)
        val detection = SlotDetectionEngine().detect(image, config)
        
        // Encode punched output
        val punchedBytes = ByteArrayOutputStream().use { out ->
            ImageIO.write(detection.punchedImage, "png", out)
            out.toByteArray()
        }
        
        FrameDetectionResult(
            sourceWidth = detection.width,
            sourceHeight = detection.height,
            slots = detection.slots,
            warnings = detection.warnings,
            qrSlot = detection.qrSlot,
            punchedPngBytes = punchedBytes
        )
    }
    
    fun compose(
        framePngBytes: ByteArray,
        targetWidth: Int,
        targetHeight: Int,
        slots: List<FrameSlot>,
        photoImages: List<BufferedImage>
    ): Result<CompositionResult> = runCatching {
        require(framePngBytes.size <= maxInputBytes)
        val frameImage = ImageIO.read(framePngBytes.inputStream())
            ?: throw IllegalArgumentException("Invalid frame PNG")
        
        // Call V1 compositor (unchanged algorithm)
        val composed = PhotoCompositor.compose(
            frameImage = frameImage,
            targetWidth = targetWidth,
            targetHeight = targetHeight,
            slots = slots,
            photos = photoImages
        )
        
        CompositionResult(
            composedImage = composed,
            targetWidth = targetWidth,
            targetHeight = targetHeight
        )
    }
}
```

### Test Requirements

**File**: `backend/src/test/kotlin/com/lesouvenir/v2/operatortools/LayoutToolServiceTest.kt`

**Required Synthetic Fixtures** (NO V1 asset copies):
```kotlin
@Test fun detectTransparentRectangularWindows() {
    // Generate 1000x1000 transparent PNG with 2x2 grid of opaque rectangles
    val fixture = generateTransparentGridFixture(
        width = 1000,
        height = 1000,
        rows = 2,
        cols = 2,
        windowMargin = 50
    )
    
    val result = service.detectFrame(fixture.pngBytes).getOrThrow()
    
    assertEquals(1000, result.sourceWidth)
    assertEquals(1000, result.sourceHeight)
    assertEquals(4, result.slots.size)
    
    // Assert normalized coordinates (tolerance for edge detection variance)
    result.slots.forEachIndexed { i, slot ->
        val expectedX = if (i % 2 == 0) 0.05 else 0.55
        val expectedY = if (i < 2) 0.05 else 0.55
        assertEquals(expectedX, slot.x, 0.05)
        assertEquals(expectedY, slot.y, 0.05)
    }
    
    // Verify punched output encodes successfully
    val punched = ImageIO.read(result.punchedPngBytes.inputStream())
    assertNotNull(punched)
    assertTrue(punched.colorModel.hasAlpha())
}

@Test fun detectRejectsOversizedInput() {
    val oversized = ByteArray(11_000_000) // 11 MB
    val result = service.detectFrame(oversized)
    assertTrue(result.isFailure)
    assertTrue(result.exceptionOrNull()?.message?.contains("exceeds") == true)
}

@Test fun composeWithCoverCropAndOverlay() {
    // Generate tiny test photos with unique pixel patterns
    val photos = listOf(
        generateSolidColorImage(200, 300, Color.RED),
        generateSolidColorImage(300, 200, Color.BLUE)
    )
    
    // Transparent frame with 2 slots
    val frameSlots = listOf(
        FrameSlot(x = 0.1, y = 0.1, width = 0.3, height = 0.4, /* ... */),
        FrameSlot(x = 0.6, y = 0.1, width = 0.3, height = 0.4, /* ... */)
    )
    
    val frameBytes = generateTransparentFrameWithSlots(frameSlots, 1000, 1500)
    
    val result = service.compose(
        framePngBytes = frameBytes,
        targetWidth = 1000,
        targetHeight = 1500,
        slots = frameSlots,
        photoImages = photos
    ).getOrThrow()
    
    assertEquals(1000, result.targetWidth)
    assertEquals(1500, result.targetHeight)
    
    // Verify cover-crop: taller photo should be cropped vertically
    // Verify frame overlay: alpha preserved in final composition
    val composed = result.composedImage
    assertTrue(composed.colorModel.hasAlpha())
    
    // Sample pixels at slot centers to verify photo placement
    // (Detailed pixel assertions depend on V1 algorithm behavior)
}

@Test fun sourceEquivalence() {
    // Read V1 source files (read-only)
    val v1FrameModels = readV1Source("engine/FrameModels.kt")
    val v1Detector = readV1Source("engine/SlotDetectionEngine.kt")
    val v1Compositor = readV1Source("engine/PhotoCompositor.kt")
    
    // Read V2 copies
    val v2FrameModels = readV2Source("operatortools/legacy/FrameModels.kt")
    val v2Detector = readV2Source("operatortools/legacy/SlotDetectionEngine.kt")
    val v2Compositor = readV2Source("operatortools/legacy/PhotoCompositor.kt")
    
    // Normalize: package line only
    fun normalize(source: String): String {
        return source.lines()
            .mapIndexed { i, line ->
                if (i == 0 && line.startsWith("package ")) "" else line
            }
            .joinToString("\n")
    }
    
    assertEquals(normalize(v1FrameModels), normalize(v2FrameModels))
    assertEquals(normalize(v1Detector), normalize(v2Detector))
    assertEquals(normalize(v1Compositor), normalize(v2Compositor))
    
    // Document hashes
    println("V1 FrameModels SHA-256: ${sha256(v1FrameModels)}")
    println("V2 FrameModels SHA-256: ${sha256(v2FrameModels)}")
    // ... (repeat for all 3 files)
}
```

### Approval Conditions

**Tools Slice 1 APPROVED IF**:
1. ✅ License/provenance verified before commercial distribution
2. ✅ ONLY package declaration changed (line 1 of each file)
3. ✅ Source equivalence test passes (normalized comparison)
4. ✅ Synthetic test fixtures only (NO V1 asset copies)
5. ✅ `LayoutToolService` enforces workspace containment
6. ✅ Input size limits enforced before decode
7. ✅ Symlink rejection in workspace validation
8. ✅ NO IPC methods added (backend-local only)
9. ✅ NO Firebase operations (deferred to separate approval)
10. ✅ SHA-256 hashes documented for V1 source + V2 copy

**Blocked Actions**:
- ❌ NO IPC method addition (requires architect ADR)
- ❌ NO Firebase layout persistence (requires separate approval)
- ❌ NO operator file picker UI (requires desktop integration design)
- ❌ NO V1 asset migration (violates isolation policy)

---

## LUT Slice (Slice 2 - Deferred)

**Status**: Remains approved as documented in `docs/ARCHITECTURE_BASELINE_MIGRATION.md` Section 4

**Scheduling**: Can proceed in parallel after Tools Slice 1 if different engineer

**No Changes**: Previous LUT approval conditions unchanged

---

## File Ownership (Updated)

### Immediate (Test Fixes)
```
backend/src/test/kotlin/com/lesouvenir/v2/ipc/
└─ SimulatorSessionTest.kt        [Backend Engineer - timeout fix]

backend/
└─ test-foundation.ps1            [Backend Engineer - stderr fix]
```

### Slice 1 (Tools)
```
backend/src/main/kotlin/com/lesouvenir/v2/operatortools/legacy/
├─ FrameModels.kt                 [Camera Engineer]
├─ SlotDetectionEngine.kt         [Camera Engineer]
└─ PhotoCompositor.kt             [Camera Engineer]

backend/src/main/kotlin/com/lesouvenir/v2/operatortools/
└─ LayoutToolService.kt           [Camera Engineer]

backend/src/test/kotlin/com/lesouvenir/v2/operatortools/
└─ LayoutToolServiceTest.kt       [Camera Engineer]
```

### Slice 2 (LUT - Parallel OK)
```
backend/src/main/kotlin/com/lesouvenir/v2/imaging/lut/
├─ CubeLutParser.kt               [Backend Engineer]
└─ Lut3D.kt                       [Backend Engineer]

backend/src/main/kotlin/com/lesouvenir/v2/operatortools/
└─ IsolatedLutCatalog.kt          [Backend Engineer]

backend/src/test/kotlin/com/lesouvenir/v2/imaging/lut/
└─ CubeLutParserParityTest.kt     [Backend Engineer]

backend/src/test/kotlin/com/lesouvenir/v2/operatortools/
└─ IsolatedLutCatalogTest.kt      [Backend Engineer]
```

### Architect-Owned (No Specialist Edits)
```
docs/
├─ CHECKPOINT.md
├─ ARCHITECTURE_BASELINE_MIGRATION.md
├─ IPC_CONTRACTS.md
└─ ADR/*.md
```

---

## Implementation Sequence

### Phase 0: Test Baseline Corrections (IMMEDIATE)
1. Backend Engineer: Fix `SimulatorSessionTest.kt` timeout test
2. Backend Engineer: Fix `test-foundation.ps1` stderr handling
3. Rerun full backend suite: Expected 42/42 tests pass
4. Document: Test fix results in checkpoint update

### Phase 1: Tools Slice (Camera Engineer)
1. Verify license/provenance for 3 Tools source files
2. Copy 3 files with namespace-only change
3. Implement `LayoutToolService.kt` wrapper
4. Implement synthetic test fixtures
5. Run source equivalence comparison
6. Document SHA-256 hashes
7. Submit for review: Tools slice complete

### Phase 2: LUT Slice (Backend Engineer - Parallel OK)
1. Verify license/provenance for 2 LUT source files
2. Copy 2 files with namespace-only change
3. Implement `IsolatedLutCatalog.kt` wrapper
4. Implement synthetic test fixtures
5. Run source equivalence comparison
6. Document SHA-256 hashes
7. Submit for review: LUT slice complete

### Phase 3: Integration (After Both Slices)
1. Architect: Design IPC contracts for operator tools (if needed)
2. Frontend: Design operator tool UI workflows
3. Backend: Integrate Tools + LUT with compositor pipeline
4. Tester: Verify containment, fixtures-only, rollback

---

## Checkpoint Status

### Current State
✅ **CHECKPOINT VERIFIED AND COMPLETE**
- Git commit: `e3d25c7e89a7c8e85549787bd2134937cc8a0660`
- Critical file hashes documented
- Frontend: 20/20 tests pass
- Backend: 41/42 tests pass (1 timeout test failure - fix approved)
- V1 isolation verified
- Documentation complete

### Blockers Resolved
✅ Test baseline corrections approved (bounded changes only)  
✅ Tools vs LUT priority decided (Tools first)  
✅ File ownership defined (no overlap)  
✅ Source equivalence verification specified  

### Ready for Implementation
✅ Backend Engineer: Can proceed with test fixes  
✅ Camera Engineer: Can proceed with Tools Slice 1 (after license verification)  
✅ Backend Engineer: Can proceed with LUT Slice 2 in parallel (after license verification)  

---

## Summary of Approvals

| Item | Status | Owner | Conditions |
|------|--------|-------|----------|
| **Timeout test fix** | ✅ APPROVED | Backend Engineer | Isolated workspaces only, add printAccepted assertion |
| **test-foundation.ps1** | ✅ APPROVED | Backend Engineer | Scoped stderr handling, exact exit code |
| **Tools Slice 1** | ✅ APPROVED | Camera Engineer | License verification, namespace-only change, synthetic tests |
| **LUT Slice 2** | ✅ APPROVED | Backend Engineer | License verification, namespace-only change, synthetic tests |
| **Tools > LUT priority** | ✅ DECIDED | Architect | Tools first due to self-contained nature |

---

**Checkpoint Complete**: ✅ **YES**  
**App Changes Authorized**: ✅ **YES** (test fixes + Tools Slice 1 + LUT Slice 2)  
**Next Action**: Backend Engineer implements test fixes, Camera Engineer implements Tools Slice 1

---

**Document Status**: FINAL  
**Approval Authority**: Architect  
**Date**: 2026-10-31T00:49:51.375Z

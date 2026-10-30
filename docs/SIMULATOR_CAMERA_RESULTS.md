# Simulator camera — bounded implementation

This is a synthetic local JPEG source, not Canon, webcam or Hot Folder support. No device access, SDK initialization, native tests or physical camera tests were performed. V1 was not modified; the existing audit `05_CAMERA_AND_NATIVE_SDK_AUDIT.md` was the sole legacy reference.

## Integration API

Construct `SimulatorCamera(SimulatorAuthorization(true), workspace, sourceCount, width, height, previewWidth, previewHeight)` only after explicit operator authorization. `publishPreview(sourceIndex)` and `latestPreview()` provide a latest-only downscaled JPEG; `capture(sourceIndex, existingSessionDirectory, shotId): SimulatorCapture` serializes capture and returns source identity and the path to a full-resolution synthetic original. Source indices are zero-based and independent of session shot count and countdown. The adapter neither selects a source profile nor sequences a session or changes IPC schemas. JPEGs are generated internally; it does not accept arbitrary external photos.

Capture writes a temporary file in the target directory and atomically publishes via a hard link, failing if the original name already exists. The temporary link is deleted. The adapter never overwrites originals, but filesystem permissions do not prevent other processes modifying them. Hard-link support is required; unsupported filesystems fail rather than silently weaken atomicity. The session directory must already exist in the named V2 workspace, without symlink path components. This check is not an OS sandbox and assumes trusted local code does not concurrently replace directories. Preview arrays are defensively copied. No image processing, mirror, LUT, Beauty or production original parity is claimed.

## Verification

Tests in `SimulatorCameraTest` exercise authorization, real ImageIO decode, sizing, deterministic source bytes, no overwrite and path rejection. **Not run:** concurrent Gradle is prohibited while the backend owner works; tests are ready for the coordinating agent. No latency measurements. Native init/discovery and controlled physical Canon testing remain not run and require separate authorization. Real migration is gated on simulator test success.

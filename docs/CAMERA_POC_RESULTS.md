# Camera pipeline POC results (Milestone 2)

Status: partial software integration only. No real device was opened or tested.

Implemented a gated camera controller with serial capture dispatch and fail-closed hardware errors, plus an explicitly initialized webcam adapter. Hardware operations require `HardwareAuthorization(true)`; constructors/discovery do not implicitly take a device. No synthetic capture fallback exists in the real controller. Capture timeout is 90 seconds; preview polling is approximately 30 fps. A production bridge must still bound preview frames at IPC ingress and coordinate shutdown.

Not completed: Canon adapter/SDK wrapper integration, DLL redistribution, Hot Folder production adapter, approval-based physical test, compile/test verification. Existing V1 Hot Folder helper is deliberately restricted to synthetic V2 fixtures and is not reused as a production watcher.

No V1 files were modified. No physical Canon or webcam was accessed. The required physical test remains gated on explicit operator approval and confirmation the device is not in use by V1.

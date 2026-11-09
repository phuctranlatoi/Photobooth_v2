// Actual installed SimulatorSessionEngine API; see SIMULATOR_SESSION_RESULTS.md.
// No unsolicited events, arbitrary transitions or FINISHED phase.
export interface LayoutMode {id:string;title:string;shotCount:number;selectCount:number;countdownSeconds:number;printSizeLabel:string;printAspectRatio:number;photoAspectRatio?:number;subtitle?:string;description?:string;family?:string;basePrice?:number;mediaLabel?:string;accentColor?:number;gridColumns?:number;paddingTopRatio?:number;paddingLeftRatio?:number;paddingRightRatio?:number;gapHorizontalRatio?:number;gapVerticalRatio?:number;absoluteSlots?:Array<{index:number;x:number;y:number;width:number;height:number}>}
export interface PricingSnapshot {quantity:number;includedQuantity:number;extraQuantity:number;basePrice:number;extraUnitPrice:number;extraAmount:number;totalAmount:number}
export interface CatalogGetResult {layouts:LayoutMode[];defaultLayoutId:string;simulator:boolean;pricing:{stripAllowedQuantities:number[];printAllowedQuantities:number[];stripBasePrice?:number;stripUnitPrice?:number;printBasePrice?:number;printUnitPrice?:number};captureMode?:'DEMO'|'REAL';bundles?:Array<{id:string;name:string;coverDataUrl?:string;layoutId:string;frameCount:number}>;availableFramesCount?:number;cameraConnected?:boolean;catalogSource?:'FIREBASE_LIVE'|'DISK_CACHE'|'STATIC_FALLBACK'|'MEMORY_FALLBACK'|'UNAVAILABLE';lastSyncError?:string|null;payOsStatus?:'CONFIG_MISSING'|'CONFIG_INVALID'|'SDK_INIT_FAILED'|'READY';lastPaymentError?:string|null}
export type SessionState='IDLE'|'SELECTING'|'SELECTING_QUANTITY'|'PAYMENT_PENDING'|'PREPARING'|'LIVE_VIEW'|'COUNTDOWN'|'CAPTURING'|'SELECTING_PHOTOS'|'EDITING'|'PRINT_PENDING'|'PRINTING'|'DELIVERY'|'RECOVERY';
export interface SessionGetStateResult {sessionId:string;state:SessionState;layout:LayoutMode;pricing:PricingSnapshot;capturedCount:number;selectedCount:number;selectedIndices:number[]}
export interface FrameOption {
  id: string;
  name: string;
  thumbDataUrl?: string;
  thumbnailDataUrl?: string;
  previewDataUrl?: string;
}
export type SimulatorMethod='catalog.get'|'catalog.sync'|'device.getStatus'|'session.start'|'session.getState'|'session.setLayout'|'session.confirmSetup'|'session.setQuantity'|'payment.mockComplete'|'payment.createLink'|'payment.checkStatus'|'capture.startSequence'|'selection.toggle'|'selection.confirm'|'frame.list'|'frame.select'|'frame.confirm'|'print.confirmDryRun'|'print.confirmReal'|'session.back'|'session.cancel'|'session.finish';

// Actual installed SimulatorSessionEngine API; see SIMULATOR_SESSION_RESULTS.md.
// No unsolicited events, arbitrary transitions or FINISHED phase.
export interface LayoutMode {id:string;title:string;shotCount:number;selectCount:number;countdownSeconds:number;printSizeLabel:string;printAspectRatio:number;photoAspectRatio:number}
export interface PricingSnapshot {quantity:number;includedQuantity:number;extraQuantity:number;basePrice:number;extraUnitPrice:number;extraAmount:number;totalAmount:number}
export interface CatalogGetResult {layouts:LayoutMode[];defaultLayoutId:string;simulator:true;pricing:{stripAllowedQuantities:number[];printAllowedQuantities:number[]}}
export type SessionState='IDLE'|'SELECTING'|'SELECTING_QUANTITY'|'PAYMENT_PENDING'|'PREPARING'|'LIVE_VIEW'|'COUNTDOWN'|'CAPTURING'|'SELECTING_PHOTOS'|'EDITING'|'PRINT_PENDING'|'PRINTING'|'DELIVERY'|'RECOVERY';
export interface SessionGetStateResult {sessionId:string;state:SessionState;layout:LayoutMode;pricing:PricingSnapshot;capturedCount:number;selectedCount:number;selectedIndices:number[]}
export interface FrameOption {id:string;name:string;thumbDataUrl:string}
export type SimulatorMethod='catalog.get'|'device.getStatus'|'session.start'|'session.getState'|'session.setLayout'|'session.confirmSetup'|'session.setQuantity'|'payment.mockComplete'|'capture.startSequence'|'selection.toggle'|'selection.confirm'|'frame.list'|'frame.select'|'frame.confirm'|'print.confirmDryRun'|'session.back'|'session.cancel'|'session.finish';

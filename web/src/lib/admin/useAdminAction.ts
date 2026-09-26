"use client";

// Re-exports the shared hook under its original admin-facing name so every
// existing admin form keeps working unchanged. The implementation moved to
// lib/useAsyncAction.ts once the identical hang bug showed up on the public
// checkout button too — see that file for the full explanation.
export { useAsyncAction as useAdminAction, type AsyncActionState as AdminActionState } from "@/lib/useAsyncAction";

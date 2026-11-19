// Enquiry-to-project workflow. Pure data, safe to import from client and server.

export const STAGES = [
  "new_enquiry", "under_review", "awaiting_info", "quotation_prepared", "quotation_sent", "negotiation",
  "awaiting_acceptance", "awaiting_payment", "booking_confirmed", "in_progress", "awaiting_review", "completed", "cancelled", "archived",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  new_enquiry: "New enquiry",
  under_review: "Under review",
  awaiting_info: "Awaiting additional information",
  quotation_prepared: "Quotation prepared",
  quotation_sent: "Quotation sent",
  negotiation: "Negotiation in progress",
  awaiting_acceptance: "Awaiting client acceptance",
  awaiting_payment: "Awaiting payment or deposit",
  booking_confirmed: "Booking confirmed",
  in_progress: "Project in progress",
  awaiting_review: "Awaiting client review",
  completed: "Completed",
  cancelled: "Cancelled",
  archived: "Archived",
};

/** Allowed manual moves. Sending a quotation and confirming a booking have their own guarded actions. */
export const TRANSITIONS: Record<Stage, Stage[]> = {
  new_enquiry: ["under_review", "awaiting_info", "quotation_prepared", "cancelled", "archived"],
  under_review: ["awaiting_info", "quotation_prepared", "cancelled", "archived"],
  awaiting_info: ["under_review", "quotation_prepared", "cancelled", "archived"],
  quotation_prepared: ["under_review", "cancelled"],
  quotation_sent: ["negotiation", "awaiting_acceptance", "awaiting_payment", "quotation_prepared", "cancelled"],
  negotiation: ["quotation_prepared", "awaiting_acceptance", "awaiting_payment", "cancelled"],
  awaiting_acceptance: ["negotiation", "quotation_prepared", "awaiting_payment", "cancelled"],
  awaiting_payment: ["negotiation", "cancelled"],
  booking_confirmed: ["in_progress", "cancelled"],
  in_progress: ["awaiting_review", "cancelled"],
  awaiting_review: ["in_progress", "completed"],
  completed: ["archived"],
  cancelled: ["under_review", "archived"],
  archived: ["under_review"],
};

/** Stages the confirm-booking action may start from. */
export const CONFIRMABLE: Stage[] = ["quotation_sent", "negotiation", "awaiting_acceptance", "awaiting_payment"];

/** Keeps the original bookings.status in step so existing screens and the CSV export stay meaningful. */
export function stageToStatus(stage: Stage): "pending" | "confirmed" | "completed" | "cancelled" | null {
  switch (stage) {
    case "booking_confirmed": case "in_progress": case "awaiting_review": return "confirmed";
    case "completed": return "completed";
    case "cancelled": return "cancelled";
    case "archived": return null; // leave the existing status alone
    default: return "pending";
  }
}

/** Stage moves that tell the client something has actually happened. */
export const CLIENT_NOTIFY_STAGES: Partial<Record<Stage, { subject: string; heading: string; body: string }>> = {
  in_progress: { subject: "Your Project Has Started | Ominet Digital", heading: "Your project has started", body: "Work on your project has now begun. We will keep you informed and reach out if we need anything from you." },
  awaiting_review: { subject: "Your Project Is Ready for Review | Ominet Digital", heading: "Your project is ready for review", body: "The work is ready for your review. Please look through it and send us your consolidated feedback within the agreed revision scope." },
  completed: { subject: "Project Completion and Delivery | Ominet Digital", heading: "Your project is complete", body: "Your project has been completed. Thank you for working with Ominet Digital. Please reply to this email if you need anything further." },
};

export type Milestone = { title: string; due?: string; amount?: string };

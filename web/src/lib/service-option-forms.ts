// Conditional questions for the NYSC and CAC request forms. The same definitions are used by the browser
// (to decide what to show) and by the server (to decide what is required and what may be stored).
import type { Flavour } from "@/lib/service-options";

export type OField = {
  key: string; label: string; type?: "text" | "textarea" | "select"; options?: string[]; required?: boolean; help?: string; max?: number;
  when?: (optionKeys: string[]) => boolean;
};

const any = (keys: string[], ...prefixes: string[]) => keys.some((k) => prefixes.some((p) => k.startsWith(p)));

export const NYSC_FIELDS: OField[] = [
  { key: "stateOfOrigin", label: "State of origin", required: true },
  { key: "stateOfDeployment", label: "Current state of deployment", help: "Where you are currently posted, if you have been posted.", when: (k) => !k.includes("direct-posting") },
  { key: "batchStream", label: "NYSC batch and stream", required: true, help: "For example 2026 Batch B, Stream II." },
  { key: "callUpNumber", label: "Call-up number or NYSC identification details", required: true },
  { key: "currentPpa", label: "Current PPA", when: (k) => !k.includes("direct-posting"), help: "Your current place of primary assignment." },
  { key: "preferredPostingLocation", label: "Preferred posting location", when: (k) => k.includes("direct-posting") || k.includes("relocation") || k.includes("reposting") },
  { key: "preferredPpa", label: "Preferred PPA", when: (k) => k.includes("ppa-posting"), help: "Name the organisation, if you already have one in mind." },
  { key: "reason", label: "Reason for the request", type: "textarea", required: true },
  { key: "additional", label: "Additional information", type: "textarea" },
];

const BN = (k: string[]) => any(k, "bn-");
const BN_NEW = (k: string[]) => k.includes("bn-availability") || k.includes("bn-registration");
const CO = (k: string[]) => any(k, "co-");
const IT = (k: string[]) => any(k, "it-");
const PR = (k: string[]) => any(k, "pr-");
const DOC = (k: string[]) => any(k, "doc-");

export const CAC_FIELDS: OField[] = [
  { key: "businessName", label: "Business or proposed business name", required: true },
  { key: "altBusinessName", label: "Alternative name", when: (k) => BN_NEW(k) || CO(k) || IT(k), help: "A second choice, in case the first is not available." },
  { key: "businessActivity", label: "Business activity", type: "textarea", when: (k) => BN_NEW(k) || CO(k) },
  { key: "businessAddress", label: "Business address", type: "textarea", required: true },
  { key: "registrationType", label: "Registration type", type: "select", options: ["Business name", "Private company limited by shares", "Other company category", "Incorporated trustees", "Not sure yet"], when: (k) => BN_NEW(k) || CO(k) || IT(k) },
  { key: "proprietor", label: "Proprietor's full name", required: true, when: (k) => k.includes("bn-registration") },
  { key: "directors", label: "Directors: full names, roles and contact details", type: "textarea", required: true, when: (k) => CO(k) },
  { key: "shareholders", label: "Shareholders and share allocation", type: "textarea", required: true, when: (k) => CO(k) },
  { key: "shareCapital", label: "Proposed share capital", when: (k) => CO(k) },
  { key: "registeredOffice", label: "Registered office address", type: "textarea", when: (k) => CO(k) },
  { key: "organisationAims", label: "Aims and objectives of the organisation", type: "textarea", required: true, when: (k) => IT(k) },
  { key: "trustees", label: "Trustees: full names and roles", type: "textarea", required: true, when: (k) => IT(k) },
  { key: "cacNumber", label: "Existing CAC registration number", required: true, when: (k) => PR(k) || DOC(k) || k.includes("bn-update") || k.includes("bn-status") },
  { key: "changeDetails", label: "Details of the change or request", type: "textarea", required: true, when: (k) => PR(k) || DOC(k) || k.includes("bn-update") || k.includes("bn-status") },
  { key: "additional", label: "Additional information", type: "textarea" },
];

export const fieldsFor = (flavour: Flavour, optionKeys: string[]): OField[] =>
  (flavour === "nysc" ? NYSC_FIELDS : CAC_FIELDS).filter((f) => !f.when || f.when(optionKeys));

export const FLAVOUR_COPY: Record<Flavour, { question: string; multi: boolean; prefix: string; kind: string; short: string; notice: string }> = {
  nysc: {
    question: "Which NYSC service do you require?", multi: false, prefix: "NYS", kind: "nysc_request", short: "NYSC",
    notice: "Ominet Digital is an independent business, not the NYSC. Assistance is subject to eligibility and applicable procedures, and approval rests with the relevant NYSC authorities. Times shown are estimates, not guarantees. Charges and professional fees are communicated to you before any payment.",
  },
  cac: {
    question: "Which CAC service do you require?", multi: true, prefix: "CAC", kind: "cac_request", short: "CAC",
    notice: "Ominet Digital is an independent business, not the Corporate Affairs Commission. Services are subject to applicable CAC requirements, documentation and availability. Official CAC charges, where they apply, are shown separately from our professional fees in your quotation.",
  },
};

export const SECURITY_NOTICE = "Never send us your passwords, PINs or OTPs. We will never ask for them.";

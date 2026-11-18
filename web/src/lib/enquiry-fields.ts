// Service-specific questions for the Discuss a Project form. Shown only for the
// services the client selects (source: Phase 2 specification, section 7).
// Matching is by words in the service slug/title so new or renamed services
// still get a sensible set instead of silently getting none.

export type EnquiryField = { key: string; label: string; type?: "text" | "textarea" | "date" | "number"; placeholder?: string };
export type ServiceFieldGroup = { id: string; match: RegExp; title: string; fields: EnquiryField[] };

export const SERVICE_FIELD_GROUPS: ServiceFieldGroup[] = [
  {
    id: "writing", match: /ghost|writing/i, title: "Writing and ghostwriting",
    fields: [
      { key: "writingType", label: "Type of writing" },
      { key: "wordCount", label: "Estimated word count" },
      { key: "genre", label: "Genre or subject" },
      { key: "existingMaterial", label: "Existing outline or manuscript", type: "textarea" },
      { key: "interviews", label: "Interview requirements", type: "textarea" },
      { key: "completionDate", label: "Expected completion date", type: "date" },
    ],
  },
  {
    id: "research", match: /research|academic/i, title: "Research and academic support",
    fields: [
      { key: "researchTopic", label: "Research topic" },
      { key: "academicLevel", label: "Academic level or research type" },
      { key: "documentLength", label: "Document length" },
      { key: "referencingStyle", label: "Referencing style" },
      { key: "guidelines", label: "Institutional guidelines", type: "textarea" },
      { key: "submissionDeadline", label: "Submission deadline", type: "date" },
    ],
  },
  {
    id: "publishing", match: /publish|format/i, title: "Book publishing and formatting",
    fields: [
      { key: "manuscriptLength", label: "Manuscript length" },
      { key: "formats", label: "Desired formats (Kindle, EPUB, paperback, hardcover)" },
      { key: "trimSize", label: "Trim size" },
      { key: "coverNeeded", label: "Cover design required?" },
      { key: "platform", label: "Publishing platform" },
    ],
  },
  {
    id: "design", match: /graphic|brand identity|design & brand/i, title: "Graphic design",
    fields: [
      { key: "designType", label: "Design type" },
      { key: "designCount", label: "Number of concepts or deliverables" },
      { key: "dimensions", label: "Dimensions" },
      { key: "brandGuidelines", label: "Brand guidelines available?" },
      { key: "fileFormats", label: "Required file formats" },
    ],
  },
  {
    id: "video", match: /video|film/i, title: "Video editing",
    fields: [
      { key: "footageDuration", label: "Footage duration" },
      { key: "finalRuntime", label: "Expected final runtime" },
      { key: "videoCount", label: "Number of videos" },
      { key: "editingNeeds", label: "Editing requirements", type: "textarea" },
      { key: "platformResolution", label: "Platform and resolution" },
    ],
  },
  {
    id: "photo", match: /photo/i, title: "Photography",
    fields: [
      { key: "photoCategory", label: "Photography category" },
      { key: "location", label: "Location" },
      { key: "shootDate", label: "Date", type: "date" },
      { key: "subjects", label: "Number of subjects or products" },
      { key: "editedImages", label: "Expected number of edited images" },
    ],
  },
  {
    id: "presentation", match: /presentation|slide/i, title: "Presentation design",
    fields: [
      { key: "slideCount", label: "Number of slides" },
      { key: "presentationPurpose", label: "Presentation purpose" },
      { key: "audience", label: "Audience" },
      { key: "presentationFormat", label: "Required format" },
      { key: "presentationDeadline", label: "Deadline", type: "date" },
    ],
  },
  {
    id: "marketing", match: /marketing|author branding/i, title: "Book marketing",
    fields: [
      { key: "bookTitle", label: "Book title" },
      { key: "publicationStatus", label: "Publication status" },
      { key: "campaignDuration", label: "Campaign duration" },
      { key: "targetPlatforms", label: "Target platforms" },
      { key: "promoMaterials", label: "Promotional materials required", type: "textarea" },
    ],
  },
  {
    id: "social", match: /social|carousel/i, title: "Social media and carousel design",
    fields: [
      { key: "socialPlatform", label: "Platform" },
      { key: "designCountSocial", label: "Number of designs" },
      { key: "slidesPerCarousel", label: "Number of carousel slides" },
      { key: "contentReady", label: "Content availability" },
      { key: "campaignSchedule", label: "Campaign schedule" },
    ],
  },
  {
    id: "website", match: /website|digital communication/i, title: "Website content",
    fields: [
      { key: "websiteUrl", label: "Website URL" },
      { key: "pageCount", label: "Number of pages" },
      { key: "contentNeeds", label: "Content requirements", type: "textarea" },
      { key: "seoNeeds", label: "SEO requirements" },
      { key: "deliverySchedule", label: "Delivery schedule" },
    ],
  },
];

/** The field group for a service. Order matters: more specific groups are listed first where words overlap. */
export function groupForService(service: { slug: string; title: string }): ServiceFieldGroup | null {
  const hay = `${service.slug} ${service.title}`;
  const order = ["publishing", "marketing", "social", "design", "video", "photo", "presentation", "research", "website", "writing"];
  for (const id of order) {
    const g = SERVICE_FIELD_GROUPS.find((x) => x.id === id)!;
    if (g.match.test(hay)) return g;
  }
  return null;
}

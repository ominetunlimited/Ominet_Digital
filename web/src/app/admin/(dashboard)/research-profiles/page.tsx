import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import ResearchProfilesManager from "@/components/admin/ResearchProfilesManager";
import { mapProfile } from "@/lib/research";

export const metadata = { title: "Research profiles — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function ResearchProfilesPage() {
  const supabase = await createClient();
  const { data, error } = supabase
    ? await supabase.from("research_profiles").select("*").order("display_order")
    : { data: null, error: null };

  const missingTable = error && /research_profiles/.test(error.message);

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Research profiles</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-6);max-width:60ch;")}>
        Your Google Scholar, ResearchGate, Academia.edu and ORCID pages. Each link is checked to be a real profile on that platform, and you choose where it appears.
      </p>
      {missingTable ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>
          The research_profiles table doesn&apos;t exist yet. Run 0014_research_profiles.sql in the Supabase SQL Editor, then reload this page.
        </p>
      ) : error ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>Couldn&apos;t load the links: {error.message}</p>
      ) : (
        <ResearchProfilesManager initial={(data ?? []).map(mapProfile)} />
      )}
    </div>
  );
}

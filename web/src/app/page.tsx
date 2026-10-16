  const jsonLd = jsonLdGraph([
    { "@type": "WebSite", "@id": WEBSITE_ID, name: SITE_NAME, url: SITE_URL, publisher: { "@id": ORG_ID } },
    getOrganizationSchema(SITE_NAME, "/icon.svg"),
    personSchema,
  ]);

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-teal-light);")}>
        <div style={css("max-width:1280px;margin:0 auto;border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-lg);display:flex;flex-wrap:wrap;min-height:520px;")}>
          <div style={css("flex:1 1 380px;background:var(--om-navy);color:#eafaf0;padding:var(--space-8);display:flex;flex-direction:column;justify-content:center;gap:var(--space-4);")}>
            <Image src="/images/ominet-digital-logo-new.svg" alt="Ominet Digital" width={64} height={49} priority style={css("display:block;")} />

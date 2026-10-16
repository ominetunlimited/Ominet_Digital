        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-8)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, letterSpacing: "0.02em", color: "#fff" }}>
              <Image src="/images/ominet-digital-logo-new.svg" alt="Ominet Digital" width={30} height={23} style={{ display: "block" }} />
              OMINET DIGITAL
            </span>
            <button ref={closeButtonRef} type="button" className="btn btn-ghost btn-icon" aria-label="Close menu" onClick={() => setMenuOpen(false)} style={{ color: "#eafaf0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

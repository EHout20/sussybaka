# Future enhancements (backlog)

Prioritize based on your practice size, risk tolerance, and compliance needs.

1. **Scheduling**
   - Drag-and-drop week/month calendar, operatory/column resources, and conflict detection
   - Recurring maintenance appointments and provider time-off
   - Two-way patient self-scheduling with rules (new vs existing patients)

2. **Reminders and communications**
   - Supabase Edge Function + queue for SMS (Twilio) and email, with per-channel consent
   - Template library and localization

3. **Clinical**
   - Full odontogram UI (tooth/surface/condition) and imaging bridge (DICOM/PACS) placeholders only here
   - Perio charting, medical history form versioning, drug interaction flags (licensed data source)

4. **Billing and revenue cycle**
   - Real payment provider (Stripe, etc.) with PCI scope document
   - EDI/837/835 or clearinghouse integration for real claims; ERA posting
   - Patient payment plans, estimates from fee schedules, and UCR vs contracted rates

5. **Security and compliance**
   - Step-up re-auth for high-risk actions, device/session management
   - Immutable audit to WORM or external log store, retention policies
   - Data residency and cross-border options if required
   - Penetration testing and annual risk assessment

6. **Operations**
   - Admin UI for user provisioning, role changes (service role or privileged Edge Function, not public signup)
   - Export for continuity (encrypted backup of key tables)
   - Multi-location practices and org hierarchy

7. **Quality and UX**
   - Offline-tolerant UI for front desk, keyboard shortcuts, full accessibility audit (WCAG 2.1 AA)
   - Mobile app shell (Expo) reading the same API with PKCE

8. **Analytics**
   - Cohort and recall metrics, FMX compliance, unscheduled treatment from `treatment_items`

This list is not exhaustive; legal and clinical stakeholders should own prioritization for production systems.

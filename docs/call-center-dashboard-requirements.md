# Call Center Dashboard Requirements

Status: Collecting requirements. Awaiting the owner's explicit instruction to summarize and create a complete improvement plan.

## Recording instructions

- Record the owner's requirements step by step as they are provided.
- Preserve all details, user roles, permissions, workflows, and structural requirements without inventing missing requirements.
- Record later corrections explicitly and identify which earlier requirements they replace.
- Do not summarize or create an improvement or implementation plan until the owner explicitly requests it.
- When requested, summarize the collected requirements and prepare a complete plan to improve the Call Center Dashboard.

## Project boundaries

- This work concerns Attaie Properties V2.
- Follow the existing website and CRM design foundations, bilingual English/Dari support, accessibility, and RTL behavior.
- Development and database operations must target V2 and its separate testing environment. V1 remains protected.
- Preserve existing V2 data unless a destructive change is explicitly authorized.

## Universal dashboard rules

Source: [Marketing and Production Department Dashboard Requirements](marketing-production-dashboard-requirements.md), Universal dashboard rules and requirements 13–16. These include the owner-confirmed amendment to the original Sales rules.

### UDR-001 — Website database isolation and role-limited CRM access

- Admin is the only dashboard permitted to access the main website database.
- Every other dashboard must not fetch data from, read, write, update, or delete anything in the main website database.
- Every non-Admin dashboard must fetch its data from a separate database dedicated to the internal office CRM.
- Each role's access within the internal CRM must be limited to that role's permissions.

### UDR-002 — Tasks tab on every dashboard

- Every dashboard must have a Tasks tab, including the Call Center Dashboard.
- Task workflows and role permissions have not yet been specified.

### UDR-003 — Shared submission database and Admin isolation

- This owner-confirmed amendment replaces the earlier assumption that non-Admin dashboards may use only the internal office CRM database.
- Use three separate MySQL databases: website, internal office CRM, and submission.
- Only Admin may access the website database.
- Admin may access the website and submission databases, but must not access the internal office CRM database.
- Non-Admin departments keep internal workflow data in the internal office CRM database, with role-limited permissions.
- Marketing may submit posts to the submission database and view their publishing status.
- Admin may review submissions there and approve them for publishing through the website database.
- Call Center, Management, Finance, and Sales have read-only access to submissions and publishing statuses.
- Submitted material includes five property photos, property information, and a serial number.
- Track Submitted, Approved, Published, and Rejected separately. Approved does not mean Published.
- The Editor's Posted action closes the marketing entry; it does not confirm website publication.
- The submission database provides the handoff to Admin. Admin must not read submissions from the internal office CRM database.

## Requirements log

1. **Universal Tasks tab:** Every dashboard must have a Tasks tab. This includes the Call Center Dashboard. Task workflows and role permissions are awaiting the owner's requirements.
2. **Project data for lead entry:** The Call Center user must be able to fetch project data from MySQL and enter that project information into a lead. Under UDR-001, this data must come from the separate internal office CRM database. The project fields and how project information is entered into the lead have not yet been specified.
3. **Universal rules update from Marketing:** Apply UDR-003 above. Call Center also has read-only access to the separate submission database to view submissions and website publishing statuses. This amends the earlier universal database-only restriction; it does not change requirement 2's recorded source for project data used in leads.

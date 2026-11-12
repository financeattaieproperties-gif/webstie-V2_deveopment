# Engineering Department Dashboard — Requirements Log

## Recording instructions

- Record the owner's requirements step by step as they are provided.
- Preserve details, user roles, permissions, workflows, relationships, and structural requirements.
- Keep proposed ideas and unresolved questions distinct from confirmed requirements.
- Wait until the owner explicitly says to summarize before producing the consolidated summary and complete implementation plan.
- The final plan must cover the complete dashboard, its users, and its structure.

## Confirmed requirements

### Universal dashboard rules

Source: [Marketing and Production Department Dashboard Requirements](marketing-production-dashboard-requirements.md), “Universal dashboard rules” and its owner-confirmed database clarification. These rules apply to the Engineering Department Dashboard as well.

#### UDR-001 — Website database isolation and role-limited CRM access

Owner requirement: This is a benchmark and universal rule for every dashboard, not only the Sales Dashboard.

- Admin is the only dashboard permitted to access the main website database.
- Every other dashboard must not fetch data from, read, write, update, or delete anything in the main website database.
- Every non-Admin dashboard must fetch its data from a separate database dedicated to the internal office CRM.
- Each role's access within the internal CRM must be limited to that role's permissions.

#### UDR-002 — Tasks tab on every dashboard

- Every dashboard must include a Tasks tab.
- This universal rule applies to all dashboards, including the Engineering Department Dashboard.
- Task behavior, workflows, and permissions have not yet been specified.

#### UDR-003 — Shared submission database and Admin isolation

Owner-confirmed amendment to UDR-001: Non-Admin departments may also access the separate submission database according to their specified permissions. Their internal workflow data remains in the internal office CRM database. Admin may access the website and submission databases, but must not access the internal office CRM database. Only Admin may access the website database.

The three databases have distinct purposes:

- **Website database:** Only Admin may access it for website publishing.
- **Internal office CRM database:** Stores department workflows and tasks. Admin must not access it.
- **Submission database:** A separate third MySQL database stores Marketing submissions, including five property photos, property information, serial number, and website publishing status.

Confirmed submission permissions from the Marketing requirements:

- Marketing may submit posts and view publishing status.
- Admin may review submissions and approve them for publishing through the website database.
- Call Center, Management, Finance, and Sales have read-only access to submissions and publishing statuses.
- Engineering's submission database permissions have not yet been specified; no access is assumed.

Website publishing statuses are **Submitted**, **Approved**, **Published**, and **Rejected**. Approved does not mean Published. The Editor's **Posted** action closes the marketing entry and does not confirm website publication.

This amendment replaces any interpretation of UDR-001 that restricts all non-Admin data access exclusively to the internal CRM database. Admin receives submitted material through the submission database, without accessing the internal CRM database.

#### UDR-004 — Agent lead privacy

- Call Center agent users and Sales Agent users must not see one another's leads.
- Lead visibility must be isolated per agent, including between agents in the same department and across the Call Center and Sales departments.
- Visibility permissions for team leaders, managers, and other roles have not yet been specified.

### Engineering requirements log

1. **Universal database and access boundary:** Apply UDR-001 to the Engineering Department Dashboard. Specific role permissions will be recorded as the owner provides them.
2. **Universal Tasks tab:** Apply UDR-002. Every dashboard must include a Tasks tab.
3. **Engineering Department roles:** The department has three roles:
   - Architect
   - Graphic Designer
   - 3D Visualization Engineer
   Responsibilities, permissions, and role-specific workflows will be recorded as the owner provides them.

4. **Architect responsibilities:** The Architect is responsible for creating new plans for projects. These can include furnished 3D renderings and other project plan formats; the responsibility is not limited to one format.

5. **Graphic Designer responsibilities:** The Graphic Designer is responsible for creating posters, flyers, brochures, banners, and booklets for projects.
6. **Updated universal database rules:** Apply UDR-003 from the Marketing requirements, including the three-database structure and Admin isolation from the internal CRM database.

## Open questions

- Engineering Department permissions for the submission database remain unspecified.

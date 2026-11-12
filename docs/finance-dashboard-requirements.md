# Finance Dashboard Requirements

Status: Collecting requirements.

## Recording instructions

- Record each requirement as the owner provides it, step by step.
- Preserve details, corrections, user roles, permissions, workflows, and structural requirements as they are provided.
- Do not summarize requirements or create the implementation plan until the owner explicitly requests a summary.
- When requested, summarize the collected requirements and create a complete dashboard implementation plan covering its users and structure.
- This dashboard belongs to the V2 project and follows the repository's V2 environment and deployment boundaries.

## Universal dashboard rules

Source: [Marketing and Production Dashboard requirements](marketing-production-dashboard-requirements.md), Universal dashboard rules and submission database permissions (requirement 14). Updated at the owner's request; this replaces the earlier Sales-only source reference.

### UDR-001 — Website database isolation and role-limited CRM access

Owner requirement: This is a benchmark and universal rule for every dashboard, not only the Sales Dashboard.

- Admin is the only dashboard permitted to access the main website database.
- Every other dashboard must not fetch data from, read, write, update, or delete anything in the main website database.
- Every non-Admin dashboard must fetch its data from a separate database dedicated to the internal office CRM.
- Each role's access within the internal CRM must be limited to that role's permissions.

### UDR-002 — Tasks tab on every dashboard

- Every dashboard must include a Tasks tab.
- Task workflows and permissions remain to be specified by the owner.

### UDR-003 — Shared submission database and Admin isolation

Owner-confirmed amendment to UDR-001: Non-Admin departments may also access the separate submission database according to their permissions. Their internal workflow data remains in the internal office CRM database. Admin may access the website and submission databases, but must not access the internal office CRM database. Only Admin may access the website database.

Submission database permissions imported from Marketing requirement 14:

- Marketing may submit posts and view their publishing status.
- Admin may review submissions and approve them for publishing through the website database.
- Call Center, Management, Finance, and Sales have read-only access to submissions and publishing statuses, so every department can know which posts are on the website.
- Marketing and other non-Admin departments must not access the website database.

## Requirements

1. **Universal database and access boundary:** Apply UDR-001 to the Finance Dashboard. Specific Finance role permissions will be recorded as the owner provides them.
2. **Tasks tab:** The Finance Dashboard must include a Tasks tab, as required for every dashboard by UDR-002.
3. **Finance data visibility and permissions:** Finance data must be visible only to Management and the Finance user. Management has read-only access. The Finance user has full access to finance data. Other users must not be able to view finance data. These permissions remain subject to UDR-001's database isolation boundary.
4. **Finance roles:** There are two Finance roles: **Finance Manager** and **Finance Assistant**. This clarifies the earlier generic "Finance user" reference in requirement 3. The owner has not yet specified how full access is allocated between these two roles; record their individual permissions when provided. Management's read-only access remains as recorded.
5. **Universal rules update from Marketing:** Apply UDR-001 as amended by UDR-003. Finance internal workflows use the internal office CRM database; Finance also has read-only access to the separate submission database's submissions and publishing statuses. Admin has no access to the internal office CRM database. This amends requirement 1's original database boundary; the finance data visibility restrictions in requirement 3 remain in effect.
6. **Contract installment tracking:** Finance must track the installments associated with contracts.
7. **Customer deposits:** Finance must handle and record deposits received from customers. The owner described this as "make the deposits from the customers"; the detailed deposit workflow remains to be specified.

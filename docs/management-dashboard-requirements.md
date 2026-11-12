# Management Dashboard Requirements

Status: Collecting requirements. Awaiting the owner's instruction to summarize and create a complete improvement plan.

## Recording instructions

- Record each requirement step by step as the owner provides it.
- Preserve all provided details, user roles, permissions, workflows, and structural requirements without inventing missing requirements.
- Record later corrections explicitly and identify the requirements they replace.
- Do not summarize requirements or create an implementation plan until the owner explicitly requests it.
- When requested, summarize the collected requirements and create a complete plan to improve the Management Dashboard, covering its users, permissions, workflows, and structure.

## Project boundaries

- This work concerns Attaie Properties V2 and its separate testing environment and database. V1 remains protected.
- Follow the existing website and CRM design foundations, English/Dari support, and RTL behavior.

## Universal dashboard rules

Source: [Marketing and Production Department Dashboard requirements](marketing-production-dashboard-requirements.md), Universal dashboard rules and requirements 13–16. Updated at the owner's request; includes amendments to the original Sales rules.

### UDR-001 — Website database isolation and role-limited CRM access

- Admin is the only dashboard permitted to access the main website database.
- Every other dashboard must not fetch data from, read, write, update, or delete anything in the main website database.
- Every non-Admin dashboard must fetch its data from a separate database dedicated to the internal office CRM.
- Each role's access within the internal CRM must be limited to that role's permissions.

### UDR-002 — Tasks tab on every dashboard

- Every dashboard must include a Tasks tab.
- Task workflows and permissions remain to be specified by the owner.

### UDR-003 — Shared submission database and Admin isolation

Owner-confirmed amendment to UDR-001: Non-Admin departments may also access a separate third MySQL submission database according to the permissions below. Internal workflow data remains in the internal office CRM database. This amends the earlier CRM-only data-source requirement; it does not permit non-Admin access to the website database.

- Admin may access the website and submission databases, but must not access the internal office CRM database.
- Only Admin may access the website database.
- Marketing may submit posts and view their publishing status in the submission database.
- Admin may review submissions and approve them for publishing through the website database.
- Call Center, Management, Finance, and Sales have read-only access to submissions and publishing statuses.
- The submission database stores the five property photos, property information, serial number, and website publishing status.
- Website publishing statuses are Submitted, Approved, Published, and Rejected. Approved does not mean Published.
- The Editor's Posted action closes the marketing entry; it does not by itself confirm website publication.

## Requirements log

1. **Universal database and access boundary:** Apply UDR-001 as amended by UDR-003 to the Management Dashboard. Management uses the internal office CRM for internal workflows and has read-only access to the separate submission database. Management cannot access the website database. Further Management role permissions will be recorded as the owner provides them.

2. **Manager project and property entry:** The Manager user is responsible for adding or entering new projects and properties for sale, and updating existing projects and properties for sale. This responsibility remains subject to UDR-001: the Management Dashboard uses the separate internal office CRM database and cannot access the main website database.

3. **Exclusive department user creation:** Only the Manager role can add new users to departments. No other role may create department users. Owner clarification in requirement 6 replaces the earlier department-wide wording, "Only Management."

4. **Universal Tasks tab:** The Management Dashboard must include a Tasks tab under UDR-002. Task workflows and permissions remain to be specified by the owner.

5. **Management department roles:** The Management Dashboard has two roles:
   - Manager
   - HR Manager
   The existing Management access belongs to Manager, as clarified in requirement 6. HR Manager permissions and responsibilities remain to be specified by the owner.

6. **Existing access assigned to Manager (owner clarification):** All current Management access and permissions belong to the Manager role. This includes the previously recorded project/property entry and update permissions and exclusive department user creation permission. Do not automatically grant these permissions to HR Manager. This clarification resolves the role assignment left open in requirement 5 and replaces earlier department-wide access wording where it implied access for both roles. Universal dashboard and database boundaries continue to apply to both roles.

7. **Manager project and apartment entry:** The Manager inserts new projects and their apartments. This extends requirement 2 by explicitly including apartments belonging to each project.

8. **HR Manager deal contracts:** The HR Manager creates contracts for deals.

9. **HR Manager deal installments:** The HR Manager enters installments for a deal. Requirements 8 and 9 establish these HR Manager responsibilities; they replace the earlier statement that all HR Manager permissions and responsibilities were still unspecified. Other HR Manager permissions remain to be specified.

10. **Existing HR contract system reference (owner-provided):** Use the owner's [Attaie Properties contract system repository](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system) as the reference for the contract system and structure wanted in the HR Dashboard. The existing web app creates apartment presale contracts and records their installments. Focus on this contract system and structure; ignore the reference app's Finance and Admin users and their workflows. This instruction does not grant HR Manager the reference app's Finance or Admin permissions. Continue collecting requirements; do not implement or produce the complete improvement plan yet.

11. **Manager supplies project parties (owner clarification):** The Manager enters new projects with their seller information and construction company information, along with the projects' apartments. HR uses this project and apartment information when creating a contract. Specific seller and construction company fields remain to be provided by the owner.

12. **HR contract entry scope (owner clarification):** HR Manager creates the contract for an apartment, fills in the buyer information, and enters the deal's installments. Project, seller, construction company, and apartment information comes from the records entered by Manager. This clarifies requirements 7–9; it does not grant HR project or apartment creation permissions.

13. **New Manager project and apartment wizard:** Do not include or reuse the referenced GitHub repository's project-adding or apartment-adding wizard for Manager entry. Build a new wizard component that lets Manager easily add new projects, their details, and their apartments. Its detailed fields, steps, and interactions remain to be collected. The GitHub reference remains applicable to HR contract creation and installment structure, subject to these role boundaries. This requirement supersedes any interpretation of requirement 10 or the reference observations that would adopt the repository's project/apartment creation interface. Record this for the later improvement plan; implementation is not requested yet.

14. **Department creation and department users:** The Manager can add new departments and add new users to those departments. This extends requirement 3 with department creation and explicitly associates each new user with the selected department. Per requirement 6, this Management access belongs to Manager; it is not automatically granted to HR Manager.

## Contract system reference observations

Read-only source review at commit `afb9908bc2fe765c5b40e0f00d87e3874b1f0a6f`. The details below document the referenced implementation for later planning; they do not independently grant permissions or settle unspecified workflows.

- **Contract entry structure:** [ContractWizard.tsx](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/afb9908bc2fe765c5b40e0f00d87e3874b1f0a6f/src/components/ContractWizard.tsx) has four steps: project and apartment selection; buyer information and 3×4 portrait; installments and financial schedule; review and contract issuance. It supports draft saving and contract preview.
- **Project and apartment linkage:** The selected project/apartment supplies sellers and the construction responsible person in the reference implementation. Apartment details include serial number, apartment number, rooms, address, area, floor, direction, four boundaries, price per square meter, and total price. For this dashboard, Manager supplies project sellers and construction company information under requirement 11. The reference's construction responsible person model does not settle the new construction company fields. Manager entry uses a new wizard under requirement 13; the reference app's project/apartment adding wizard is excluded.
- **Parties and contract data:** [types.ts](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/afb9908bc2fe765c5b40e0f00d87e3874b1f0a6f/src/types.ts) defines sellers, a construction responsible person, and one or more buyers. Party data includes name, Tazkira, father's name, lineage/family name, birth date, permanent/current residence, and portrait. Buyer phone is supported; seller phone and share percentage are excluded in the wizard. Contract data includes contract and apartment serial numbers, Gregorian/Jalali dates, property description, area, unit/total price, currency, sales agent name, clauses, notes, realtor details, and linked documents.
- **Installment structure:** Each installment includes its number, description, percentage, due date (nullable), scheduled amount, paid amount, and status. The wizard recalculates scheduled amounts from total contract price and percentages, and requires percentages to total 100% before continuing to review. Its sample schedule values and dates are reference defaults, not owner-confirmed requirements for this dashboard. Payment collection and recording permissions are not inferred from these fields.
- **Contract output:** [ContractPrintView.tsx](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/afb9908bc2fe765c5b40e0f00d87e3874b1f0a6f/src/components/ContractPrintView.tsx) provides preview, A4 printing, and PDF download, normally arranged as two pages. It includes party portraits, property details, clauses, installment table, signatures/thumbprints, and company seal areas. This source review does not verify runtime rendering or legal content.
- **Contract organization:** [ContractList.tsx](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/afb9908bc2fe765c5b40e0f00d87e3874b1f0a6f/src/components/ContractList.tsx) supports searching contracts and filtering by project/status. Existing approval, locking, visibility, and status-change permissions are not adopted automatically; HR workflow permissions remain subject to the owner's instructions.
- **Integration boundary:** The reference app's Admin/Finance roles, approval routing, payment handling, authentication, and database arrangement do not replace this project's role rules or UDR-001 through UDR-003. HR contracts and installments belong to internal CRM workflows; HR must not access the website database.

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

10. **Existing HR contract system reference (owner-provided; Finance scope later extended):** Use the owner's [Attaie Properties contract system repository](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system) as the reference for the contract system and structure wanted in the HR Dashboard. The existing web app creates apartment presale contracts and records their installments. The original instruction excluded Finance and Admin workflows. Requirement 28 and Finance requirements 8–12 now extend the reference scope to the Finance payment tracker; Admin workflows remain excluded. This instruction does not grant HR Manager the reference app's Finance or Admin permissions. Continue collecting requirements; do not implement or produce the complete improvement plan yet.

11. **Manager supplies project parties (historical; party-entry responsibility superseded by requirement 23):** The earlier instruction assigned seller and construction company information entry to Manager along with project/apartment creation. Requirement 23 replaces that party-entry assignment: HR now supplies seller and construction company representative information after Manager creates the project. Manager retains project and apartment creation.

12. **HR contract entry scope (amended by requirements 23–26):** HR Manager creates the contract for an apartment, fills in buyer information, and enters the deal's installments. Manager supplies project/apartment inventory; HR supplies seller and construction company representative information and apartment surroundings before agreement creation. This clarifies requirements 7–9 and replaces the earlier statement that all party information comes from Manager. It does not grant HR project or apartment creation permissions.

13. **New Manager project and apartment wizard:** Do not include or reuse the referenced GitHub repository's project-adding or apartment-adding wizard for Manager entry. Build a new wizard component that lets Manager easily add new projects, their details, and their apartments. Its detailed fields, steps, and interactions remain to be collected. The GitHub reference remains applicable to HR contract creation and installment structure, subject to these role boundaries. This requirement supersedes any interpretation of requirement 10 or the reference observations that would adopt the repository's project/apartment creation interface. Record this for the later improvement plan; implementation is not requested yet.

14. **Department creation and department users:** The Manager can add new departments and add new users to those departments. This extends requirement 3 with department creation and explicitly associates each new user with the selected department. Per requirement 6, this Management access belongs to Manager; it is not automatically granted to HR Manager.

15. **Exclusive project creation and Sales Agent assignment (owner clarification, 2026-11-12):** Only Manager may add projects and assign a Sales Agent to a project. This makes project creation explicitly exclusive to Manager and extends requirements 6, 7, and 13 with project-level Sales Agent assignment. It does not grant project creation or assignment permissions to HR Manager, Sales Agent, or website Admin. Assignment timing, whether a project may have multiple agents, and reassignment behavior remain unspecified.

16. **Sales leads linked to project apartments:** After Manager adds apartments and their details, the Sales Agent enters leads based on an apartment in a project or an apartment. Preserve this dependency between Manager's inventory entry and Sales Agent's lead entry. Whether the final phrase includes standalone apartments outside projects remains to be clarified; do not assume standalone inventory or project-only leads are required from this wording alone. Lead fields and further access permissions remain to be specified.

17. **Add New Project form and initial project details:** Clicking **Add New Project** opens the new project entry form described in requirement 13. Manager first enters:
    - Project name, for example `Kabul Plaza 5`.
    - Project code, for example `KP5`.
    - Project address.
    - Total building area.
    - Total number of floors.
    - Number of commercial floors.
    - Number of residential floors.
    - One cover photo showing the project's exterior. This project entry requires only one cover photo, rather than a project image gallery.
    These fields extend the earlier project entry requirements. Under requirement 23, HR supplies seller and construction company representative information after Manager creates the project; those party details are not assigned to Manager's project entry form.

18. **Corridors and apartment numbering:** The project entry includes a corridor count. When there are two or more corridors, label them with capital letters, such as **Corridor A** and **Corridor B**. Apartment identifiers include the corridor, floor, and apartment number. The owner's example is `Apartment A-201`: `A` is the corridor, `2` is the floor, and `01` is the apartment number. Apartment numbers are entered as `01`, `02`, and so on. Single-corridor naming and the exact formatting for floors with two or more digits remain to be specified; do not invent those formatting rules.

19. **Commercial floor selection and unit entry:** After corridor setup, select which floors are commercial. Common examples are two or four commercial floors, such as floors 1 and 2, or floors 1 through 4; these are examples, not fixed limits. Add shops or supermarkets to the selected commercial floors with:
    - Unit name or identifier, for example `S101`.
    - Area.
    - Price per square meter.
    The commercial unit identifier convention beyond the example, corridor association, currency, and area units remain unspecified.

20. **Residential floor selection and apartment entry:** After commercial units, specify the residential floors, for example floors 5 through 12. Residential floors are usually typical/repeated layouts. Begin apartment entry on the first residential floor, such as floor 5. For each apartment, enter:
    - Corridor selection when the project has multiple corridors.
    - Apartment number, such as `01` or `02`.
    - Apartment area.
    - Price per square meter.
    - Apartment location or side, such as back, front, or beside the road.
    Typical residential layouts must be considered in the later design, but the owner has not yet specified whether or how apartments should be copied across floors, generated automatically, or edited as exceptions. Location options are examples, not a confirmed closed list.

21. **Top-floor VIP apartments with roof area:** Some projects have VIP apartments on the last floor that include roof area with the apartment. The inventory entry must accommodate these apartments and their associated roof area. Roof measurement fields, ownership or exclusivity, whether roof area is included in the apartment area, and how roof area affects pricing remain to be specified.

22. **Manager role wording confirmed (owner clarification, 2026-11-12):** The owner confirms that every use of "admin" in the project entry instructions means **Manager**, including corridor, floor, shop, and apartment entry. This replaces the earlier pending clarification in requirement 22 and resolves the role wording in requirements 17–20. Manager owns this internal project entry workflow. **Admin is only for the main website** and receives no internal CRM permissions from these instructions. Existing submission database permissions under UDR-003 remain unchanged.

23. **HR prepares project parties after Manager creates the project (owner correction, 2026-11-12):** When Manager adds a new project, HR Manager enters/uploads the seller or sellers' information and the construction company representative's information in the HR Dashboard. Support one seller or multiple sellers, with each seller's photo and individual information, following the corresponding part of the owner's contract system. HR associates this information with the existing project. This explicitly replaces requirement 11's earlier assignment of seller/company information entry to Manager and the corresponding source-of-data wording in requirement 12. Manager remains responsible for creating the project and its apartments; HR enriches the existing records for contracting. Website Admin has no role in this internal workflow.

24. **Reference party-entry structure accepted for HR:** The owner considers the reference contract system's seller/company representative and project information section suitable for this workflow. Use that section as the reference for HR's entry of project-linked contract information, multiple sellers, their photos, and construction company representative information. The reviewed reference party fields are full name, Tazkira/national ID, father's name, lineage/family name, birth date, permanent residence, current residence, and a formal portrait. Its construction responsible person is the reference for the requested company representative. Further company-level fields beyond representative details remain unspecified. This adopts the relevant party-entry structure for HR; it does not reverse requirement 13's exclusion of the reference's project/apartment creation wizard for Manager or permit HR to create projects.

25. **HR records each apartment's surroundings:** HR enters the surroundings/boundary descriptions for each apartment, using the reference contract system's east, west, north, and south boundary fields. Store these against the relevant existing apartment so agreement creation can reuse them. These four boundaries supplement the apartment side/location entered by Manager in requirement 20; they are distinct from that front/back/road-facing description.

26. **Sales deal to HR agreement workflow:** When a Sales Agent conducts a deal, HR fills in the buyer's information and photo and creates the agreement for the relevant apartment. Reuse the prepared project, apartment, seller(s), construction company representative, and boundary information so HR does not have to re-enter it for each agreement. Keep the existing HR installment responsibility from requirement 9; this instruction does not explicitly remove it. Sales-to-HR handoff mechanics, required deal status, approvals, signing, and locking rules remain unspecified and are not inherited automatically from the reference app.

27. **Agreement verification QR code (owner-confirmed):** The owner confirms that "barcode" means a **QR code for agreement verification**, matching the reference contract system. This replaces the earlier pending QR-versus-linear-barcode clarification. The reference encodes an agreement verification URL tied to a contract number or serial. The exact verification result, information disclosed, and who may access it remain to be specified. Do not copy the reference app's production URL into V2 or assume public access to internal CRM data.

28. **HR contracts feed Finance payment tracking (owner requirement, 2026-11-12):** When HR creates a contract with buyer information and installments, Finance must be able to track the associated payments in the Finance Dashboard using the same finance tracker workflow as the owner's reference contract system. Reuse the existing contract, buyer, apartment/project linkage, and installment schedule rather than requiring Finance to enter the contract again. HR creates the agreement and schedule; Finance tracks payments against them. This extends requirements 9, 12, and 26. Detailed tracker requirements and source observations are recorded in [Finance Dashboard requirements](finance-dashboard-requirements.md), requirements 8–12. Existing finance visibility rules continue to apply; this handoff does not independently grant HR access to the payment ledger or grant Finance contract-editing permissions.

## Contract system reference observations

Read-only source review at commit `afb9908bc2fe765c5b40e0f00d87e3874b1f0a6f`. The details below document the referenced implementation for later planning; they do not independently grant permissions or settle unspecified workflows.

- **Contract entry structure:** [ContractWizard.tsx](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/afb9908bc2fe765c5b40e0f00d87e3874b1f0a6f/src/components/ContractWizard.tsx) has four steps: project and apartment selection; buyer information and 3×4 portrait; installments and financial schedule; review and contract issuance. It supports draft saving and contract preview.
- **Project and apartment linkage:** The selected project/apartment supplies sellers and the construction responsible person in the reference implementation. Apartment details include serial number, apartment number, rooms, address, area, floor, direction, four boundaries, price per square meter, and total price. For this dashboard, HR supplies project sellers and construction company representative information under requirement 23, superseding requirement 11's original Manager assignment. HR also enters apartment boundaries under requirement 25. The reference's construction responsible person model does not settle further company-level fields. Manager entry uses a new wizard under requirement 13; the reference app's project/apartment creation wizard is excluded from Manager entry.
- **Parties and contract data:** [types.ts](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/afb9908bc2fe765c5b40e0f00d87e3874b1f0a6f/src/types.ts) defines sellers, a construction responsible person, and one or more buyers. Party data includes name, Tazkira, father's name, lineage/family name, birth date, permanent/current residence, and portrait. Buyer phone is supported; seller phone and share percentage are excluded in the wizard. Contract data includes contract and apartment serial numbers, Gregorian/Jalali dates, property description, area, unit/total price, currency, sales agent name, clauses, notes, realtor details, and linked documents.
- **Installment structure:** Each installment includes its number, description, percentage, due date (nullable), scheduled amount, paid amount, and status. The wizard recalculates scheduled amounts from total contract price and percentages, and requires percentages to total 100% before continuing to review. Its sample schedule values and dates are reference defaults, not owner-confirmed requirements for this dashboard. Payment collection and recording permissions are not inferred from these fields.
- **Contract output:** [ContractPrintView.tsx](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/afb9908bc2fe765c5b40e0f00d87e3874b1f0a6f/src/components/ContractPrintView.tsx) provides preview, A4 printing, and PDF download, normally arranged as two pages. It includes party portraits, property details, clauses, installment table, signatures/thumbprints, and company seal areas. This source review does not verify runtime rendering or legal content.
- **Contract organization:** [ContractList.tsx](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/afb9908bc2fe765c5b40e0f00d87e3874b1f0a6f/src/components/ContractList.tsx) supports searching contracts and filtering by project/status. Existing approval, locking, visibility, and status-change permissions are not adopted automatically; HR workflow permissions remain subject to the owner's instructions.
- **Integration boundary:** The reference app's Admin/Finance roles, approval routing, payment handling, authentication, and database arrangement do not replace this project's role rules or UDR-001 through UDR-003. HR contracts and installments belong to internal CRM workflows; HR must not access the website database.

### Follow-up source review for HR preparation and agreement codes — 2026-11-12

Read-only review of the repository's default-branch files through the connected GitHub tools. These are source observations, not runtime or deployment verification. File blob SHAs identify the reviewed versions separately from the earlier commit review above.

- **Seller and representative entry:** [ProjectApartmentManager.tsx](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/main/src/components/ProjectApartmentManager.tsx), blob `fb4588f4963679e890f4cfa163dc0193a20d5ed0`, supports single/multiple seller mode, adding seller forms, seller portrait upload/removal, construction responsible person data, and apartment boundary entry. Reference project records hold sellers and a representative; apartment records carry these details. Reuse the relevant entry structure for HR enrichment of Manager-created projects, not the reference project's creation permissions or Manager wizard.
- **Data structure:** [types.ts](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/main/src/types.ts), blob `b12821e0e653b6cb0e34b7e01c44393e9ab18b84`, defines seller arrays, the construction representative party, individual portraits, and four apartment boundary descriptions. Buyer phone is supported. Seller phone and ownership-share percentage are excluded by the reference's form conventions; no additional V2 permissions follow from these fields.
- **Reuse at agreement time:** [ContractWizard.tsx](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/main/src/components/ContractWizard.tsx), blob `6dcbe114d83668e1760e2c255d88478df64e7091`, fills project/apartment details, sellers, construction representative, and boundaries from selected records, and provides buyer information and photo entry. This supports the owner's intended preparation-first workflow. Reference sample identities, preset portraits, prices, and dates are not V2 defaults or seed data.
- **Agreement output:** [ContractPrintView.tsx](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/main/src/components/ContractPrintView.tsx), blob `83f442cd8e74b8042dc2bd037c0d85e003aa17ef`, renders multiple seller portraits/details, representative details, buyer information, boundaries, and an optional QR code in the document. It provides printing and PDF controls. Actual print layout and scanning have not been tested in this review.
- **QR payload:** [contractQr.ts](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/main/src/utils/contractQr.ts), blob `791edacbf67c81e198c1ec5fe0f66e6e17ada293`, encodes an application URL with a `verify` query parameter containing the contract identifier. The existence of this generator does not prove that the verification service is secure or functional. V2 verification behavior and access remain to be specified.

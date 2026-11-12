# Sales Dashboard Requirements

Status: Collecting requirements. Awaiting the owner's instruction to summarize and create an implementation plan.

## Recording instructions

- Record the owner's requirements step by step as they are provided.
- Preserve details, user roles, permissions, workflows, and structural requirements without inventing missing requirements.
- Record later corrections explicitly and identify which earlier requirements they replace.
- Do not summarize or create the complete implementation plan until the owner explicitly requests it.
- When requested, prepare a complete build plan covering the dashboard, its users, and its structure.

## Project boundaries

- This work concerns Attaie Properties V2.
- Follow the existing website and CRM design foundations, bilingual English/Dari support, and RTL behavior.
- Development and database operations must target V2 and its separate testing environment. V1 remains protected.

## Universal dashboard rules

Updated from the owner-confirmed rules and three-database clarification in [Marketing and Production requirements](marketing-production-dashboard-requirements.md), requirements 13–16 and UDR-003.

### UDR-001 — Website database isolation and role-limited CRM access

Owner requirement: This is a benchmark and universal rule for every dashboard, not only the Sales Dashboard.

- Admin is the only dashboard permitted to access the main website database.
- Every other dashboard must not fetch data from, read, write, update, or delete anything in the main website database.
- Every non-Admin dashboard must use the separate internal office CRM database for internal workflow data. Access to the separate submission database is permitted under UDR-003.
- Each role's access within the internal CRM must be limited to that role's permissions.

### UDR-002 — Tasks tab on every dashboard

- Every dashboard must include a Tasks tab.
- Task workflows and permissions remain to be specified by the owner.

### UDR-003 — Shared submission database and Admin isolation

- Use three separate MySQL databases: website, internal office CRM, and submissions.
- Only Admin may access the website database.
- Admin may access the website and submission databases, but must not access the internal office CRM database.
- Internal department workflows, tasks, filming, and editing belong in the internal office CRM database, with role-limited access.
- Marketing may submit posts to the submission database and view their publishing statuses. Submissions include five property photos, property information, and a serial number.
- Admin reviews submissions in the submission database and may approve them for publishing through the website database, without accessing the internal CRM database.
- Sales, Call Center, Management, and Finance have read-only access to submissions and publishing statuses.
- Track **Submitted**, **Approved**, **Published**, and **Rejected** separately in the submission database. Approval does not mean publication.
- The Editor's **Posted** action closes the marketing entry; it does not confirm website publication.
- This amends the earlier UDR-001 restriction that non-Admin dashboards fetch data only from the internal office CRM database. Non-Admin dashboards still must not access the website database.

### UDR-004 — Agent lead privacy

- Call Center agent users and Sales Agent users must not see one another's leads.
- Lead visibility must be isolated per agent, including between agents in the same department and across the Call Center and Sales departments.
- Sales Agents cannot see other Sales Agents' leads.
- A Sales Team Leader may see the leads and activity of Sales Agents assigned to that leader. This visibility is limited to those assigned agents.
- Visibility permissions for other managers and roles have not yet been specified.

## Sales department roles

The Sales department has two roles:

1. **Sales Team Leader**
2. **Sales Agents**

- **Sales Team Leader:** May see the leads and activity of Sales Agents assigned to that leader.
- **Sales Agents:** Cannot see one another's leads.
- Further responsibilities and permissions await the owner's requirements.

## Sales Agent assignment and responsibilities

- The Manager assigns a Sales Agent to a project.
- The assigned Sales Agent must be physically present at that project's site from morning until 6:00 PM.
- The Sales Agent is responsible for showing properties to customers.
- The Sales Agent negotiates with customers and conducts deals.
- The Sales Agent prepares the documents needed for the contract.
- The exact morning start time has not been specified.
- The owner used the title "Manager" for the assigning role; whether this means Sales Team Leader or another role has not yet been specified.

## Sales Agent reporting and lead sources

- Sales Agents submit reports of customer visits throughout the day.
- Sales Agents also report new leads throughout the day.
- Leads can originate from:
  - Walk-in customers.
  - Direct calls.
  - Referrals from another company.
  - The call center.
  - Social media.
- Report recipients, required report fields, and exact submission timing have not yet been specified.

## Sales lead identifiers and progression

- Each new lead starts with an identifier such as **SA01-L1**:
  - **SA** means Sales Agent.
  - **01** is the agent number.
  - **L1** means Lead 1.
- Upon follow-up, use **F1** for Follow-up 1.
- Upon a visit, use **V1**; V1 replaces F1.
- Upon closing a deal, use **DC1** for Deal Closed; DC1 replaces V1 or F1.
- Upon losing a deal, use **DL1** for Deal Lost; DL1 replaces F1 or V1.
- The owner provided these code components and replacement rules. Counter increments and the complete identifier format at each stage have not yet been specified.

### Automatic date suffix

- Every lead serial number must end with an automatically generated date.
- Every follow-up serial number must also end with an automatically generated date.
- Use **DDMMYY**: two digits for day, two for month, and two for year.
- Owner example: **121226** means **12 December 2026**.
- This clarifies the date format in the earlier serial examples: **110226** means **11 February 2026**.

## Deal Closed submission

- To submit a Deal Closed entry, the Sales Agent must enter the deal amount, expressed as either:
  - Price per square meter.
  - Total amount.
- The Sales Agent must upload a photo of the buyer.
- The Sales Agent must also upload a photo of the buyer's Tazkira.
- Submission creates a new entry with an automatically generated serial number in the owner's example format: **SA01PRC-Project Code-Apartment number-110226**.
- Preserve this exact example pending clarification of PRC and the serial's component separators. The date suffix uses DDMMYY; 110226 means 11 February 2026.

## Automatic customer records, ownership, and duplicates

- When a Sales Agent submits a new lead entry, the customer's name and phone number are automatically saved in the customer database.
- This follows the owner-described Call Center behavior: a new lead entered by a Call Center agent automatically saves the customer in the customer database.
- New customer records receive an automatic serial number, for example **SA01-C1-110226**.
- The customer serial identifies the agent to whom the customer belongs.
- The date suffix uses DDMMYY; 110226 means 11 February 2026. Customer counter rules have not yet been specified.
- Sales Agents must not see other Sales Agents' customers.
- Sales Agents must not see Call Center customers.
- One master customer database stores every customer.
- No customer may be added twice across the master customer database.
- Duplicate matching rules and the workflow when an existing customer is entered by another agent have not yet been specified.
- How the master customer database fits within the existing three-database structure has not yet been specified; the owner's wording does not establish an additional physical database.

## Requirements log

- **Automatic lead and follow-up dates:** Every lead and every follow-up serial ends with an automatically generated DDMMYY date. The owner's example 121226 means 12 December 2026. This resolves the previously unspecified date format.

- **Lead progression, closed deals, and customer records:** Recorded the owner's SA01/L1/F1/V1/DC1/DL1 codes and replacement rules; required deal amount, buyer photo, and Tazkira photo; automatic deal and customer serial examples; automatic customer creation; customer privacy; and one master customer database with no duplicate customers.


- **Sales lead privacy and leader oversight:** Sales Agents cannot see one another's leads. A Sales Team Leader can see leads and activity for Sales Agents assigned to that leader. This clarifies UDR-004 and the Sales role permissions.

- **Agent lead privacy:** Call Center agents and Sales Agents cannot see one another's leads. Apply UDR-004.

- **Universal rules synchronized from Marketing:** Updated UDR-001 with the UDR-003 exception, consolidated duplicate Tasks rules, and recorded the three-database permissions and publishing statuses together under Universal dashboard rules.

- **Daytime reporting and lead sources:** Sales Agents report customer visits and new leads throughout the day. Lead sources include walk-ins, direct calls, other-company referrals, the call center, and social media.

- **Project assignment and on-site sales duties:** The Manager assigns a Sales Agent to a project. The agent attends the project site from morning until 6:00 PM, shows properties, negotiates with customers, conducts deals, and prepares contract documents.

- **Sales department roles:** The owner specified Sales Team Leader and Sales Agents.

1. **Universal database and access boundary:** Apply UDR-001 to every dashboard. Specific role permissions will be recorded as the owner provides them.
2. **Universal Tasks tab:** Every dashboard must have a Tasks tab. Apply UDR-002.

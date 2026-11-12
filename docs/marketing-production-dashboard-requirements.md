# Marketing and Production Department Dashboard Requirements

Status: Collecting requirements.

## Recording instructions

- The owner will provide requirements step by step.
- Record every requirement in this document as it arrives, preserving its meaning and details.
- Do not summarize the requirements until the owner explicitly asks.
- When the owner asks for the summary, use all recorded requirements to create a complete dashboard implementation plan, including its users and structure.
- Requirement collection does not authorize implementation or deployment.

## Requirements

1. **Universal Tasks tab:** Every dashboard must have a Tasks tab. Apply UDR-002 below.
2. **Department roles:** The Marketing and Production Department Dashboard has three roles:
   - Marketing Manager
   - Editor
   - Videographer (owner wording: "Video Grapher")
   Role permissions, responsibilities, and access remain to be specified by the owner.
3. **Marketing Manager oversight:** The Marketing Manager oversees the marketing department workflow.
4. **New property entry submission:** A new entry may be added by any of the following:
   - Sales agent user
   - Call center agent
   - Management user
   - Internal agent in the marketing department
5. **New entry information:** Each entry includes:
   - Customer name
   - Address
   - Property type: Villa, Block, Building, or Apartment
6. **Filming scheduling:** After an entry is submitted, the Marketing Manager selects a date to film that property.
7. **Editing completion scheduling:** After filming is complete, the Editor selects a date to finish editing the raw footage from that property's filming.
8. **Content type and Ready for Post:** After finishing the edit, the Editor marks the content as **Ready for Post**. On the editing deadline date, before selecting Ready for Post, the Editor must specify the content type, such as Reel, Ad Video, or another content type. The content-type list is not limited to these examples.
9. **Editor preparation before posting:** Before posting, the Editor must:
   - Select a serial number based on the posts. The current serial-number format is like **AP - 1765**.
   - Paste the property's information into the note.
   - Add five photos of the property.
10. **Posting platform selection:** The Editor must select the platform where the post will be uploaded: Facebook, YouTube, or Instagram.
11. **Posted status and entry closure:** After attaching the five property photos and selecting the serial number, the Editor selects **Posted**, which closes the entry.
12. **Admin review for website publishing:** When the entry is closed as Posted, its five property photos, property information, and serial number are sent to the Admin dashboard. Admin can approve the property for posting on the website. This handoff must follow UDR-001: only Admin may access the website database; the Marketing and Production dashboard must not write directly to it.
13. **Three-database structure (owner-confirmed clarification):**
   - **Website database:** Accessible only by Admin for website publishing.
   - **Internal office CRM database:** Stores department workflows, tasks, filming, and editing. Admin must not have access to this database.
   - **Submission database:** A separate third MySQL database stores posts submitted by Marketing, including the five property photos, property information, serial number, and website publishing status.
14. **Submission database permissions:**
   - Marketing may submit posts and view their publishing status.
   - Admin may review submissions and approve them for publishing through the website database.
   - Call Center, Management, Finance, and Sales have read-only access to submissions and publishing statuses, so every department can know which posts are on the website.
   - Marketing and other non-Admin departments must not access the website database.
15. **Website publishing statuses:** Track **Submitted**, **Approved**, **Published**, and **Rejected** separately in the submission database. Approved does not mean Published. The Editor's **Posted** action closes the marketing entry; it does not by itself confirm website publication.
16. **Handoff clarification:** Requirement 12 uses the third submission database for the handoff to Admin. Admin reads the submitted material there, without accessing the internal office CRM database. This replaces the earlier assumption that Admin would read submissions from the internal CRM database. The proposed alternative of storing pending submissions directly in the website database is not the selected approach.

## Universal dashboard rules

Source: [Sales Dashboard Requirements](sales-dashboard-requirements.md), Universal dashboard rules. These rules apply to the Marketing and Production Department Dashboard.

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

Owner-confirmed amendment to UDR-001: Non-Admin departments may also access the separate submission database according to the permissions in requirement 14. Their internal workflow data remains in the internal office CRM database. Admin may access the website and submission databases, but must not access the internal office CRM database. Only Admin may access the website database.

### UDR-004 — Agent lead privacy

- Call Center agent users and Sales Agent users must not see one another's leads.
- Lead visibility must be isolated per agent, including between agents in the same department and across the Call Center and Sales departments.
- Visibility permissions for team leaders, managers, and other roles have not yet been specified.

## Project boundaries

- This dashboard belongs to the Attaie Properties V2 development project.
- Follow the existing public website and admin CRM design foundations, including English/Dari translations and RTL support.
- Any future database or deployment work must target the separate V2 testing environment and preserve existing V2 data.

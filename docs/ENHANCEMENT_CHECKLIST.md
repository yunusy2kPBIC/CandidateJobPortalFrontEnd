# Candidate Job Portal Enhancement Checklist

Source: `JobPosting-Portal.xlsx`  
Last updated: 2026-09-08

Status convention:

- `[x]` Completed and build-verified
- `[ ]` Not completed
- `PARTIAL` Some requested behavior exists
- `DECISION NEEDED` Business confirmation is required before implementation
- `IN PROGRESS` Currently being implemented

## Roles and permissions

- [x] CHG-01 - Introduce the HR Admin role
- [x] CHG-02 - Introduce the Student role and registration selector
- [ ] CHG-03 - Define full Administrator screen access - DECISION NEEDED
- [ ] CHG-04 - Apply a single role-to-screen access matrix - PARTIAL; role guards exist, pending CHG-03

## Sign-in, registration, and account security

- [x] CHG-05 - Validate email availability before registration submission
- [x] CHG-06 - Capture gender during account registration
- [x] CHG-07 - Verify email before activating a new account
- [x] CHG-08 - Send account-created confirmation email
- [x] CHG-09 - Implement password recovery
- [x] CHG-10 - Display privacy content and persist consent evidence
- [x] CHG-11 - Verify candidate post-login destinations

## Candidate profile and resume

- [ ] CHG-12 - Fix candidate country to Saudi Arabia - DECISION NEEDED; portal currently supports multiple countries
- [x] CHG-13 - Use a database-backed city dropdown
- [x] CHG-14 - Add mandatory nationality to the candidate profile
- [x] CHG-15 - Make resume mandatory for candidate applications
- [x] CHG-16 - Expose a reliable CV link in administrator candidate views

## Job search and candidate experience

- [ ] CHG-17 - Resolve the job-search country rule - DECISION NEEDED; current implementation is multi-country
- [x] CHG-18 - Use shared master data for all job filters
- [ ] CHG-19 - Clarify nationality on Available Jobs - DECISION NEEDED
- [ ] CHG-20 - Complete benefits, guidelines, and privacy content - PARTIAL
- [x] CHG-21 - Retain structured job-detail content
- [x] CHG-22 - Add Email Job to a Friend

## Recruitment administration and job lifecycle

- [x] CHG-23 - Use shared dropdowns in create and edit job forms
- [x] CHG-24 - Set posting date automatically
- [ ] CHG-25 - Require a strictly future expiry date
- [ ] CHG-26 - Automatically close expired jobs - PARTIAL; expiry is computed but `IsOpen` is not persisted as closed
- [ ] CHG-27 - Reopen through an edit form with new dates - DECISION NEEDED
- [ ] CHG-28 - Record explicit open, close, and reopen audit events - PARTIAL
- [ ] CHG-29 - Remove or hide Featured Job controls - DECISION NEEDED
- [ ] CHG-30 - Confirm the Edit and Delete action policy - DECISION NEEDED

## Recruitment Request module

- [ ] CHG-31 - Provide a public Recruitment Request page
- [ ] CHG-32 - Align recruitment fields and controlled values - PARTIAL
- [ ] CHG-33 - Make Iqama Profession conditionally mandatory
- [ ] CHG-34 - Require applicants to meet the approved minimum age
- [ ] CHG-35 - Add recruitment-request attachments
- [ ] CHG-36 - Send configurable recruitment acknowledgement email

## Cooperative Training module

- [x] CHG-37 - Provide a Student-facing Cooperative Training page
- [ ] CHG-38 - Display and enforce cooperative-training eligibility - PARTIAL
- [x] CHG-39 - Restrict training duration to three through six months
- [ ] CHG-40 - Align cooperative-training dropdowns and field validation - PARTIAL
- [x] CHG-41 - Keep both supporting documents mandatory
- [ ] CHG-42 - Send cooperative-training acknowledgement email

## Platform and configuration

- [ ] CHG-43 - Move approved content and email settings to configuration
- [ ] CHG-44 - Add Progressive Web App installation support

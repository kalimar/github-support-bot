# User Stories

## Personas

### Issue Reporter (IR)
An external user — developer, customer, or contributor — who opens an issue in a GitHub repository. They may be reporting a bug, asking a question, or requesting a feature. They expect a timely, helpful response.

### Support Engineer (SE)
An internal maintainer or support team member managing the issue queue. They need efficient triage, clear signal over noise, and confidence that routine issues are handled without manual intervention.

---

## Epic 1: Automated Issue Triage

**Goal**: Classify incoming issues instantly so reporters get routed to the right resource and engineers see a labeled, organized queue.

---

### IR-01 — Immediate Acknowledgement
**As an** Issue Reporter,
**I want** to receive an automated acknowledgement within seconds of opening an issue,
**so that** I know my report was received and I'm not left wondering if anything will happen.

**Acceptance Criteria**:
- [ ] A bot comment appears on the issue within 60 seconds of creation
- [ ] The comment confirms receipt and sets a response time expectation
- [ ] The comment is friendly and does not feel like a form letter
- [ ] The comment includes a link to relevant documentation or FAQ if applicable

---

### IR-02 — Relevant Label Applied
**As an** Issue Reporter,
**I want** my issue to be automatically labeled based on its content,
**so that** it reaches the right person faster and I don't have to manually categorize it.

**Acceptance Criteria**:
- [ ] Labels are applied within 60 seconds of issue creation
- [ ] At minimum, one of `bug`, `feature`, `question`, or `documentation` is applied
- [ ] Label selection is based on title and body content matching
- [ ] A `triage` label is applied when content is ambiguous

---

### SE-01 — Consistent Label Taxonomy
**As a** Support Engineer,
**I want** all incoming issues to follow a consistent labeling schema,
**so that** I can filter, sort, and prioritize my queue without manual cleanup.

**Acceptance Criteria**:
- [ ] Labels are defined in a single source-of-truth config file
- [ ] The workflow uses only labels that exist in that config
- [ ] No issue reaches "needs review" state without at least one label
- [ ] Label logic is documented and auditable in the workflow file

---

### SE-02 — Duplicate Detection
**As a** Support Engineer,
**I want** the bot to flag issues that appear to duplicate an existing open issue,
**so that** I can consolidate and avoid working the same problem twice.

**Acceptance Criteria**:
- [ ] Bot searches open issues for keyword overlap on issue creation
- [ ] If a likely duplicate is found, a `duplicate` label is applied and the potential match is linked in a comment
- [ ] The reporter is notified politely and pointed to the existing thread
- [ ] False positives are possible but the SE can remove the label manually

---

## Epic 2: Auto-Response

**Goal**: Provide immediate, accurate self-service answers for common issue types and escalate complex issues to humans with full context.

---

### IR-03 — Self-Service Answer for Common Questions
**As an** Issue Reporter asking a frequently asked question,
**I want** to receive an automated response with relevant documentation links and steps,
**so that** I can resolve my issue immediately without waiting for a human reply.

**Acceptance Criteria**:
- [ ] Bot detects question-type issues (e.g. "how do I...", "what is...")
- [ ] Response includes specific doc links matched to the issue content (not just a generic homepage link)
- [ ] Response asks the reporter to close the issue if the answer resolves it
- [ ] Response time is under 60 seconds

---

### IR-04 — Clear Escalation Path
**As an** Issue Reporter with a complex or unresolved issue,
**I want** to know when my issue has been escalated to a human,
**so that** I don't feel ignored or need to follow up manually.

**Acceptance Criteria**:
- [ ] Issues not matched by any automation rule are labeled `needs-human-review`
- [ ] A bot comment is posted explaining that a team member will follow up
- [ ] The comment sets a realistic expectation (e.g. "within 1–2 business days")
- [ ] The issue appears in the SE's triage view

---

### SE-03 — Escalation Alert
**As a** Support Engineer,
**I want** to be notified when an issue is escalated and requires my attention,
**so that** I don't miss complex or high-priority issues buried in the queue.

**Acceptance Criteria**:
- [ ] Escalated issues are labeled `needs-human-review`
- [ ] A GitHub notification is triggered for maintainers on escalation
- [ ] The bot comment on the issue summarizes why it was escalated (no match found, sentiment flagged, etc.)

---

### SE-04 — Bot Response Audit Trail
**As a** Support Engineer,
**I want** to see what automated response was sent and why,
**so that** I can verify the bot behaved correctly and correct any misfires.

**Acceptance Criteria**:
- [ ] Each bot comment includes a footer indicating it was auto-generated
- [ ] Workflow run logs are accessible via the Actions tab for every triggered event
- [ ] SE can manually override any label or close a bot comment thread without breaking the workflow

---

## Epic 3: Metrics Dashboard

**Goal**: Surface support system health and automation effectiveness so both reporters and engineers understand what's working.

---

### IR-05 — Public Transparency
**As an** Issue Reporter,
**I want** to see how quickly issues are typically resolved in this repo,
**so that** I can set realistic expectations for my own issue.

**Acceptance Criteria**:
- [ ] A public dashboard (GitHub Pages) shows average time-to-first-response
- [ ] Dashboard shows issue resolution rate over the last 30 days
- [ ] Data is updated at least once per day
- [ ] Dashboard is linked from the repository README

---

### SE-05 — Automation Effectiveness Tracking
**As a** Support Engineer,
**I want** to see what percentage of issues are resolved by automation vs. human intervention,
**so that** I can identify gaps in automation coverage and improve response templates.

**Acceptance Criteria**:
- [ ] Dashboard shows breakdown: auto-resolved vs. escalated vs. still open
- [ ] Label distribution is visible (bug / feature / question / documentation)
- [ ] Trends are shown over time (weekly or monthly)
- [ ] Data is sourced from GitHub Issues API, not a separate database

---

### SE-06 — SLA Visibility
**As a** Support Engineer,
**I want** to see how many open issues have exceeded a defined response time threshold,
**so that** I can prioritize stale issues before they become a reputation problem.

**Acceptance Criteria**:
- [ ] Dashboard flags issues open for more than 48 hours without a response
- [ ] Count of SLA-breached issues is shown prominently
- [ ] Clicking through links to the filtered issue list in GitHub

---

## Out of Scope (v1)

The following are recognized as valuable but will not be implemented in the initial version:

- Sentiment analysis or toxicity detection
- Multi-repo support
- Slack or email notification integration
- AI-generated custom responses (responses use templates only)
- User authentication on the dashboard

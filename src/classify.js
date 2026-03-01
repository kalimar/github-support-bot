import { appendFileSync } from 'fs'
import { fileURLToPath } from 'url'

// Rules are checked in order — first match wins.
// More specific rules (documentation) are listed before broader ones (question).
export const rules = [
  {
    label: 'documentation',
    patterns: ['docs', 'documentation', 'readme', 'typo', 'spelling', 'missing doc', 'unclear'],
  },
  {
    label: 'bug',
    patterns: ['error', 'broken', 'crash', 'fail', 'not working', "doesn't work", 'exception', 'stack trace', 'stacktrace', 'broke'],
  },
  {
    label: 'feature',
    patterns: ['feature request', 'enhancement', 'add support', 'would be nice', 'please add', 'new feature', 'suggestion', 'would love'],
  },
  {
    label: 'question',
    patterns: ['how do i', 'how to', 'what is', 'help with', 'confused', 'understand', 'explain', 'clarif'],
  },
]

export function classify(title, body) {
  const text = `${title} ${body}`.toLowerCase()

  for (const rule of rules) {
    const matched = rule.patterns.find(p => text.includes(p))
    if (matched) {
      return { label: rule.label, reason: `matched "${matched}"` }
    }
  }

  return { label: 'triage', reason: 'no patterns matched' }
}

// Only runs I/O when executed directly — not when imported in tests
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const title = process.env.ISSUE_TITLE || ''
  const body = process.env.ISSUE_BODY || ''
  const { label, reason } = classify(title, body)

  appendFileSync(process.env.GITHUB_OUTPUT, `label=${label}\n`)
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Issue Classification\n\n| Field | Value |\n|---|---|\n| **Label** | \`${label}\` |\n| **Reason** | ${reason} |\n`
  )

  console.log(`Classified as: ${label} (${reason})`)
}

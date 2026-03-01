import { writeFileSync, appendFileSync } from 'fs'
import { fileURLToPath } from 'url'

const HOURS_48_MS = 48 * 60 * 60 * 1000
const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000

async function githubGet(path, token) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status} on ${path}`)
  return res.json()
}

async function paginate(path, token) {
  const results = []
  let page = 1
  while (true) {
    const data = await githubGet(`${path}&page=${page}&per_page=100`, token)
    results.push(...data)
    if (data.length < 100) break
    page++
  }
  return results
}

// Pure function — takes raw issue data and pre-fetched response times.
// Separated from I/O so it can be unit tested without API calls.
export function computeMetrics(issues, firstResponseHours = [], now = new Date()) {
  const cutoff30d = new Date(now - DAYS_30_MS)

  const openIssues = issues.filter(i => i.state === 'open')
  const closed30d = issues.filter(i => i.state === 'closed' && new Date(i.closed_at) >= cutoff30d)

  const labelDistribution = {}
  for (const issue of openIssues) {
    for (const label of issue.labels) {
      labelDistribution[label.name] = (labelDistribution[label.name] || 0) + 1
    }
  }

  const knownBotLabels = ['bug', 'feature', 'question', 'documentation', 'triage']
  const autoResolved30d = closed30d.filter(i =>
    i.labels.some(l => knownBotLabels.includes(l.name)) &&
    !i.labels.some(l => l.name === 'needs-human-review')
  ).length

  const slaBreachedIssues = openIssues
    .filter(i => (now - new Date(i.created_at)) > HOURS_48_MS && i.comments === 0)
    .map(i => ({
      number: i.number,
      title: i.title,
      created_at: i.created_at,
      hours_open: Math.round((now - new Date(i.created_at)) / (1000 * 60 * 60)),
    }))

  const avgFirstResponseHours = firstResponseHours.length > 0
    ? Math.round((firstResponseHours.reduce((a, b) => a + b, 0) / firstResponseHours.length) * 10) / 10
    : null

  return {
    generated_at: now.toISOString(),
    period_days: 30,
    summary: {
      total_open: openIssues.length,
      closed_30d: closed30d.length,
      auto_resolved_30d: autoResolved30d,
      escalated_30d: closed30d.length - autoResolved30d,
      sla_breached: slaBreachedIssues.length,
    },
    avg_first_response_hours: avgFirstResponseHours,
    label_distribution: labelDistribution,
    sla_breached_issues: slaBreachedIssues,
  }
}

export async function collectMetrics(repo, token) {
  const allIssues = (await paginate(`/repos/${repo}/issues?state=all`, token))
    .filter(i => !i.pull_request)

  const now = new Date()
  const cutoff30d = new Date(now - DAYS_30_MS)
  const recentWithComments = allIssues
    .filter(i => i.comments > 0 && new Date(i.created_at) >= cutoff30d)
    .slice(0, 20)

  const firstResponseHours = []
  for (const issue of recentWithComments) {
    try {
      const comments = await githubGet(
        `/repos/${repo}/issues/${issue.number}/comments?per_page=1`,
        token
      )
      if (comments.length > 0) {
        const hours = (new Date(comments[0].created_at) - new Date(issue.created_at)) / (1000 * 60 * 60)
        firstResponseHours.push(hours)
      }
    } catch {
      // skip — don't fail the whole run for one issue
    }
  }

  return computeMetrics(allIssues, firstResponseHours, now)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPOSITORY
  const outputPath = process.env.OUTPUT_PATH || 'docs/data/metrics.json'

  if (!token || !repo) {
    console.error('GITHUB_TOKEN and GITHUB_REPOSITORY must be set')
    process.exit(1)
  }

  const metrics = await collectMetrics(repo, token)
  writeFileSync(outputPath, JSON.stringify(metrics, null, 2))

  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Metrics Collected\n\n` +
    `| Metric | Value |\n|---|---|\n` +
    `| Open issues | ${metrics.summary.total_open} |\n` +
    `| Closed (30d) | ${metrics.summary.closed_30d} |\n` +
    `| Auto-resolved (30d) | ${metrics.summary.auto_resolved_30d} |\n` +
    `| SLA breached | ${metrics.summary.sla_breached} |\n` +
    `| Avg first response | ${metrics.avg_first_response_hours ?? 'N/A'} hours |\n`
  )

  console.log(`Metrics written to ${outputPath}`)
}

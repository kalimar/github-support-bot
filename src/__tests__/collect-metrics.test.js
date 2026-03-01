import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { computeMetrics } from '../collect-metrics.js'

const NOW = new Date('2026-02-28T12:00:00Z')
const HOURS = h => h * 60 * 60 * 1000

function makeIssue(overrides) {
  return {
    number: 1,
    title: 'Test issue',
    state: 'open',
    pull_request: undefined,
    labels: [],
    comments: 0,
    created_at: new Date(NOW - HOURS(1)).toISOString(),
    closed_at: null,
    ...overrides,
  }
}

test('counts open and closed issues', () => {
  const issues = [
    makeIssue({ state: 'open' }),
    makeIssue({ state: 'closed', closed_at: new Date(NOW - HOURS(24)).toISOString() }),
  ]
  const metrics = computeMetrics(issues, [], NOW)
  assert.equal(metrics.summary.total_open, 1)
  assert.equal(metrics.summary.closed_30d, 1)
})

test('excludes closed issues older than 30 days', () => {
  const old = makeIssue({
    state: 'closed',
    closed_at: new Date(NOW - HOURS(31 * 24)).toISOString(),
  })
  const metrics = computeMetrics([old], [], NOW)
  assert.equal(metrics.summary.closed_30d, 0)
})

test('computes label distribution from open issues only', () => {
  const issues = [
    makeIssue({ state: 'open', labels: [{ name: 'bug' }] }),
    makeIssue({ state: 'open', labels: [{ name: 'bug' }] }),
    makeIssue({ state: 'closed', closed_at: NOW.toISOString(), labels: [{ name: 'feature' }] }),
  ]
  const metrics = computeMetrics(issues, [], NOW)
  assert.equal(metrics.label_distribution.bug, 2)
  assert.equal(metrics.label_distribution.feature, undefined)
})

test('flags SLA breached issues open over 48h with no comments', () => {
  const issues = [
    makeIssue({ number: 10, created_at: new Date(NOW - HOURS(50)).toISOString(), comments: 0 }),
    makeIssue({ number: 11, created_at: new Date(NOW - HOURS(50)).toISOString(), comments: 1 }),
    makeIssue({ number: 12, created_at: new Date(NOW - HOURS(10)).toISOString(), comments: 0 }),
  ]
  const metrics = computeMetrics(issues, [], NOW)
  assert.equal(metrics.summary.sla_breached, 1)
  assert.equal(metrics.sla_breached_issues[0].number, 10)
})

test('counts auto-resolved vs escalated in closed issues', () => {
  const issues = [
    makeIssue({ state: 'closed', closed_at: NOW.toISOString(), labels: [{ name: 'bug' }] }),
    makeIssue({ state: 'closed', closed_at: NOW.toISOString(), labels: [{ name: 'needs-human-review' }] }),
  ]
  const metrics = computeMetrics(issues, [], NOW)
  assert.equal(metrics.summary.auto_resolved_30d, 1)
  assert.equal(metrics.summary.escalated_30d, 1)
})

test('computes average first response time', () => {
  const metrics = computeMetrics([], [2, 4], NOW)
  assert.equal(metrics.avg_first_response_hours, 3)
})

test('returns null avg response time when no data', () => {
  const metrics = computeMetrics([], [], NOW)
  assert.equal(metrics.avg_first_response_hours, null)
})

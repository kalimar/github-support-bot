import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { classify } from '../classify.js'

test('classifies bug reports by title', () => {
  assert.equal(classify('app crashes on startup', '').label, 'bug')
})

test('classifies bug reports by body', () => {
  assert.equal(classify('problem with the bot', 'getting a stack trace when I run it').label, 'bug')
})

test('classifies feature requests', () => {
  assert.equal(classify('feature request: add dark mode', '').label, 'feature')
})

test('classifies questions', () => {
  assert.equal(classify('how do I configure the bot', '').label, 'question')
})

test('classifies documentation issues', () => {
  assert.equal(classify('readme typo on line 12', '').label, 'documentation')
})

test('documentation rule takes priority over question', () => {
  assert.equal(classify('how to update the docs', '').label, 'documentation')
})

test('falls back to triage when nothing matches', () => {
  assert.equal(classify('something is off', 'not sure what to call this').label, 'triage')
})

test('returns a reason string', () => {
  const result = classify('app is broken', '')
  assert.ok(result.reason.length > 0)
})

test('is case-insensitive', () => {
  assert.equal(classify('APP CRASHES ON STARTUP', '').label, 'bug')
})

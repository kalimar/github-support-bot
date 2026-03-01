async function loadMetrics() {
  const res = await fetch('./data/metrics.json')
  if (!res.ok) throw new Error(`Failed to load metrics: ${res.status}`)
  return res.json()
}

function formatDate(iso) {
  if (!iso) return 'never'
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
  })
}

function renderCards(summary, avgHours) {
  document.getElementById('val-open').textContent = summary.total_open
  document.getElementById('val-closed').textContent = summary.closed_30d
  document.getElementById('val-auto').textContent = summary.auto_resolved_30d

  const slaEl = document.getElementById('val-sla')
  slaEl.textContent = summary.sla_breached
  slaEl.className = 'card-value ' + (summary.sla_breached === 0 ? 'green' : 'red')

  const responseEl = document.getElementById('val-response')
  responseEl.textContent = avgHours !== null ? `${avgHours}h` : 'N/A'
}

function renderLabelBars(distribution) {
  const container = document.getElementById('label-bars')
  container.innerHTML = ''

  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) {
    container.innerHTML = '<p class="empty-state">No labeled issues yet.</p>'
    return
  }

  const max = entries[0][1]
  for (const [name, count] of entries) {
    const pct = Math.round((count / max) * 100)
    const row = document.createElement('div')
    row.className = 'bar-row'
    row.innerHTML = `
      <span class="bar-name">${name}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <span class="bar-count">${count}</span>
    `
    container.appendChild(row)
  }
}

function renderSlaTable(issues) {
  const container = document.getElementById('sla-list')
  container.innerHTML = ''

  if (issues.length === 0) {
    container.innerHTML = '<p class="empty-state">No SLA breaches. All open issues have had a response within 48 hours.</p>'
    return
  }

  const table = document.createElement('table')
  table.className = 'sla-table'
  table.innerHTML = `
    <thead>
      <tr>
        <th class="issue-number">#</th>
        <th>Title</th>
        <th class="hours">Hours open</th>
      </tr>
    </thead>
    <tbody>
      ${issues.map(i => `
        <tr>
          <td class="issue-number">#${i.number}</td>
          <td>${i.title}</td>
          <td class="hours">${i.hours_open}h</td>
        </tr>
      `).join('')}
    </tbody>
  `
  container.appendChild(table)
}

async function init() {
  try {
    const metrics = await loadMetrics()

    document.getElementById('updated-at').textContent =
      metrics.generated_at ? `Updated ${formatDate(metrics.generated_at)}` : 'Not yet generated'

    renderCards(metrics.summary, metrics.avg_first_response_hours)
    renderLabelBars(metrics.label_distribution)
    renderSlaTable(metrics.sla_breached_issues)

    document.getElementById('dashboard').hidden = false
    document.getElementById('loading').hidden = true
  } catch (err) {
    document.getElementById('loading').textContent = `Failed to load metrics: ${err.message}`
  }
}

init()

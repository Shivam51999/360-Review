/* ============ Admin Dashboard ============
   Shares CONFIG, jsonp(), state, esc(), showToast() from index.html's inline script.
   Loaded as a plain <script> tag so it runs in the same global scope. */

function renderAdminLogin() {
  appEl.innerHTML = `
    <div class="center-card card">
      <h2>Management dashboard</h2>
      <p>Enter the admin passcode to view aggregated 360° results for this quarter.</p>
      <div class="stack">
        <input type="password" id="passInput" placeholder="Passcode" />
        <button class="btn-primary" id="passBtn">View dashboard</button>
      </div>
      <div id="passError"></div>
      <div class="footer-link"><a href="#" id="backLink">← Back to review portal</a></div>
    </div>
  `;
  document.getElementById('passBtn').onclick = loadDashboard;
  document.getElementById('passInput').addEventListener('keydown', e => { if (e.key === 'Enter') loadDashboard(); });
  document.getElementById('backLink').onclick = (e) => {
    e.preventDefault();
    state.email ? loadPortal() : renderLogin();
  };
}

async function loadDashboard() {
  const passcode = document.getElementById('passInput').value.trim();
  const errEl = document.getElementById('passError');
  document.getElementById('passBtn').textContent = 'Checking…';
  try {
    const res = await jsonp({ action: 'getDashboard', passcode });
    if (!res.ok) {
      errEl.innerHTML = `<div class="error-box">${esc(res.error)}</div>`;
      document.getElementById('passBtn').textContent = 'View dashboard';
      return;
    }
    sessionStorage.setItem('pms360_admin_pass', passcode);
    renderDashboard(res);
  } catch (e) {
    errEl.innerHTML = `<div class="error-box">${esc(e.message)}</div>`;
    document.getElementById('passBtn').textContent = 'View dashboard';
  }
}

const TYPE_ORDER = ['peer', 'vendor', 'manager_to_team', 'team_to_manager'];

function renderDashboard(d) {
  appEl.innerHTML = `
    <div class="greeting">
      <div class="name">Management Summary</div>
      <div class="dept">${esc(d.quarter)} · ${d.totalGivers} employees expected to submit reviews</div>
    </div>

    <div class="stat-grid">
      <div class="stat-box"><div class="big">${d.overallCompletionRate}%</div><div class="label">Overall completion</div></div>
      <div class="stat-box"><div class="big">${d.overallDone}</div><div class="label">Reviews submitted</div></div>
      <div class="stat-box"><div class="big">${d.overallExpected}</div><div class="label">Reviews expected</div></div>
      <div class="stat-box"><div class="big">${d.totalGivers}</div><div class="label">Active reviewers</div></div>
    </div>

    <div id="typeSections"></div>

    <div class="dash-section">
      <h3>Reviewers by department</h3>
      <table class="dash-table">
        <thead><tr><th>Department</th><th>Reviewers</th></tr></thead>
        <tbody>
          ${d.departmentBreakdown.map(dep => `<tr><td>${esc(dep.department)}</td><td>${dep.givers}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer-link"><a href="#" id="backLink2">← Back to review portal</a></div>
  `;

  const typeSections = document.getElementById('typeSections');
  TYPE_ORDER.forEach(typeKey => {
    const t = d.byType[typeKey];
    if (!t) return;
    const section = document.createElement('div');
    section.className = 'card dash-section';
    section.innerHTML = `
      <h3>${esc(t.label)} — ${t.completed}/${t.expected} (${t.completionRate}%)</h3>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
        <div>
          <div style="font-size:13px; font-weight:700; color:var(--ink-soft); margin-bottom:8px;">TOP AVERAGE SCORES</div>
          <table class="dash-table">
            <tbody>
              ${t.topPerformers.slice(0, 6).map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.department || '')}</td><td><strong>${p.averageScore ?? '—'}</strong></td></tr>`).join('') || '<tr><td>No data yet</td></tr>'}
            </tbody>
          </table>
        </div>
        <div>
          <div style="font-size:13px; font-weight:700; color:var(--ink-soft); margin-bottom:8px;">NEEDS ATTENTION (LOWEST AVERAGE)</div>
          <table class="dash-table">
            <tbody>
              ${t.lowestPerformers.slice(0, 6).map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.department || '')}</td><td><strong>${p.averageScore ?? '—'}</strong></td></tr>`).join('') || '<tr><td>No data yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      ${t.remarksSample.length ? `
        <div style="margin-top:18px;">
          <div style="font-size:13px; font-weight:700; color:var(--ink-soft); margin-bottom:8px;">RECENT REMARKS</div>
          ${t.remarksSample.slice(0, 5).map(r => `<div class="remark"><span class="who">${esc(r.assessor)} → ${esc(r.assessee)}:</span> ${esc(r.comment)}</div>`).join('')}
        </div>
      ` : ''}
    `;
    typeSections.appendChild(section);
  });

  document.getElementById('backLink2').onclick = (e) => {
    e.preventDefault();
    state.email ? loadPortal() : renderLogin();
  };
}

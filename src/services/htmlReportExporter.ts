import { AuditWorkspace } from '../types'

export function exportInteractiveHtmlReport(workspace: AuditWorkspace): void {
  const meta = workspace.projectMeta
  const totalTasks = workspace.tasks.length
  const completedTasks = workspace.tasks.filter((t) => t.status === 'done').length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const totalMeetings = workspace.meetings.length
  const totalMaterials = workspace.materials.length
  const totalAttachments =
    workspace.materials.reduce((acc, m) => acc + m.attachments.length, 0) +
    workspace.tasks.filter((t) => t.evidenceAttachment).length

  const safeJsonData = JSON.stringify(workspace)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')

  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AuditSpace - ${meta.name} (Laporan Eksekutif)</title>
  <style>
    :root {
      --bg: #09090b;
      --card-bg: #18181b;
      --border: #27272a;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --accent: #3b82f6;
      --emerald: #10b981;
      --amber: #f59e0b;
      --rose: #f43f5e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #09090b;
      color: var(--text);
      line-height: 1.5;
      padding: 24px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px 32px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
    .badge-green { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-amber { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .badge-rose { background: rgba(244, 63, 94, 0.2); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.4); }
    .badge-gray { background: #27272a; color: #d4d4d8; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
    }
    .kpi-title { font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
    .kpi-val { font-size: 28px; font-weight: 800; }
    .progress-bar-bg { width: 100%; height: 8px; background: #27272a; border-radius: 9999px; overflow: hidden; margin-top: 10px; }
    .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #10b981); border-radius: 9999px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .tab-btn.active { background: #27272a; color: #ffffff; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .kanban-board {
      display: flex;
      gap: 20px;
      overflow-x: auto;
      padding-bottom: 20px;
      scrollbar-width: thin;
      scrollbar-color: #3b82f6 #18181b;
    }
    .kanban-board::-webkit-scrollbar { height: 10px; }
    .kanban-board::-webkit-scrollbar-track { background: #18181b; border-radius: 9999px; }
    .kanban-board::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 9999px; }
    .kanban-col {
      width: 320px;
      min-width: 320px;
      background: #121215;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 80vh;
      overflow-y: auto;
    }
    .col-header { font-size: 13px; font-weight: 700; text-transform: uppercase; padding-bottom: 10px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      font-size: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .card-title { font-weight: 700; font-size: 13px; margin-bottom: 6px; color: #ffffff; }
    .card-meta { font-size: 11px; color: var(--text-muted); margin-top: 8px; border-top: 1px solid #27272a; pt: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; background: var(--card-bg); border-radius: 16px; overflow: hidden; border: 1px solid var(--border); }
    th { background: #1f1f23; padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border); }
    td { padding: 14px 16px; border-bottom: 1px solid #27272a; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .search-box {
      width: 100%;
      max-width: 360px;
      padding: 8px 14px;
      background: #18181b;
      border: 1px solid var(--border);
      border-radius: 10px;
      color: #fff;
      font-size: 12px;
      margin-bottom: 16px;
    }
    .search-box:focus { outline: none; border-color: var(--accent); }
    .footer { text-align: center; font-size: 11px; color: var(--text-muted); margin-top: 40px; padding: 16px; border-top: 1px solid var(--border); }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <h1 style="font-size: 22px; font-weight: 800;">${meta.name}</h1>
          <span class="badge badge-blue">Read-Only Executive Report</span>
        </div>
        <p style="font-size: 13px; color: var(--text-muted);">
          Auditee: <strong style="color: #fff;">${meta.auditeeName}</strong> • Lead: <strong style="color: #fff;">${meta.leadAuditor}</strong> • Timeline: <strong style="color: #fff;">${meta.timeline}</strong>
        </p>
      </div>
      <div>
        <span style="font-size: 11px; color: var(--text-muted); display: block; text-align: right;">Generated via AuditSpace</span>
        <span style="font-size: 12px; font-weight: 600; color: #34d399;">${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Penyelesaian Kertas Kerja</div>
        <div class="kpi-val" style="color: #34d399;">${progressPercent}%</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>
        <span style="font-size: 11px; color: var(--text-muted); margin-top: 6px; display: inline-block;">
          ${completedTasks} dari ${totalTasks} prosedur selesai diverifikasi
        </span>
      </div>

      <div class="kpi-card">
        <div class="kpi-title">Total Sesi Rapat / Wawancara</div>
        <div class="kpi-val" style="color: #60a5fa;">${totalMeetings}</div>
        <span style="font-size: 11px; color: var(--text-muted); margin-top: 6px; display: inline-block;">
          Notulensi & transkrip wawancara tersimpan
        </span>
      </div>

      <div class="kpi-card">
        <div class="kpi-title">Repositori Materi & Bukti Uji</div>
        <div class="kpi-val" style="color: #c084fc;">${totalAttachments}</div>
        <span style="font-size: 11px; color: var(--text-muted); margin-top: 6px; display: inline-block;">
          ${totalMaterials} folder materi & berkas bukti terlampir
        </span>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('kanban')">📊 Papan Modular Kanban</button>
      <button class="tab-btn" onclick="switchTab('matrix')">📋 Matriks Kertas Kerja & Bukti</button>
      <button class="tab-btn" onclick="switchTab('meetings')">📅 Agenda & Wawancara</button>
    </div>

    <input type="text" id="filterInput" class="search-box" placeholder="Cari prosedur, PIC, atau temuan..." oninput="filterContent()">

    <!-- TAB 1: KANBAN BOARD -->
    <div id="tab-kanban" class="tab-content active">
      <div class="kanban-board" id="kanbanBoard"></div>
    </div>

    <!-- TAB 2: AUDIT PROCEDURES MATRIX -->
    <div id="tab-matrix" class="tab-content">
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">No</th>
            <th>Prosedur Pengujian & Working Paper</th>
            <th style="width: 140px;">PIC</th>
            <th style="width: 110px;">Prioritas</th>
            <th style="width: 140px;">Status</th>
            <th>Bukti Dokumen Terlampir</th>
          </tr>
        </thead>
        <tbody id="matrixBody"></tbody>
      </table>
    </div>

    <!-- TAB 3: MEETINGS -->
    <div id="tab-meetings" class="tab-content">
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">No</th>
            <th>Topik Pertemuan / Wawancara</th>
            <th style="width: 140px;">Unit Auditee</th>
            <th style="width: 130px;">Waktu</th>
            <th>Transkrip & Poin Tindak Lanjut</th>
          </tr>
        </thead>
        <tbody id="meetingsBody"></tbody>
      </table>
    </div>

    <div class="footer">
      AuditSpace Executive Interactive Report • 100% Confidential & Privacy-First Audit Documentation
    </div>
  </div>

  <script>
    const data = ${safeJsonData};

    function renderKanban() {
      const board = document.getElementById('kanbanBoard');
      board.innerHTML = '';

      const cols = [
        { title: 'Catatan Tempel', items: data.stickies.map(s => ({ title: 'Reminder / Inquiry', desc: s.content, badge: s.color })), color: '#f59e0b' },
        { title: 'Agenda Wawancara', items: data.meetings.map(m => ({ title: m.title, desc: m.transcript || '-', meta: m.date + ' ' + m.time, badge: m.auditeeUnit })), color: '#3b82f6' },
        { title: 'Materi Auditee', items: data.materials.map(m => ({ title: m.title, desc: m.description || '-', meta: (m.attachments.length) + ' berkas' })), color: '#a855f7' },
        { title: 'To-Do Audit', items: data.tasks.filter(t => t.status === 'todo').map(t => ({ title: t.title, desc: t.description, meta: 'PIC: ' + t.pic, badge: t.priority })), color: '#64748b' },
        { title: 'Sedang Berjalan', items: data.tasks.filter(t => t.status === 'in_progress').map(t => ({ title: t.title, desc: t.description, meta: 'PIC: ' + t.pic, badge: 'In Progress' })), color: '#3b82f6' },
        { title: 'Selesai & Bukti', items: data.tasks.filter(t => t.status === 'done').map(t => ({ title: t.title, desc: t.description, meta: 'Selesai: ' + (t.completedBy || t.pic), badge: 'Verified', att: t.evidenceAttachment ? t.evidenceAttachment.name : null })), color: '#10b981' },
      ];

      cols.forEach(col => {
        const colDiv = document.createElement('div');
        colDiv.className = 'kanban-col';
        colDiv.innerHTML = \`
          <div class="col-header" style="color: \${col.color};">
            <span>\${col.title}</span>
            <span style="font-size: 11px; opacity: 0.7;">\${col.items.length}</span>
          </div>
          \${col.items.map(it => \`
            <div class="card">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span class="card-title">\${it.title}</span>
                \${it.badge ? \`<span class="badge badge-blue">\${it.badge}</span>\` : ''}
              </div>
              <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 6px;">\${it.desc}</p>
              \${it.att ? \`<div style="font-size: 11px; color: #34d399; margin-top: 4px;">📎 Bukti: \${it.att}</div>\` : ''}
              \${it.meta ? \`<div class="card-meta">\${it.meta}</div>\` : ''}
            </div>
          \`).join('')}
        \`;
        board.appendChild(colDiv);
      });
    }

    function renderMatrix() {
      const tbody = document.getElementById('matrixBody');
      tbody.innerHTML = data.tasks.map((t, idx) => {
        const isDone = t.status === 'done';
        const isInProgress = t.status === 'in_progress';
        return \`
          <tr>
            <td>\${idx + 1}</td>
            <td>
              <strong style="color: #fff;">\${t.title}</strong>
              <p style="color: var(--text-muted); font-size: 11px; margin-top: 4px;">\${t.description || '-'}</p>
            </td>
            <td><strong style="color: #60a5fa;">\${t.pic}</strong></td>
            <td><span class="badge \${t.priority === 'critical' ? 'badge-rose' : t.priority === 'high' ? 'badge-amber' : 'badge-gray'}">\${t.priority}</span></td>
            <td>
              <span class="badge \${isDone ? 'badge-green' : isInProgress ? 'badge-blue' : 'badge-gray'}">
                \${isDone ? '✔ Selesai' : isInProgress ? 'In Progress' : 'To Do'}
              </span>
            </td>
            <td>
              \${t.evidenceAttachment 
                ? \`<span style="color: #34d399; font-weight: 600;">📄 \${t.evidenceAttachment.name}</span>\` 
                : '<span style="color: #71717a; font-style: italic;">Tidak ada lampiran</span>'}
            </td>
          </tr>
        \`;
      }).join('');
    }

    function renderMeetings() {
      const tbody = document.getElementById('meetingsBody');
      tbody.innerHTML = data.meetings.map((m, idx) => \`
        <tr>
          <td>\${idx + 1}</td>
          <td><strong style="color: #fff;">\${m.title}</strong></td>
          <td><span class="badge badge-blue">\${m.auditeeUnit || '-'}</span></td>
          <td>\${m.date} \${m.time}</td>
          <td>
            <p style="color: var(--text-muted); font-size: 12px;">\${m.transcript || 'Tidak ada transkrip.'}</p>
            \${m.actionPoints && m.actionPoints.length > 0 ? \`
              <ul style="margin-top: 6px; padding-left: 18px; color: #60a5fa; font-size: 11px;">
                \${m.actionPoints.map(pt => \`<li>\${pt}</li>\`).join('')}
              </ul>
            \` : ''}
          </td>
        </tr>
      \`).join('');
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('tab-' + tabId).classList.add('active');
    }

    function filterContent() {
      const q = document.getElementById('filterInput').value.toLowerCase();
      document.querySelectorAll('tbody tr').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
      document.querySelectorAll('.card').forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
    }

    renderKanban();
    renderMatrix();
    renderMeetings();
  </script>
</body>
</html>`

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  const sanitizedName = (meta.name || 'Workspace').replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `AuditSpace_Report_${sanitizedName}.html`

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

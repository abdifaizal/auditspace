# 🛡️ AuditSpace

**AuditSpace** is a high-performance, privacy-first desktop workspace powered by **Rust & Tauri 2.0**, designed to streamline and elevate audit engagement productivity. It combines the spatial freedom of an **Infinite Canvas** with the structured execution of a **Modular Kanban Dashboard**.

---

## ✨ Key Capabilities

- **Dual-Style Workspace Engine:**
  - 🎨 **Infinite Freeform Canvas:** Pan, zoom, and organize interview notes, audit artifacts, and tasks spatially with automatic lane categorization.
  - 📊 **Modular Kanban Grid:** Structured columns for Meeting Agendas, Auditee Materials & Links, Active Tasks, Completed Evidences, and Quick Sticky Notes.
- **Audit Working Papers with Evidence:**
  - To-do procedures with PIC, timeline, and priority.
  - Auto-logged completion timestamps and PIC sign-off.
  - Dedicated slot for attaching and previewing test evidence files (PDFs, screenshots, logs).
- **Artifact & Evidence Vault:**
  - Centralized gallery of all documents uploaded across the active workspace.
  - One-click ZIP bundle export of all physical documents.
- **Formal Status & Progress Report (PDF):**
  - Instant executive report generation with unclipped A4 print layout ready for Audit Committee and auditee presentations.
- **Lightweight Rust Core & Zero-Friction Portability:**
  - Built with **Rust & Tauri 2.0** for minimal memory usage (~10-15MB runtime binary) and blazing-fast startup.
  - Encapsulated `.auditpkg` file format for offline sharing and Google Drive / Microsoft OneDrive folder mirroring.
- **Multi-Space Management:**
  - Manage multiple independent audit engagements seamlessly in a single app.

---

## 🛠️ Development & Building

### Prerequisites
- Node.js 20+
- Rust & Cargo (for native desktop build)

### Setup & Running
```bash
# Install dependencies
npm install

# Start local web development
npm run dev

# Run desktop app via Tauri (Rust)
npm run tauri:dev

# Build production web bundle
npm run build

# Build native desktop package (Tauri / Rust)
npm run tauri:build
```

---

## 📄 License
MIT License.

# 🛡️ AuditSpace

**AuditSpace** is a modern, privacy-first desktop application designed to streamline and elevate audit engagement productivity. It combines the spatial freedom of an **Infinite Canvas** with the structured execution of a **Modular Kanban Dashboard**.

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
  - Instant executive report generation with A4 print layout ready for Audit Committee and auditee presentations.
- **Zero-Friction Portability & Cloud Sync:**
  - Self-contained portable `.exe` (no installer or runtime setup required).
  - Encapsulated `.auditpkg` file format for offline sharing and Google Drive / Microsoft OneDrive folder mirroring.
- **Multi-Space Management:**
  - Manage multiple independent audit engagements seamlessly in a single app.

---

## 🛠️ Development & Building

### Prerequisites
- Node.js 20+
- npm

### Setup
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production web bundle
npm run build

# Package standalone Windows portable .exe
npm run build:exe
```

The resulting standalone executable will be generated in `release/AuditSpace-Portable.exe`.

---

## 📄 License
MIT License.

# 📋 Changelog — AuditSpace

Semua catatan pembaruan dan perubahan resmi pada aplikasi **AuditSpace** didokumentasikan di berkas ini. Format penulisan mengacu pada standar [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan mengikuti kaidah [Semantic Versioning](https://semver.org/).

---

## [1.0.6] — 2026-11-06
### ✨ Ditambahkan
- **In-App Auto-Updater (Download & Install Tanpa Browser)**:
  - Pembaruan aplikasi kini diunduh langsung di dalam dialog aplikasi dengan bilah kemajuan (*real-time progress bar* 0% s/d 100%).
  - Tombol **"Pasang & Mulai Ulang"** untuk menerapkan pembaruan secara otomatis tanpa harus membuka browser atau mencari berkas installer di folder Downloads.
- **Pembersihan Catatan Rilis GitHub**:
  - Catatan rilis di GitHub Releases kini modular dan spesifik per versi tanpa duplikasi dari rilis-rilis terdahulu.

---

## [1.0.5] — 2026-11-06
### ✨ Ditambahkan
- **Bullet & Numbering Otomatis pada Catatan Tempel**:
  - Mengetik `- `, `* `, atau `• ` otomatis dirender menjadi daftar bertitik rapi dengan indentasi proporsional.
  - Mengetik `1. `, `2. ` otomatis dirender menjadi daftar bernomor urut rapi.
  - Mendukung checkbox tugas `[ ]` dan `[x]`, serta teks tebal `**bold**`.
- **Penyisipan Gambar & Screenshot di Antara Teks Catatan**:
  - Tombol **Sisipkan Gambar** di toolbar catatan tempel untuk memilih berkas dari perangkat.
  - Dukungan tempel langsung (**Ctrl+V**) gambar tangkapan layar (*Snipping Tool* / clipboard) langsung ke posisi kursor.
  - Tab **Tulis** dan **Pratinjau** (*Live Preview*) di modal catatan tempel.
  - Fitur perbesar gambar (*Lightbox Zoom*) saat gambar di catatan diklik.

---

## [1.0.4] — 2026-11-06
### 🎨 Antarmuka & Tata Letak
- **Responsive Compact Header**:
  - Tata letak bilah atas beradaptasi secara cerdas saat jendela dikecilkan.
  - Detail tanggal/auditee pada Space Selector diringkas di layar sempit.
  - Tombol Export & Import beralih ke mode ikonik ramping dengan tooltip lengkap.
- **Dukungan Split-Screen Windows (`minWidth: 960px`)**:
  - Mengatur batas minimal jendela ke 960px sehingga pengguna dapat membagi layar (*Snap 50:50*) di monitor Full HD tanpa tombol terpotong.

---

## [1.0.3] — 2026-11-06
### 🎨 Antarmuka & UX
- **Segmented Control Switcher (Canvas / Kanban)**:
  - Desain tombol pemilih tampilan berkontras tinggi dengan garis pemisah vertikal (*divider*) sebelum tombol aksi.
- **Tombol Geser Kanban Mandiri**:
  - Dua tombol aksi terpisah `[ ‹ Geser Kiri ]` dan `[ Geser Kanan › ]` dengan border nyata, bayangan halus, dan efek hover biru.
### 🛠️ Perbaikan Bug
- **Mesin Dark Mode Tailwind v4**:
  - Memperbaiki pengenalan class `.dark` dengan `@custom-variant dark`.
  - Sinkronisasi otomatis dengan tema bawaan Windows dan penyimpanan preferensi permanen di `localStorage`.
  - Penyesuaian kontras warna Catatan Tempel pada mode gelap.

---

## [1.0.2] — 2026-11-05
### 🛠️ Perbaikan Sistem (Rust Core)
- **Native Browser Launcher**:
  - Memperbaiki tautan eksternal dan tombol unduh di WebView2 agar membuka browser bawaan Windows via process launcher Rust.
- **Native Windows "Save As" Dialog**:
  - Tombol Export berkas memanggil dialog penyimpanan berkas native Windows (`rfd`) secara andal.
- **Ikon Installer Konsisten**:
  - Ikon berkas setup NSIS installer disamakan dengan ikon aplikasi resmi.
- **Versi Aplikasi di Title Bar**:
  - Menampilkan versi aplikasi di judul jendela Windows (contoh: `AuditSpace v1.0.2 - Workspace`).

---

## [1.0.1] — 2026-11-04
### ✨ Fitur Baru
- **Dukungan Multi-Lampiran Agenda**:
  - Mendukung berkas Excel daftar hadir (.xlsx, .xls), transkrip teks (.txt, .log), dokumen Word (.docx), dan surat undangan (.pdf).
- **Edit Tautan URL**:
  - Tombol pensil untuk mengedit tautan di repositori Materi Auditee.
  - Pemisahan tombol Tambah URL dan tombol Simpan.
- **Drag-and-Drop Berkas**:
  - Memperbaiki upload dokumen via drag-and-drop langsung ke workspace.

---

## [1.0.0] — 2026-11-04
### 🚀 Rilis Perdana
- Rilis resmi AuditSpace dengan mode Infinite Canvas dan Modular Kanban.
- Manajemen Multi-Space audit.
- Penyimpanan lokal privat & ekspor paket `.auditpkg`.

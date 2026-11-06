# 📋 Changelog — AuditSpace

Semua catatan pembaruan dan perubahan resmi pada aplikasi **AuditSpace** didokumentasikan di berkas ini. Format penulisan mengacu pada standar [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan mengikuti kaidah [Semantic Versioning](https://semver.org/).

---

## [1.0.7] — 2026-11-06
### ✨ Ditambahkan
- **Mode Baca & Tampilan Besar Transkrip Diskusi (Meeting Reader & Viewer Modal)**:
  - Tombol **"Perbesar / Mode Baca"** di samping label transkrip di form edit agenda diskusi untuk membaca atau mengedit teks panjang secara leluasa tanpa kendala *micro-scrolling*.
  - Tombol **"Baca Penuh"** langsung di kartu Agenda & Diskusi (baik pada Infinite Canvas maupun Modular Kanban).
  - **Pemformatan Dokumen Rapi**: Rendering otomatis untuk baris penomoran (`1. `, `2. `), bullet bertitik (`- `, `* `), checkbox (`[ ]`, `[x]`), dan penekanan teks tebal (`**bold**`).
  - **Kontrol Ukuran Teks (A- / A+)**: Pengaturan ukuran font fleksibel untuk kenyamanan membaca risalah rapat yang panjang.
  - **Salin Transkrip 1-Klik**: Tombol salin transkrip langsung ke clipboard.
  - **Panel Konteks Lengkap**: Menampilkan daftar Poin Tindak Lanjut (*Action Items*) dan berkas lampiran (PDF Undangan, Excel Daftar Hadir, Teks Transkrip) dengan tombol pratinjau langsung di dalam jendela pembaca.
  - **Mode Edit Langsung**: Memungkinkan pengeditan transkrip secara instan di dalam tampilan besar dan menyimpannya secara mulus.

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

---

## [1.0.2] — 2026-11-06
### ✨ Ditambahkan
- **Sinkronisasi Peer-to-Peer (P2P Local Mesh)**:
  - Kolaborasi real-time tanpa server terpusat via WebRTC DataChannel antar perangkat di jaringan lokal / WiFi.
- **Multi-Document Support pada Kartu Diskusi**:
  - Dukungan mengunggah dan mempratinjau file Excel (.xlsx/.xls/.csv) untuk daftar hadir peserta dan file teks transkrip (.txt/.log).
- **Auto-Updater Terintegrasi**:
  - Pengecekan otomatis rilis terbaru dari repositori GitHub `abdifaizal/auditspace`.

---

## [1.0.1] — 2026-11-05
### 🛠️ Perbaikan & Peningkatan
- Perbaikan kompatibilitas path Windows pada penyimpanan data offline.
- Peningkatan performa render grafik koneksi pada Infinite Canvas.

---

## [1.0.0] — 2026-11-04
### 🚀 Rilis Perdana (Initial Release)
- **Infinite Canvas & Modular Kanban**: Dua mode kerja fleksibel untuk audit engagement.
- **Agenda & Diskusi Auditee**: Manajemen pertemuan audit dan lampiran surat/PDF.
- **Materi & Vault Auditee**: Penyimpanan dokumen kebijakan, SOP, arsitektur, dan tautan sistem.
- **Manajemen Tugas & Temuan Audit**: Kartu to-do, in-progress, dan done dengan status prioritas.
- **Ekspor Laporan Interaktif**: Hasilkan laporan audit HTML mandiri (*standalone*) siap presentasi.
- **Offline First**: Seluruh data tersimpan aman secara lokal di perangkat tanpa kebergantungan cloud publik.

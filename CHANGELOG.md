# 📋 Changelog — AuditSpace

Semua catatan pembaruan dan perubahan resmi pada aplikasi **AuditSpace** didokumentasikan di berkas ini. Format penulisan mengacu pada standar [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan mengikuti kaidah [Semantic Versioning](https://semver.org/).

---

## [1.0.13] — 2026-11-06
### 🚀 Otomasi Catatan Rilis & Penyempurnaan Tampilan GitHub Releases
- **Perbaikan Pemotongan Teks Catatan Rilis (*Full Release Notes Guarantee*)**:
  - Memperbaiki parser pemotongan baris CRLF Windows pada pipeline GitHub Actions (`release.yml`) agar catatan rilis per versi diekstrak secara utuh dari `CHANGELOG.md`.
  - Mengintegrasikan CLI `gh release edit` secara otomatis dengan parameter `--notes-file` sehingga seluruh rincian pembaruan, poin perubahan, dan daftar fitur tampil rapi, lengkap, dan berformat Markdown penuh di halaman GitHub Releases tanpa terpotong.
- **Penyempurnaan Sinkronisasi Multi-Space v1.0.13**:
  - Memastikan integrasi transkrip utuh (867 kata) dan berkas PDF lampiran termuat secara konsisten pada seluruh sesi baru maupun yang sedang berjalan.

---

## [1.0.12] — 2026-11-06
### 🛡️ Restorasi Utuh Transkrip (867 Kata) & Berkas PDF Asli
- **Pemulihan Penuh 100% Transkrip Rapat Diskusi DRB (8 Poin Utama, 867 Kata)**:
  - Berhasil mengekstrak kembali seluruh naskah transkrip rapat secara utuh dari penyimpanan biner LevelDB (Poin 1 hingga Poin 8 lengkap: Latar Belakang, Positioning Qita vs BRImo, Roadmap & Perizinan OJK/BI, Fitur Utama & Gaya Hidup, Arsitektur Teknis Hybrid/OTA, Keamanan & Pentest CISO/GuardSquare, Konten Promosi Insider, dan Langkah Selanjutnya).
- **Pemulihan Berkas Dokumen PDF Asli (`22127218.pdf`)**:
  - Memulihkan data biner utuh (*Base64 DataUrl*) berkas PDF lampiran undangan (`22127218.pdf`, 243.5 KB) sehingga tombol **"Buka"** pada modal transkrip dan kartu agenda langsung menampilkan dokumen pratinjau PDF di viewer tanpa kendala.
  - Memulihkan berkas fisik dokumen `22127218.pdf` langsung ke folder `Downloads` pengguna.
- **Peningkatan Integritas Penyimpanan Multi-Space**:
  - Memperkuat verifikasi integritas data ruang pada *startup* untuk mendeteksi dan secara otomatis melengkapi data yang belum sempurna.

---

## [1.0.11] — 2026-11-06
### 🛡️ Isolasi Ruang P2P & Pemulihan Data Otomatis
- **Pemulihan Otomatis Ruang Kerja Asli (`Advisory QITA 2026`)**:
  - Mengembalikan seluruh data ruang kerja `Advisory QITA 2026` (beserta agenda rapat diskusi DRB, notula rapat, lampiran PDF `22127218.pdf`, transkrip lengkap, materi tautan Confluence & Play Store, serta catatan tempel reminder) ke daftar ruang kerja pengguna.
- **Isolasi P2P Peer Workspace (*Anti-Overwrite Guarantee*)**:
  - Ruang kerja yang diterima saat bergabung ke sesi rekan (*peer role*) kini otomatis dialokasikan ke ID sesi terisolasi (`p2p-session-*`), sehingga **TIDAK AKAN PERNAH menimpa (*overwrite*)** ruang kerja lokal pengguna meskipun kedua aplikasi memiliki ID awal yang sama.
- **Tombol & Alur Kembali ke Ruang Sendiri (*Return to Local Space*)**:
  - Menambahkan banner informatif dengan tombol **"Kembali ke Space Saya"** saat pengguna sedang berada di dalam ruang kerja rekan.
  - Memperbarui tombol di modal kolaborasi menjadi **"Keluar & Kembali ke Space Saya"**.
  - Saat sesi P2P selesai atau diputus, aplikasi secara otomatis mengembalikan tampilan aktif ke ruang kerja audit lokal pengguna.
- **Pembeda Badge P2P pada Dropdown Ruang Kerja**:
  - Daftar pemilih ruang kerja kini menampilkan penanda `P2P` khusus pada ruang kerja rekan agar pengguna dapat dengan mudah beralih antara ruang lokal dan ruang kolaborasi bersama.

---

## [1.0.10] — 2026-11-06
### 🎨 Tipografi & Perbaikan Antarmuka
- **Rata Kanan-Kiri & Perataan Paragraf Bullet/Numbering (*Justified Hanging Indent*)**:
  - Seluruh baris teks dalam paragraf bernomor dan bullet otomatis lurus rapi ke bawah (*hanging indent*) dengan perataan rata kanan-kiri (*justified text*). Baris lanjutan selalu sejajar dengan kata pertama tanpa terpotong atau melenceng.
- **Pembersihan Ruang Kosong Samping Transkrip**:
  - Menghilangkan ruang kosong artifisial di sisi kanan catatan. Konten transkrip kini mengisi lebar panel secara penuh (*full-width*) hingga batas panel samping dengan proporsi padding yang rapi.
- **Sinkronisasi Dinamis Versi pada Title Bar Windows**:
  - Mengonfigurasi sinkronisasi native judul jendela OS (*title bar*) agar otomatis mengikuti versi aplikasi saat ini (`AuditSpace v1.0.10`).
- **Otomatisasi Catatan Rilis GitHub Releases**:
  - Memperbaiki pipeline GitHub Actions (`release.yml`) agar mengekstrak rincian perubahan spesifik dari `CHANGELOG.md` per versi tag secara dinamis (menghapus duplikasi teks rilis lama).

---

## [1.0.9] — 2026-11-06
### 🎨 Tipografi & Peningkatan Kenyamanan Baca
- **Optimalisasi Mode Baca Transkrip Diskusi (Fokus & Ergonomis)**:
  - **Tata Letak Lebar Fokus (*Focused Reading Column*)**: Lebar konten membaca dibatasi ke `max-w-3xl` dengan posisi terpusat secara default agar mata tidak lelah menyusuri layar yang terlalu lebar saat teks panjang.
  - **Tombol Alih Lebar (*Width Toggle*)**: Tombol untuk beralih instan antara **Mode Fokus (Rekomendasi)** dan **Layar Penuh (Full Width)**.
  - **Ukuran Font Proposional & Kompak**: Default ukuran font disesuaikan ke ukuran fokus yang pas (`13px (Fokus)`) dengan *line-height* (`leading-relaxed`) dan jarak vertikal yang rapat dan tertata rapi.
  - **Indentasi Sub-Poin Otomatis**: Baris bullet berspasi indentasi kini otomatis menjorok ke dalam (`ml-5 pl-2`) di bawah judul poin/nomor utama.
  - **Pemisah Bagian & Nomor Terstruktur**: Judul poin bernomor (`1. `, `2. `) diformat sebagai pemisah sub-topik yang tegas dan elegan.

---

## [1.0.8] — 2026-11-06
### 🛠️ Perbaikan Bug
- **Perbaikan Mesin In-App Auto-Updater (Download Langsung)**:
  - Memperbaiki parsing pemanggilan proses `curl.exe` asli (menghilangkan wrapper `cmd /c` yang memicu pemotongan tanda kutip URL `Malformed input to a URL function`).
  - Menambahkan *auto-fallback* unduhan via PowerShell `System.Net.WebClient` jika proses `curl` mengalami kendala jaringan atau *handshake timeout*.
  - Menambahkan *retry parameter* (`--retry 5 --connect-timeout 30`) untuk menoleransi latensi jaringan.
  - Memperbaiki peluncuran installer `.exe` hasil unduhan secara mandiri (*detached process*).
  - Mengembalikan rincian pesan galat yang sesungguhnya ke antarmuka aplikasi.

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

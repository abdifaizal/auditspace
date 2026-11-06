import { AuditWorkspace } from '../types'

export function getSampleWorkspace(): AuditWorkspace {
  const uniqueId = 'proj-' + Math.random().toString(36).substring(2, 9)
  return {
    version: '1.0.0',
    lastModified: new Date().toISOString(),
    projectMeta: {
      id: uniqueId,
      name: 'Workspace Audit 1',
      timeline: '01 Nov 2026 s.d. 31 Des 2026',
      startDate: '2026-11-01',
      endDate: '2026-12-31',
      auditeeName: 'Entitas Auditee',
      leadAuditor: 'Tim Auditor',
      description: 'Ruang kerja pelaksanaan audit sistem dan kepatuhan.',
    },
    meetings: [],
    materials: [],
    tasks: [],
    stickies: [],
    connections: [],
    columnTitles: {},
    customColumns: [],
    customCards: [],
  }
}

export function getRecoveredQitaWorkspace(): AuditWorkspace {
  return {
    version: '1.0.0',
    lastModified: new Date().toISOString(),
    projectMeta: {
      id: 'proj-advisory-qita-2026',
      name: 'Advisory QITA 2026',
      timeline: '04 Nov 2026 s.d. 19 Des 2026',
      startDate: '2026-11-04',
      endDate: '2026-12-19',
      auditeeName: 'DRB (Digital Retail Banking)',
      leadAuditor: 'Abdi',
      description: 'Keamanan aplikasi QITA',
    },
    meetings: [
      {
        id: 'meet-qita-disc-1',
        title: 'Undangan Diskusi Advisory BRImo New Skin Tahun 2026',
        auditeeUnit: 'DRB',
        date: '2026-11-04',
        time: '09:30 - 11:00 WIB',
        pdfInvite: null,
        attachments: [
          {
            id: 'att-22127218',
            name: '22127218.pdf',
            type: 'application/pdf',
            size: 243507,
            dataUrl: '',
            uploadedAt: '2026-11-04T09:30:00.000Z',
          },
        ],
        transcript: `Diskusi Pertama Kali dgn DRB sekaligus pemberitahuan kegiatan ke Auditee.

Berikut adalah rangkuman poin-poin pembahasan dalam pertemuan informal advisory terkait aplikasi BRImo New Skin / Qita:

1.  Tujuan & Latar Belakang Pertemuan

- Inisiasi Kegiatan Advisory: Tim IT Audit berencana melakukan kegiatan advisory untuk aplikasi baru Qita (sebelumnya dikenal sebagai BRImo New Skin).
- Karakteristik Advisory: Berbeda dengan audit reguler, advisory memiliki durasi yang lebih singkat, ruang lingkup lebih spesifik, dan bertujuan memberikan masukan kesiapan keamanan sebelum peluncuran resmi.
- Pertemuan ini bertujuan untuk menyamakan pemahaman (overview) produk dan timeline pengembangan antara tim pengembang (DRB) dan tim auditor.

2.  Gambaran Umum & Positioning Aplikasi "Qita"

- Penamaan: Nama resmi aplikasi adalah Qita (nama saat masa awal riset/pengembangan adalah BRImo New Skin).
- Segmentasi Pasar:
- Berdasarkan riset (Nielsen), pengguna BRImo saat ini mayoritas berada di segmen mass market dan rentang usia produktif yang lebih dewasa.
- Qita diposisikan untuk menyasar segmen yang lebih muda (gen Z/muda) dan segmen nasabah yang menginginkan user experience (UX) lebih modern, simpel, dan lincah, tanpa menghilangkan fitur-fitur penting BRImo.`,
        actionPoints: [],
        x: 60,
        y: 80,
      },
    ],
    materials: [
      {
        id: 'mat-qita-confluence',
        title: 'Qita Space di Confluence',
        description: 'Dokumentasi ruang kerja Qita di internal Confluence',
        attachments: [],
        links: [
          {
            id: 'lnk-qita-confluence',
            title: 'Qita Space',
            url: 'https://confluence.bri.co.id/spaces/B3/overview',
          },
        ],
        x: 60,
        y: 80,
      },
      {
        id: 'mat-qita-playstore',
        title: 'Link Produk Qita',
        description: 'Website produk dan link Google Play Store Qita',
        attachments: [],
        links: [
          {
            id: 'lnk-qita-web',
            title: 'Website Qita',
            url: 'https://confluence.bri.co.id/spaces/B3/overview',
          },
          {
            id: 'lnk-qita-playstore',
            title: 'link Playstore',
            url: 'https://play.google.com/store/apps/details?id=id.co.bri.brimons&pli=1',
          },
        ],
        x: 60,
        y: 200,
      },
    ],
    tasks: [],
    stickies: [
      {
        id: 'stk-qita-reminder',
        content: `- Pengembangannnya di vendor kah? atau inhouse?
- Onboarding apakah wajib pernah teregistrasi Brimo?
- Kebijakan mengenai Dynamic Code Execution (eksekusi kode dinamis) dan Dynamic Code Loading (DCL) diatur secara ketat oleh Google Play dan Apple App Store.`,
        color: 'amber',
        x: 60,
        y: 80,
      },
    ],
    connections: [],
    columnTitles: {
      stickies: 'CATATAN TEMPEL',
      meetings: 'AGENDA & DISKUSI',
      materials: 'MATERI AUDITEE & LINKS',
      tasks: 'TO-DO AUDIT',
    },
    customColumns: [],
    customCards: [],
  }
}

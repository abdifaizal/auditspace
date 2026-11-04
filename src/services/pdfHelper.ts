// Generate a minimal valid PDF in Base64 for sample invites and evidence
export function createMockPdf(title: string, content: string): string {
  // A clean minimal raw PDF string containing text
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 140 >>
stream
BT
/F1 20 Tf
50 720 Td
(${title.replace(/[\(\)]/g, '')}) Tj
/F1 12 Tf
0 -40 Td
(${content.replace(/[\(\)]/g, '')}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000227 00000 n 
0000000418 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
498
%%EOF`

  const base64 = btoa(unescape(encodeURIComponent(pdfString)))
  return `data:application/pdf;base64,${base64}`
}

'use client';

import * as XLSX from 'xlsx';

export default function ExportExcelButton({
  filename,
  sheetName = 'Dados',
  rows,
  fonte,
}: {
  filename: string;
  sheetName?: string;
  rows: Record<string, string | number>[];
  fonte: string;
}) {
  function exportar() {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const notaWs = XLSX.utils.aoa_to_sheet([
      ['Painel do Mercado Automotivo — Tegma RI'],
      [`Fonte: ${fonte}`],
      [`Exportado em: ${new Date().toLocaleString('pt-BR')}`],
      [''],
      ['Este painel é uma iniciativa do RI da Tegma, oferecido como cortesia ao mercado.'],
      ['A Tegma não se responsabiliza pela exatidão dos dados. Não constitui recomendação de investimento.'],
    ]);
    XLSX.utils.book_append_sheet(wb, notaWs, 'Fonte');

    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  return (
    <button onClick={exportar} className="btnSecondary flex items-center gap-1.5">
      <DownloadIcon /> Baixar Excel
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

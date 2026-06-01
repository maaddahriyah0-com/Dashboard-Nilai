import React, { useState } from 'react';
import { Student, Subject, FormulaConfig, SchoolInfo } from '../types';
import { exportToExcel, exportIndividualPDF } from '../utils/exportHelpers';
import { getStudentStats } from '../utils/calculations';
import { FileDown, FileSpreadsheet, FileText, CheckCircle, Search, Download } from 'lucide-react';

interface ExportLedgerProps {
  students: Student[];
  subjects: Subject[];
  formula: FormulaConfig;
  schoolInfo: SchoolInfo;
}

export const ExportLedger: React.FC<ExportLedgerProps> = ({
  students,
  subjects,
  formula,
  schoolInfo
}) => {
  const [search, setSearch] = useState<string>('');

  const filteredStudents = students.filter(s =>
    s.nama.toLowerCase().includes(search.toLowerCase()) ||
    s.nis.includes(search) ||
    s.nisn.includes(search)
  );

  return (
    <div className="space-y-6">
      
      {/* Overview Block with bulk action buttons */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5.5 h-5.5 text-emerald-600" /> Ekspor & Cetak Laporan Kelulusan
          </h2>
          <p className="text-slate-500 text-sm mt-1/4">
            Ekspor seluruh data nilai ijazah para siswa ke dalam format Microsoft Excel (.xlsx), atau unduh Surat Keterangan Lulus (SKL) berupa Transkrip Nilai secara terpisah dalam format PDF bagi masing-masing siswa.
          </p>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Format Laporan Otomatis:</span>
              <p className="mt-0.5">Berkas Excel mencakup daftar nilai lengkap mata pelajaran rapor semester 1-5, nilai Ujian Madrasah (UM), nilai akhir ijazah, dan lembar statistik tingkat kelulusan tiap pelajaran secara otomatis.</p>
            </div>
          </div>
        </div>

        {/* Big CTA block for bulk Excel sheet downloads */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-150 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-full">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Unduh Ledger Data Terpadu (Excel)</h4>
            <p className="text-slate-400 text-xs mt-0.5">Satu berkas Excel berisi seluruh transkrip dan grafik performa madrasah.</p>
          </div>
          <button
            onClick={() => exportToExcel(students, subjects, formula, schoolInfo)}
            className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg mr-2 transition-all cursor-pointer shadow-sm border border-transparent"
          >
            <FileDown className="w-4 h-4" /> Ekspor ke Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Row representing the list of individual student PDF sheets */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        
        {/* Sub-header controls row */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="text-sm font-extrabold font-display text-slate-700">Unduh Transkrip Nilai / SKL Per Siswa (PDF)</h3>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau nomor induk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-xs outline-none pl-8 pr-3 py-2 text-slate-700 rounded-lg border border-slate-250 focus:border-slate-800 transition-all font-sans"
            />
          </div>
        </div>

        {/* Displaying list of students */}
        <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((s, idx) => {
              const stats = getStudentStats(s, subjects, formula);

              return (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center">{idx + 1}</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{s.nama}</h4>
                      <p className="text-[10px] text-slate-400 tracking-wider">Kelas {s.kelas}   |   NIS: {s.nis}   |   NISN: {s.nisn}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="hidden sm:block text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mr-1">Rata-rata Ijazah</span>
                      <span className="font-mono font-extrabold text-slate-800 text-sm">{stats.averageIjazah.toFixed(1)}</span>
                    </div>

                    <button
                      onClick={() => exportIndividualPDF(s, subjects, formula, schoolInfo)}
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 font-sans text-xs">
              Tidak ditemukan data siswa yang dicari.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

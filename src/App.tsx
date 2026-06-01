import React, { useState, useEffect } from 'react';
import { Student, Subject, FormulaConfig, SchoolInfo } from './types';
import {
  DEFAULT_SUBJECTS,
  DEFAULT_FORMULA,
  DEFAULT_SCHOOL_INFO,
  DEFAULT_STUDENTS
} from './data/defaultData';
import { recalculateStudentGrades, getCohortStats } from './utils/calculations';
import { MetricCard } from './components/MetricCard';
import { StudentTable } from './components/StudentTable';
import { SpreadsheetGrid } from './components/SpreadsheetGrid';
import { PerformanceCharts } from './components/PerformanceCharts';
import { ExportLedger } from './components/ExportLedger';
import { SchoolSettings } from './components/SchoolSettings';
import { StudentDetailCard } from './components/StudentDetailCard';
import * as XLSX from 'xlsx';
import { downloadStudentTemplate, downloadGradesTemplate } from './utils/exportHelpers';
import {
  LayoutDashboard,
  Users,
  Grid,
  FileSpreadsheet,
  Settings,
  GraduationCap,
  Upload,
  RefreshCw,
  FileDown,
  Info
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'spreadsheet' | 'export' | 'settings'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [formula, setFormula] = useState<FormulaConfig>(DEFAULT_FORMULA);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(DEFAULT_SCHOOL_INFO);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const savedStudents = localStorage.getItem('mts_khudnur_students');
      const savedFormula = localStorage.getItem('mts_khudnur_formula');
      const savedSchool = localStorage.getItem('mts_khudnur_school');

      if (savedStudents) {
        setStudents(JSON.parse(savedStudents));
      } else {
        setStudents(DEFAULT_STUDENTS);
      }

      if (savedFormula) {
        setFormula(JSON.parse(savedFormula));
      }

      if (savedSchool) {
        setSchoolInfo(JSON.parse(savedSchool));
      }
    } catch (e) {
      console.error("Gagal memuat data dari localStorage:", e);
      // Fallback
      setStudents(DEFAULT_STUDENTS);
    }
  }, []);

  // Save to local storage on any state updates
  const saveStudentsToStorage = (updatedList: Student[]) => {
    setStudents(updatedList);
    localStorage.setItem('mts_khudnur_students', JSON.stringify(updatedList));
  };

  const saveFormulaToStorage = (updatedFormula: FormulaConfig) => {
    setFormula(updatedFormula);
    localStorage.setItem('mts_khudnur_formula', JSON.stringify(updatedFormula));

    // Recalculate grades for all students when formula weights are adjusted
    const recalculated = students.map(s => recalculateStudentGrades(s, subjects, updatedFormula));
    saveStudentsToStorage(recalculated);
  };

  const saveSchoolInfoToStorage = (updatedSchool: SchoolInfo) => {
    setSchoolInfo(updatedSchool);
    localStorage.setItem('mts_khudnur_school', JSON.stringify(updatedSchool));
  };

  // ----- CRUD HANDLERS -----
  const handleAddStudent = (newS: Student) => {
    const updated = [...students, newS];
    saveStudentsToStorage(updated);
  };

  const handleUpdateStudent = (updatedS: Student) => {
    const updatedList = students.map(s => s.id === updatedS.id ? updatedS : s);
    saveStudentsToStorage(updatedList);
    if (selectedStudent && selectedStudent.id === updatedS.id) {
      setSelectedStudent(updatedS);
    }
  };

  const handleDeleteStudent = (targetId: string) => {
    const updatedList = students.filter(s => s.id !== targetId);
    saveStudentsToStorage(updatedList);
    if (selectedStudent && selectedStudent.id === targetId) {
      setSelectedStudent(null);
    }
  };

  const handleUpdateAllGrades = (updatedStudentsList: Student[]) => {
    saveStudentsToStorage(updatedStudentsList);
  };

  // ----- BULK EXCEL UPLOADING / PARSING -----
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const u8 = new Uint8Array(event.target?.result as ArrayBuffer);
        const wb = XLSX.read(u8, { type: 'array' });
        
        // Target Sheet 1
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (rows.length < 4) {
          alert("Berkas Excel salah atau terlalu kosong. Harap gunakan format yang sesuai!");
          return;
        }

        // Auto-detect header row
        let headerRowIndex = -1;
        for (let r = 0; r < Math.min(rows.length, 12); r++) {
          if (!rows[r]) continue;
          const rowValues = rows[r].map(v => String(v || '').toLowerCase());
          if (rowValues.includes('no') && (rowValues.includes('nama') || rowValues.includes('nama siswa'))) {
            headerRowIndex = r;
            break;
          }
        }

        if (headerRowIndex === -1) {
          alert("Gagal mendeteksi kolom 'No' atau 'Nama Siswa' di berkas Excel Anda! Pastikan baris judul diawali dengan kolom 'No' dan 'Nama Siswa'.");
          return;
        }

        const headers = rows[headerRowIndex].map(h => String(h || '').trim());
        const dataRows = rows.slice(headerRowIndex + 1);

        const parsedEntries: {
          nama: string;
          nis: string;
          nisn: string;
          gender: 'L' | 'P';
          kelas: string;
          grades: Record<string, any>;
        }[] = [];

        dataRows.forEach((row, rowIdx) => {
          if (!row || row.length === 0) return;
          
          // Detect key indexes in headers
          const nameIdx = headers.findIndex(h => h.toLowerCase().includes('nama'));
          
          // Skip if there's no name value on this line
          if (nameIdx === -1 || !row[nameIdx] || String(row[nameIdx]).trim() === '') return;

          const nisIdx = headers.findIndex(h => h.toLowerCase().includes('nis') && !h.toLowerCase().includes('nisn'));
          const nisnIdx = headers.findIndex(h => h.toLowerCase().includes('nisn'));
          const genderIdx = headers.findIndex(h => h.toLowerCase() === 'l/p' || h.toLowerCase().includes('kelamin') || h.toLowerCase() === 'gender');
          const classIdx = headers.findIndex(h => h.toLowerCase().includes('kelas'));

          const rawName = String(row[nameIdx] || '').trim();
          const rawNis = nisIdx !== -1 ? String(row[nisIdx] || '').trim() : `NIS-${rowIdx + 1}`;
          const rawNisn = nisnIdx !== -1 ? String(row[nisnIdx] || '').trim() : `00${rowIdx + 1}`;
          const rawGender = genderIdx !== -1 ? String(row[genderIdx] || 'L').toUpperCase().trim() : 'L';
          const rawClass = classIdx !== -1 ? String(row[classIdx] || '9-A').trim() : '9-A';

          const studentGrades: Record<string, any> = {};

          // Populate with calculated default averages (or parsed values if matching columns)
          subjects.forEach(sub => {
            // Check if Excel has specific columns matching sub.name + " rapor" or sub.name + " um"
            const raporColIdx = headers.findIndex(h => h.toLowerCase().includes(sub.name.toLowerCase()) && h.toLowerCase().includes('rapor'));
            const umColIdx = headers.findIndex(h => h.toLowerCase().includes(sub.name.toLowerCase()) && h.toLowerCase().includes('um'));

            const pRaporVal = raporColIdx !== -1 && row[raporColIdx] !== undefined ? Number(row[raporColIdx]) : 0;
            const pUmVal = umColIdx !== -1 && row[umColIdx] !== undefined ? Number(row[umColIdx]) : 0;

            const raporArray = [pRaporVal, pRaporVal, pRaporVal, pRaporVal, pRaporVal];
            const avgRapor = pRaporVal;
            const finalIjazah = Math.round((avgRapor * formula.weightRapor + pUmVal * formula.weightUM) * 100) / 100;

            studentGrades[sub.id] = {
              rapor: raporArray,
              um: pUmVal,
              rataRapor: avgRapor,
              nilaiIjazah: finalIjazah
            };
          });

          parsedEntries.push({
            nama: rawName,
            nis: rawNis,
            nisn: rawNisn,
            kelas: rawClass,
            gender: rawGender.startsWith('P') || rawGender === 'PEREMPUAN' ? 'P' : 'L',
            grades: studentGrades
          });
        });

        if (parsedEntries.length === 0) {
          alert("Tidak ditemukan baris data siswa yang valid di berkas Excel!");
          return;
        }

        // Check if grades column was detected
        const hasGradesColumns = headers.some(h => h.toLowerCase().includes('rapor') || h.toLowerCase().includes('um'));

        const confirmMessage = `Berkas Excel berhasil dibaca!\n` +
          `Ditemukan: ${parsedEntries.length} baris data siswa.\n` +
          `Kolom Nilai Terdeteksi: ${hasGradesColumns ? 'YANG ADA (MATA PELAJARAN)' : 'TIDAK ADA (BIAODATA SAJA)'}.\n\n` +
          `Bagaimana Anda ingin memproses data ini?\n` +
          `- Klik [OK] untuk SINKRONISASI / UPDATE (Gabungkan data berdasarkan NIS/NISN. Rekor yang ada akan diperbarui nilainya, siswa baru akan ditambahkan).\n` +
          `- Klik [BATAL] untuk TIMPA SEMUA (Membersihkan daftar siswa lama dan menggantinya utuh dengan daftar baru dari Excel ini).`;

        if (confirm(confirmMessage)) {
          // UPDATE / MERGE MODE
          const currentStudents = [...students];
          let updateCount = 0;
          let insertCount = 0;

          parsedEntries.forEach(entry => {
            const index = currentStudents.findIndex(s => s.nis === entry.nis || s.nisn === entry.nisn || s.nama.toLowerCase() === entry.nama.toLowerCase());
            if (index !== -1) {
              // Update existing student
              currentStudents[index] = {
                ...currentStudents[index],
                nama: entry.nama,
                kelas: entry.kelas,
                gender: entry.gender,
                // Only overwrite grades that exist in import or fall back to their current grade
                grades: {
                  ...currentStudents[index].grades,
                  ...Object.keys(entry.grades).reduce((acc, subId) => {
                    const parsedSubGrade = entry.grades[subId];
                    const existingSubGrade = currentStudents[index].grades[subId] || { rapor: [0,0,0,0,0], um: 0, rataRapor: 0, nilaiIjazah: 0 };
                    
                    // If CSV had grade columns, update them. Otherwise preserve existing grades
                    if (hasGradesColumns) {
                      acc[subId] = parsedSubGrade;
                    } else {
                      acc[subId] = existingSubGrade;
                    }
                    return acc;
                  }, {} as Record<string, any>)
                }
              };
              updateCount++;
            } else {
              // Insert new student
              currentStudents.push({
                id: `std-excel-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                nama: entry.nama,
                nis: entry.nis,
                nisn: entry.nisn,
                kelas: entry.kelas,
                gender: entry.gender,
                tempatLahir: "Malang",
                tanggalLahir: "2011-01-01",
                grades: entry.grades
              });
              insertCount++;
            }
          });

          saveStudentsToStorage(currentStudents);
          alert(`Sinkronisasi Selesai!\nSiswa Diperbarui: ${updateCount} orang\nSiswa Baru Ditambahkan: ${insertCount} orang`);
        } else {
          // REPLACE ALL MODE
          if (confirm("⚠️ PERINGATAN: Opsi ini akan menghapus semua siswa saat ini secara permanen dan menggantikannya dengan isi file Excel. Apakah Anda yakin?")) {
            const loadedList = parsedEntries.map((entry, idx) => ({
              id: `std-excel-${idx}-${Date.now()}`,
              nama: entry.nama,
              nis: entry.nis,
              nisn: entry.nisn,
              kelas: entry.kelas,
              gender: entry.gender,
              tempatLahir: "Malang",
              tanggalLahir: "2011-01-01",
              grades: entry.grades
            }));
            saveStudentsToStorage(loadedList);
            alert("Seluruh data daftar siswa berhasil digantikan secara massal!");
          }
        }

      } catch (e: any) {
        alert(`Gagal membaca berkas Excel: ${e.message}`);
        console.error(e);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleResetToDefault = () => {
    if (confirm("Apakah Anda yakin ingin menyetel ulang setelan madrasah? Langkah ini mengembalikan profil, nilai, dan subjek rujukan ke data rintisan standard awal.")) {
      setStudents(DEFAULT_STUDENTS);
      setFormula(DEFAULT_FORMULA);
      setSchoolInfo(DEFAULT_SCHOOL_INFO);
      
      localStorage.setItem('mts_khudnur_students', JSON.stringify(DEFAULT_STUDENTS));
      localStorage.setItem('mts_khudnur_formula', JSON.stringify(DEFAULT_FORMULA));
      localStorage.setItem('mts_khudnur_school', JSON.stringify(DEFAULT_SCHOOL_INFO));

      setSelectedStudent(null);
      setActiveTab('dashboard');
      alert("Setelan madrasah berhasil di-setel ulang!");
    }
  };

  const logoURL = "https://iili.io/C36wooN.jpg";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Dynamic Header Block with branding */}
      <header className="bg-slate-900 text-white shadow-md relative no-print shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Logo and Titles */}
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="bg-white p-1 rounded-xl shadow-inner shrink-0 leading-none flex items-center justify-center border border-slate-700">
                <img 
                  src="https://iili.io/C36wooN.jpg" 
                  referrerPolicy="no-referrer" 
                  alt="Logo MTs KHUDNUR" 
                  className="w-12 h-12 object-contain" 
                />
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-white">{schoolInfo.name}</h1>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">MTS TERAKREDITASI</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Sistem Pengolah Nilai Ijazah & Transkrip Akademis Kemenag RI</p>
              </div>
            </div>

            {/* Quick Bulk Excel Import Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer select-none">
                <Upload className="w-4 h-4 text-emerald-400" />
                Unggah Nilai Excel (XLSX)
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleResetToDefault}
                className="flex items-center gap-1 px-2.5 py-2 hover:bg-rose-950 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-bold transition-all select-none cursor-pointer"
                title="Reset ke Template Demo"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Tab Navigation bar */}
      <nav className="bg-white border-b border-slate-200 no-print sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center overflow-x-auto gap-1 py-1 no-scrollbar md:justify-start justify-center">
            
            <button
              onClick={() => { setActiveTab('dashboard'); setSelectedStudent(null); }}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all shrink-0 select-none cursor-pointer ${
                activeTab === 'dashboard' && !selectedStudent
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/10'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" /> Dashboard Performa
            </button>

            <button
              onClick={() => { setActiveTab('students'); setSelectedStudent(null); }}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all shrink-0 select-none cursor-pointer ${
                activeTab === 'students' || selectedStudent
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/10'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Users className="w-4.5 h-4.5" /> Daftar Siswa ({students.length})
            </button>

            <button
              onClick={() => { setActiveTab('spreadsheet'); setSelectedStudent(null); }}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all shrink-0 select-none cursor-pointer ${
                activeTab === 'spreadsheet'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/10'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Grid className="w-4.5 h-4.5" /> Spreadsheet Nilai
            </button>

            <button
              onClick={() => { setActiveTab('export'); setSelectedStudent(null); }}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all shrink-0 select-none cursor-pointer ${
                activeTab === 'export'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/10'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <FileSpreadsheet className="w-4.5 h-4.5" /> Ekspor Laporan
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setSelectedStudent(null); }}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all shrink-0 select-none cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/10'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Settings className="w-4.5 h-4.5" /> Pengaturan MTs
            </button>

          </div>
        </div>
      </nav>

      {/* Primary content area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:my-2 relative z-10 transition-all duration-300">
        
        {/* If a student is currently selected, prioritize displaying their detailed Bio and score chart */}
        {selectedStudent ? (
          <StudentDetailCard
            student={selectedStudent}
            subjects={subjects}
            formula={formula}
            schoolInfo={schoolInfo}
            onBack={() => setSelectedStudent(null)}
          />
        ) : (
          /* Render Active Tab components */
          <div>
            {activeTab === 'dashboard' && (
              <PerformanceCharts
                students={students}
                subjects={subjects}
                formula={formula}
                schoolInfo={schoolInfo}
              />
            )}

            {activeTab === 'students' && (
              <div className="space-y-6">
                {/* Panel Unduh Template & Unggah Data */}
                <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xs">
                  <div>
                    <h3 className="text-slate-800 font-bold text-sm flex items-center gap-1.5">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 font-bold" />
                      Format Impor Massal Excel (.xlsx)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Unduh berkas acuan Excel untuk mengunggah atau mendaftarkan siswa baru serta mengupdate biodata siswa secara massal.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={downloadStudentTemplate}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer select-none"
                    >
                      <FileDown className="w-4 h-4 text-emerald-500" />
                      Template Siswa Baru
                    </button>
                    <button
                      onClick={() => downloadGradesTemplate(students, subjects)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer select-none"
                    >
                      <FileDown className="w-4 h-4 text-emerald-500" />
                      Template Unggah Nilai
                    </button>
                    <label className="flex items-center gap-1.5 px-4 py-2 bg-emerald-650 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer select-none">
                      <Upload className="w-4 h-4" />
                      Unggah File
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleExcelImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <StudentTable
                  students={students}
                  subjects={subjects}
                  formula={formula}
                  onAddStudent={handleAddStudent}
                  onUpdateStudent={handleUpdateStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onSelectStudent={(s) => setSelectedStudent(s)}
                />
              </div>
            )}

            {activeTab === 'spreadsheet' && (
              <div className="space-y-6">
                {/* Mini Panel for Grades Template in Spreadsheet View */}
                <div className="bg-sky-50 border border-sky-150 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xs">
                  <div>
                    <h3 className="text-slate-800 font-bold text-sm flex items-center gap-1.5">
                      <Grid className="w-5 h-5 text-sky-600 font-bold" />
                      Isi Nilai via Excel Lebih Cepat
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Unduh berkas nilai terisi siswa aktif, masukkan nilai Rapor / Ujian Madrasah (UM), lalu unggah berkas tersebut untuk mendaftarkan nilai sekaligus secara otomatis.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => downloadGradesTemplate(students, subjects)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer select-none"
                    >
                      <FileDown className="w-4 h-4 text-sky-500" />
                      Unduh Formulir Nilai (.xlsx)
                    </button>
                    <label className="flex items-center gap-1.5 px-4 py-2 bg-sky-650 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer select-none">
                      <Upload className="w-4 h-4" />
                      Unggah XLSX Nilai
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleExcelImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <SpreadsheetGrid
                  students={students}
                  subjects={subjects}
                  formula={formula}
                  onUpdateGrades={handleUpdateAllGrades}
                />
              </div>
            )}

            {activeTab === 'export' && (
              <ExportLedger
                students={students}
                subjects={subjects}
                formula={formula}
                schoolInfo={schoolInfo}
              />
            )}

            {activeTab === 'settings' && (
              <SchoolSettings
                schoolInfo={schoolInfo}
                formula={formula}
                subjects={subjects}
                onUpdateSchoolInfo={saveSchoolInfoToStorage}
                onUpdateFormula={saveFormulaToStorage}
                onUpdateSubjects={() => {}}
              />
            )}
          </div>
        )}
      </main>

      {/* Simple elegant page footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-400 text-xs no-print select-none">
        <p>&copy; 2026 Admin Kurikulum {schoolInfo.name}. Seluruh hak cipta dilindungi.</p>
        <p className="mt-1 text-[10px] text-slate-300 font-mono">Dikelola secara aman menggunakan persistent offline engine & AI Studio integrations</p>
      </footer>

    </div>
  );
}

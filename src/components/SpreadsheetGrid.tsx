import React, { useState } from 'react';
import { Student, Subject, FormulaConfig } from '../types';
import { calculateSubjectGrade } from '../utils/calculations';
import { Save, HelpCircle, Edit3, ArrowRight, Table, Grid } from 'lucide-react';

interface SpreadsheetGridProps {
  students: Student[];
  subjects: Subject[];
  formula: FormulaConfig;
  onUpdateGrades: (updatedStudents: Student[]) => void;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  students,
  subjects,
  formula,
  onUpdateGrades
}) => {
  const [editMode, setEditMode] = useState<'subject' | 'student'>('subject');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [showHelper, setShowHelper] = useState<boolean>(true);
  
  // Temporary state for unsaved edits to avoid lag
  const [localStudents, setLocalStudents] = useState<Student[]>(() => JSON.parse(JSON.stringify(students)));
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Sync state if parents change
  React.useEffect(() => {
    setLocalStudents(JSON.parse(JSON.stringify(students)));
    setIsDirty(false);
  }, [students]);

  const handleGradeChange = (
    studentId: string, 
    subjectId: string, 
    type: 'rapor' | 'um', 
    index: number, // index for rapor [0-4], ignored for um
    valStr: string
  ) => {
    // Sanitizing numeric grade inputs
    let value = valStr === '' ? 0 : Number(valStr);
    if (isNaN(value)) value = 0;
    value = Math.min(100, Math.max(0, value));

    const studentIdx = localStudents.findIndex(s => s.id === studentId);
    if (studentIdx === -1) return;

    const updatedStudents = [...localStudents];
    const student = updatedStudents[studentIdx];
    const prevGrades = student.grades[subjectId] || { rapor: [0,0,0,0,0], um: 0, rataRapor: 0, nilaiIjazah: 0 };
    
    let nextRapor = [...prevGrades.rapor];
    let nextUm = prevGrades.um;

    if (type === 'rapor') {
      nextRapor[index] = value;
    } else {
      nextUm = value;
    }

    // Instantly calculate the derived values (average and weighted end score)
    const updatedGrade = calculateSubjectGrade(nextRapor, nextUm, formula);
    student.grades[subjectId] = updatedGrade;

    setLocalStudents(updatedStudents);
    setIsDirty(true);
  };

  const handleSaveAll = () => {
    onUpdateGrades(localStudents);
    setIsDirty(false);
  };

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const currentStudent = localStudents.find(s => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* Configuration Header for Grid Mode */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Table className="w-5 h-5 text-emerald-600" /> Standard Spreadsheet Pengolah Nilai
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Gunakan grid interaktif di bawah ini seperti lembar kerja Microsoft Excel untuk mengoreksi nilai dengan cepat.
          </p>
        </div>

        {/* Edit mode switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg self-start md:self-center">
          <button
            onClick={() => { setEditMode('subject'); setIsDirty(false); setLocalStudents(JSON.parse(JSON.stringify(students))); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              editMode === 'subject'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> Per Mata Pelajaran (Kolektif)
          </button>
          <button
            onClick={() => { setEditMode('student'); setIsDirty(false); setLocalStudents(JSON.parse(JSON.stringify(students))); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              editMode === 'student'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> Per Siswa (Transkrip)
          </button>
        </div>
      </div>

      {showHelper && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-amber-900 text-xs flex gap-3 items-start">
          <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">💡 Rumus Penghitungan Otomatis:</p>
            <p>1. **Rata-rata Rapor (Sem 1-5)**: Nilai rata-rata rapor Kelas 7 (Sem 1 & 2), Kelas 8 (Sem 1 & 2), dan Kelas 9 (Sem 1).</p>
            <p>2. **Nilai Akhir Ijazah**: `(Rata-rata Rapor × {formula.weightRapor * 100}%) + (Nilai Ujian Madrasah × {formula.weightUM * 100}%)`. Nilai diupdate secara realtime saat mengetik!</p>
            <p className="font-medium text-amber-800 mt-1">Jangan lupa mengklik tombol "Simpan Perubahan" berwarna hijau di kanan setelah selesai memperbarui semua nilai.</p>
          </div>
          <button onClick={() => setShowHelper(false)} className="text-amber-500 hover:text-amber-700 font-bold ml-auto px-1">✕</button>
        </div>
      )}

      {/* Main spreadsheet body */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        
        {/* Sub-header controls depending on chosen editMode */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {editMode === 'subject' ? (
              <>
                <span className="text-sm font-semibold text-slate-700 shrink-0">Pilih Mata Pelajaran:</span>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <span className="text-sm font-semibold text-slate-700 shrink-0">Pilih Nama Siswa:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {localStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas} | NISN: {s.nisn})
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <button
            onClick={handleSaveAll}
            disabled={!isDirty}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              isDirty 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" /> 
            {isDirty ? 'Simpan Perubahan Nilai' : 'Nilai Tersimpan'}
          </button>
        </div>

        {/* Tabular Layout */}
        <div className="overflow-x-auto">
          {editMode === 'subject' ? (
            /* Mode 1: Edit grades for all students for a chosen subject */
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center border-r border-slate-200">No</th>
                  <th className="py-3 px-4 w-44 border-r border-slate-200">NIS / NISN</th>
                  <th className="py-3 px-4 w-60 border-r border-slate-200">Siswa (L/P)</th>
                  <th className="py-3 text-center w-60 border-r border-slate-200" colSpan={5}>Nilai Rapor Semester (S1-5)</th>
                  <th className="py-3 px-4 text-center w-28 border-r border-slate-200 bg-emerald-50/50">Rerata Rapor</th>
                  <th className="py-3 px-4 text-center w-28 border-r border-slate-200 bg-sky-50/50">Ujian M. (UM)</th>
                  <th className="py-3 px-4 text-center w-32 font-bold bg-amber-50 text-amber-900">Skor Akhir</th>
                </tr>
                <tr className="bg-slate-50 text-[10px] text-slate-400 font-semibold border-b border-slate-200 text-center">
                  <th className="border-r border-slate-200"></th>
                  <th className="border-r border-slate-200"></th>
                  <th className="border-r border-slate-100"></th>
                  {/* Semester headers */}
                  {['C7-S1', 'C7-S2', 'C8-S1', 'C8-S2', 'C9-S1'].map((sem, idx) => (
                    <th key={idx} className="py-1.5 border-r border-slate-200 w-16">{sem}</th>
                  ))}
                  <th className="border-r border-slate-200 bg-emerald-50/50">(60%)</th>
                  <th className="border-r border-slate-200 bg-sky-50/50">(40%)</th>
                  <th className="bg-amber-50/50 text-amber-800 font-extrabold">(Ijazah)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[13px]">
                {localStudents.map((student, idx) => {
                  const sGrade = student.grades[selectedSubjectId] || {
                    rapor: [0,0,0,0,0],
                    um: 0,
                    rataRapor: 0,
                    nilaiIjazah: 0
                  };

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-1 text-center font-semibold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                      <td className="py-2 px-4 text-xs font-semibold text-slate-500 border-r border-slate-100">
                        <div>{student.nis}</div>
                        <div className="text-[10px] text-slate-400">{student.nisn}</div>
                      </td>
                      <td className="py-2 px-4 font-sans font-medium text-slate-800 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold truncate max-w-[160px]">{student.nama}</span>
                          <span className={`text-[10px] px-1 rounded-sm border ${
                            student.gender === 'L' 
                              ? 'bg-blue-50 text-blue-600 border-blue-200' 
                              : 'bg-pink-50 text-pink-600 border-pink-200'
                          }`}>
                            {student.gender}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{student.kelas}</span>
                      </td>

                      {/* 5 Rapor semester cells with custom editable inputs */}
                      {[0, 1, 2, 3, 4].map((semIdx) => (
                        <td key={semIdx} className="p-1 border-r border-slate-100 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={sGrade.rapor[semIdx] || ''}
                            onChange={(e) => handleGradeChange(student.id, selectedSubjectId, 'rapor', semIdx, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-14 text-center bg-white hover:bg-slate-50 focus:bg-amber-50 focus:ring-1 focus:ring-emerald-400 border-b border-transparent focus:border-emerald-400 py-1 px-1 font-semibold text-slate-800 rounded-xs transition-all focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                      ))}

                      {/* Average Rapor calculated column */}
                      <td className="py-2 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-slate-100">
                        {sGrade.rataRapor.toFixed(1)}
                      </td>

                      {/* UM Input cell */}
                      <td className="p-1 text-center bg-sky-50/20 border-r border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={sGrade.um || ''}
                          onChange={(e) => handleGradeChange(student.id, selectedSubjectId, 'um', 0, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-16 text-center bg-transparent focus:bg-amber-50 focus:ring-1 focus:ring-sky-400 border-b border-transparent focus:border-sky-400 py-1 px-1 font-extrabold text-blue-800 rounded-xs transition-all focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* Final Weighted output */}
                      <td className={`py-2 px-4 text-center font-extrabold border-l ${
                        sGrade.nilaiIjazah >= formula.kkm 
                          ? 'bg-emerald-50 text-emerald-800' 
                          : 'bg-rose-50 text-rose-800'
                      }`}>
                        {sGrade.nilaiIjazah.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* Mode 2: Edit scores of all 16 subjects for a single chosen student */
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center border-r border-slate-200">No</th>
                  <th className="py-3 px-4 w-40 border-r border-slate-200">Kode</th>
                  <th className="py-3 px-4 w-72 border-r border-slate-200">Mata Pelajaran / Kelompok</th>
                  <th className="py-3 text-center border-r border-slate-200" colSpan={5}>Nilai Rapor Kelas 7, 8, 9 (Sem 1-5)</th>
                  <th className="py-3 px-4 text-center w-28 border-r border-slate-200 bg-emerald-50/50">Rerata Rapor</th>
                  <th className="py-3 px-4 text-center w-28 border-r border-slate-200 bg-sky-50/50">Nilai UM</th>
                  <th className="py-3 px-4 text-center w-32 font-bold bg-amber-50 text-amber-900 border-l border-slate-200">Nilai Akhir</th>
                </tr>
                <tr className="bg-slate-50 text-[10px] text-slate-400 font-semibold border-b border-slate-200 text-center">
                  <th className="border-r border-slate-200"></th>
                  <th className="border-r border-slate-200"></th>
                  <th className="border-r border-slate-100"></th>
                  {['S1 (7-1)', 'S2 (7-2)', 'S3 (8-1)', 'S4 (8-2)', 'S5 (9-1)'].map((sem, idx) => (
                    <th key={idx} className="py-1.5 border-r border-slate-200 w-16">{sem}</th>
                  ))}
                  <th className="border-r border-slate-200 bg-emerald-50/50">({formula.weightRapor * 100}%)</th>
                  <th className="border-r border-slate-200 bg-sky-50/50">({formula.weightUM * 100}%)</th>
                  <th className="bg-amber-50/50 text-amber-800 border-l border-slate-200 font-extrabold">(Ijazah)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[13px]">
                {currentStudent ? (
                  subjects.map((subject, idx) => {
                    const sGrade = currentStudent.grades[subject.id] || {
                      rapor: [0,0,0,0,0],
                      um: 0,
                      rataRapor: 0,
                      nilaiIjazah: 0
                    };

                    return (
                      <tr key={subject.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-1 text-center font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                        <td className="py-2 px-4 font-semibold text-slate-500 border-r border-slate-100">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-sm select-none text-xs text-slate-600">{subject.code}</span>
                        </td>
                        <td className="py-2 px-4 font-sans font-medium text-slate-800 border-r border-slate-100">
                          <div className="font-bold">{subject.name}</div>
                          <div className="text-[10px] text-slate-400">{subject.category}</div>
                        </td>

                        {/* Rapor semester cells block */}
                        {[0, 1, 2, 3, 4].map((semIdx) => (
                          <td key={semIdx} className="p-1 border-r border-slate-100 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={sGrade.rapor[semIdx] || ''}
                              onChange={(e) => handleGradeChange(currentStudent.id, subject.id, 'rapor', semIdx, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-14 text-center bg-white hover:bg-slate-50 focus:bg-amber-50 focus:ring-1 focus:ring-emerald-400 border-b border-transparent focus:border-emerald-400 py-1 px-1 font-semibold text-slate-800 rounded-xs transition-all focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                        ))}

                        {/* Average Rapor calculated cell */}
                        <td className="py-2 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-slate-100">
                          {sGrade.rataRapor.toFixed(1)}
                        </td>

                        {/* UM score cell */}
                        <td className="p-1 text-center bg-sky-50/20 border-r border-slate-100">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={sGrade.um || ''}
                            onChange={(e) => handleGradeChange(currentStudent.id, subject.id, 'um', 0, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-16 text-center bg-transparent focus:bg-amber-50 focus:ring-1 focus:ring-sky-400 border-b border-transparent focus:border-sky-400 py-1 px-1 font-extrabold text-blue-800 rounded-xs transition-all focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>

                        {/* Final score cell weight updated */}
                        <td className={`py-2 px-4 text-center font-extrabold border-l border-slate-200 ${
                          sGrade.nilaiIjazah >= formula.kkm 
                            ? 'bg-emerald-50 text-emerald-800' 
                            : 'bg-rose-50 text-rose-800'
                        }`}>
                          {sGrade.nilaiIjazah.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 font-sans">
                      Pilih siswa di atas untuk memuat lembar kerja nilai
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer indicating un-saved state */}
        {isDirty && (
          <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-center justify-between">
            <span className="text-xs text-amber-700 font-semibold flex items-center gap-1.5 animate-pulse">
              <Edit3 className="w-4 h-4 text-amber-600" /> Terdapat perubahan nilai baru yang belum Anda simpan ke database utama!
            </span>
            <button
              onClick={handleSaveAll}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1 shadow-sm cursor-pointer transition-all"
            >
              Simpan Sekarang <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

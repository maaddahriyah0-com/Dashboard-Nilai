import React, { useState, useEffect } from 'react';
import { Student, Subject, FormulaConfig, SchoolInfo } from '../types';
import { getStudentStats } from '../utils/calculations';
import { exportIndividualPDF } from '../utils/exportHelpers';
import {
  FileText,
  User,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Loader2,
  Calendar,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Brain,
  Printer
} from 'lucide-react';

interface StudentDetailCardProps {
  student: Student;
  subjects: Subject[];
  formula: FormulaConfig;
  schoolInfo: SchoolInfo;
  onBack: () => void;
}

export const StudentDetailCard: React.FC<StudentDetailCardProps> = ({
  student,
  subjects,
  formula,
  schoolInfo,
  onBack
}) => {
  const [aiSaran, setAiSaran] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [isMockResult, setIsMockResult] = useState<boolean>(true);

  const stats = getStudentStats(student, subjects, formula);

  // Method to fetch student comments/recommendations draft from Express API
  const fetchStudentAiSaran = async (forceRefresh = false) => {
    if (!student) return;
    if (aiSaran && !forceRefresh) return; // cache

    setLoadingAi(true);
    try {
      const response = await fetch('/api/analyze-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student, subjects, config: formula, schoolInfo })
      });
      const data = await response.json();
      if (response.ok) {
        setAiSaran(data.text);
        setIsMockResult(data.isMock);
      } else {
        setAiSaran(`❌ Gagal merangkum saran AI: ${data.error || 'Server error'}`);
      }
    } catch (e: any) {
      setAiSaran(`❌ Terjadi error: ${e.message || 'Koneksi terputus.'}`);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchStudentAiSaran();
  }, [student, formula]);

  // Format Dates user-friendly
  const formatBirthInfo = () => {
    if (!student.tempatLahir && !student.tanggalLahir) return '-';
    return `${student.tempatLahir || 'Malang'}, ${student.tanggalLahir || '2011-01-01'}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Back button and profile header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold text-xs self-start bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-all shadow-2xs hover:shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Siswa
        </button>

        {/* Print template button */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => exportIndividualPDF(student, subjects, formula, schoolInfo)}
            className="flex items-center gap-2 bg-slate-900 border border-transparent hover:bg-slate-850 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Ekspor Transkrip PDF (SKL)
          </button>
        </div>
      </div>

      {/* Main Student Bio Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden">
        
        {/* Subtle gender color badge block */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${
          student.gender === 'L' ? 'bg-indigo-500' : 'bg-pink-500'
        }`}></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl shrink-0 ${
              student.gender === 'L' ? 'bg-indigo-50 text-indigo-600' : 'bg-pink-50 text-pink-600'
            }`}>
              <User className="w-10 h-10" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm select-none">
                Kelas {student.kelas}
              </span>
              <h1 className="text-2xl font-bold font-display text-slate-900 mt-1">{student.nama}</h1>
              
              {/* Secondary details row */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-1.5">
                <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4 text-slate-400" /> NIS: <span className="font-mono text-xs text-slate-800 font-bold">{student.nis}</span></span>
                <span className="flex items-center gap-1"><FileText className="w-4 h-4 text-slate-400" /> NISN: <span className="font-mono text-xs text-slate-800 font-bold">{student.nisn}</span></span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400" /> {formatBirthInfo()}</span>
              </div>
            </div>
          </div>

          {/* Aggregated Final statistics panel */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 flex items-center gap-6 w-full md:w-auto shrink-0 justify-around md:justify-start">
            <div className="text-center md:px-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rerata Rapor</span>
              <h3 className="text-xl font-bold font-mono text-slate-800 mt-0.5">{stats.averageRapor.toFixed(1)}</h3>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-center md:px-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rerata UM</span>
              <h3 className="text-xl font-bold font-mono text-sky-600 mt-0.5">{stats.averageUM.toFixed(1)}</h3>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-center md:px-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Skor Ijazah</span>
              <h3 className="text-2xl font-bold font-mono text-emerald-600 mt-0.5">{stats.averageIjazah.toFixed(1)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Grade listings and AI recommendations side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table of specific subject grades (left-to-center span) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden lg:col-span-2">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold font-display text-slate-800">Rincian Transkrip Nilai Akademis</h3>
            <span className="text-xs text-slate-400 font-medium">Batas Minimum KKM: <span className="font-bold text-slate-700">{formula.kkm}</span></span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4 text-center w-12">No</th>
                  <th className="py-2.5 px-4">Mata Pelajaran</th>
                  <th className="py-2.5 px-4 text-center w-28">Avg Rapor (60%)</th>
                  <th className="py-2.5 px-4 text-center w-28">Nilai UM (40%)</th>
                  <th className="py-2.5 px-4 text-center w-28">Nilai Akhir</th>
                  <th className="py-2.5 px-4 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-sm">
                {subjects.map((sub, idx) => {
                  const sGrade = student.grades[sub.id] || { rataRapor: 0, um: 0, nilaiIjazah: 0 };
                  const isPassed = sGrade.nilaiIjazah >= formula.kkm;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 px-1 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-4 font-sans font-medium text-slate-800">
                        <div className="font-bold">{sub.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{sub.category}</div>
                      </td>
                      <td className="py-2 px-4 text-center font-semibold text-slate-600">{sGrade.rataRapor.toFixed(1)}</td>
                      <td className="py-2 px-4 text-center font-semibold text-slate-600">{sGrade.um.toFixed(1)}</td>
                      <td className={`py-2 px-4 text-center font-extrabold ${
                        isPassed ? 'text-emerald-600 font-bold' : 'text-rose-600'
                      }`}>
                        {sGrade.nilaiIjazah.toFixed(1)}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm border ${
                          isPassed 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {isPassed ? 'TUNTAS' : 'REMEDIAL'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* homeroom feedback block (right col sidebar) */}
        <div className="bg-gradient-to-b from-indigo-950 to-slate-900 border border-slate-800 rounded-xl shadow-md p-5 text-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                Catatan Wali Kelas (AI)
              </h3>
              
              <button
                onClick={() => fetchStudentAiSaran(true)}
                disabled={loadingAi}
                className="p-1 px-2 rounded-sm bg-indigo-500/20 hover:bg-indigo-500/40 text-[10px] text-indigo-200 flex items-center gap-1 border border-indigo-400/10 cursor-pointer transition-all disabled:opacity-50"
              >
                {loadingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Sync AI
              </button>
            </div>

            <div className="font-sans text-xs text-slate-300 leading-relaxed max-h-[350px] overflow-y-auto pr-1">
              {loadingAi ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  <p className="text-[10px] text-indigo-300">Merangkum nilai dan menyusun ulasan akademis siswa...</p>
                </div>
              ) : aiSaran ? (
                <div className="space-y-3 prose prose-invert prose-xs">
                  <div className="whitespace-pre-line bg-slate-900/30 p-4 rounded-lg border border-white/5 shadow-inner">
                    {aiSaran}
                  </div>
                  {isMockResult && (
                    <div className="bg-indigo-500/10 border border-indigo-400/20 p-2 rounded-lg flex items-start gap-1.5 text-[10px] text-indigo-300 leading-normal">
                      <Brain className="w-3.5 h-3.5 mt-0.5 text-indigo-400 shrink-0" />
                      <span>Berjalan dalam simulasi deskriptif lapor lokal karena apiKey Gemini belum terdaftar.</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 py-6 text-center">Gagal memuat catatan perbaikan AI.</p>
              )}
            </div>
          </div>

          {/* Notification if student is failing KKM */}
          {!stats.isPassed && (
            <div className="bg-rose-500/20 border border-rose-500/30 p-3 rounded-lg flex items-start gap-2 text-[10.5px] text-rose-200 mt-4 leading-normal">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>Siswa ini memiliki **{stats.failedSubjectsCount}** mata pelajaran di bawah KKM. Latihan remediasi atau bimbingan khusus direkomendasikan sebelum kelulusan diresmikan.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

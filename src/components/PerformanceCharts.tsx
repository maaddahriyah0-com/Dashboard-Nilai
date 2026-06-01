import React, { useState, useEffect } from 'react';
import { Student, Subject, FormulaConfig, SchoolInfo } from '../types';
import { getSubjectStatsList, getCohortStats, getStudentStats } from '../utils/calculations';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, AlertCircle, Award, Sparkles, Brain, Loader2, RefreshCw } from 'lucide-react';

interface PerformanceChartsProps {
  students: Student[];
  subjects: Subject[];
  formula: FormulaConfig;
  schoolInfo: SchoolInfo;
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  students,
  subjects,
  formula,
  schoolInfo
}) => {
  const [aiReport, setAiReport] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [isMockResult, setIsMockResult] = useState<boolean>(true);

  const cohort = getCohortStats(students, subjects, formula);
  const subjectStatsList = getSubjectStatsList(students, subjects, formula);

  // Recharts: Subject Averages data preparation
  const subjectData = subjectStatsList.map(item => ({
    name: item.subjectCode,
    fullName: item.subjectName,
    "Rapor (60%)": item.averageRapor,
    "UM (40%)": item.averageUM,
    "Ijazah (Akhir)": item.averageIjazah,
  }));

  // Recharts: Grade bracket distributions
  const gradeDistribution = [
    { name: 'Sangat Baik (>=90)', value: 0, color: '#10b981' }, // emerald
    { name: 'Baik (80 - 89.9)', value: 0, color: '#3b82f6' },   // blue
    { name: 'Cukup (75 - 79.9)', value: 0, color: '#f59e0b' },  // amber
    { name: 'Kurang (<75)', value: 0, color: '#f43f5e' }       // rose
  ];

  students.forEach(student => {
    const stats = getStudentStats(student, subjects, formula);
    const avg = stats.averageIjazah;
    if (avg >= 90) gradeDistribution[0].value++;
    else if (avg >= 80) gradeDistribution[1].value++;
    else if (avg >= formula.kkm) gradeDistribution[2].value++;
    else gradeDistribution[3].value++;
  });

  const validDistribution = gradeDistribution.filter(item => item.value > 0);

  // Recharts: Passing Pie Chart
  const passData = [
    { name: 'Lulus KKM', value: cohort.passedCount, color: '#10b981' },
    { name: 'Remedial', value: cohort.failedCount, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Method to fetch intelligent cohort analytics from the Express API
  const fetchAiAnalytics = async (forceRefresh = false) => {
    if (!students || students.length === 0) return;
    if (aiReport && !forceRefresh) return; // cache

    setLoadingAi(true);
    try {
      const response = await fetch('/api/analyze-academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students, subjects, config: formula, schoolInfo })
      });
      const data = await response.json();
      if (response.ok) {
        setAiReport(data.text);
        setIsMockResult(data.isMock);
      } else {
        setAiReport(`❌ Gagal terhubung ke Asisten AI: ${data.error || 'Server error'}`);
      }
    } catch (e: any) {
      setAiReport(`❌ Terjadi error: ${e.message || 'Koneksi terputus.'}`);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchAiAnalytics();
  }, [students, formula]);

  // Dynamic Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const fullSub = subjectStatsList.find(s => s.subjectCode === label);
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700 font-sans">
          <p className="font-extrabold text-sm border-b border-slate-700 pb-1 text-sky-300">{fullSub?.subjectName || label}</p>
          <p className="text-slate-300"><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>Rata-rata Rapor: <span className="font-mono font-bold text-white">{payload[0]?.value?.toFixed(1)}</span></p>
          <p className="text-slate-300"><span className="inline-block w-2 h-2 rounded-full bg-sky-400 mr-2"></span>Rata-rata UM: <span className="font-mono font-bold text-white">{payload[1]?.value?.toFixed(1)}</span></p>
          <p className="text-emerald-300"><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-2"></span>Skor Akhir Ijazah: <span className="font-mono font-bold text-white">{payload[2]?.value?.toFixed(1)}</span></p>
          <p className="text-slate-400 border-t border-slate-700/60 pt-1 mt-1 text-[11px]">Tingkat Kelulusan: <span className="text-yellow-400 font-bold">{fullSub?.passPercentage}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Top statistical summaries row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Terbaik</p>
            <h4 className="text-sm font-bold text-slate-800 font-display mt-0.5 truncate max-w-[150px]" title={cohort.highestStudent?.name}>
              {cohort.highestStudent?.name || '-'}
            </h4>
            <p className="text-[11px] font-mono font-bold text-slate-500 mt-0.5">Nilai: {cohort.highestStudent?.score?.toFixed(2) || '-'}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Perlu Bimbingan</p>
            <h4 className="text-[11px] font-bold text-slate-800 font-display mt-0.5">
              {cohort.failedCount} Siswa
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Nilai ijazah di bawah KKM ({formula.kkm})</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rerata Sekolah</p>
            <h4 className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
              {cohort.averageIjazahClass || '-'}
            </h4>
            <p className="text-[10px] text-slate-400">Total nilai rata-rata ijazah</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">KKM Standard</p>
            <h4 className="text-xl font-bold font-mono text-amber-600 mt-0.5">
              {formula.kkm}
            </h4>
            <p className="text-[10px] text-slate-400">Standar ketuntasan minimal</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart comparing subjects */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold font-display text-slate-800">Rata-rata Nilai Per Mata Pelajaran</h3>
              <p className="text-slate-400 text-xs mt-0.5">Perbandingan skor rata-rata rapor sem 1-5 dengan Ujian Madrasah (UM)</p>
            </div>
          </div>
          
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: '#64748b', fontSize: 11 }} 
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <Bar dataKey="Rapor (60%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="UM (40%)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ijazah (Akhir)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut and pie distributions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-slate-800">Distribusi Prestasi Siswa</h3>
            <p className="text-slate-400 text-xs mt-0.5">Presentasi pengelompokan rata-rata nilai ijazah para siswa</p>
          </div>

          <div className="h-[220px] flex items-center justify-center relative">
            {validDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={validDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {validDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip wrapperStyle={{ fontFamily: 'sans-serif', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-xs">Belum ada data siswa untuk dipetakan</p>
            )}
            
            <div className="absolute text-center select-none pointer-events-none">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Siswa</span>
              <h3 className="text-2xl font-bold text-slate-800 font-display mt-0.5">{cohort.totalStudents}</h3>
            </div>
          </div>

          <div className="space-y-2 mt-4 text-xs font-medium">
            {validDistribution.map((entry, i) => (
              <div key={i} className="flex justify-between items-center text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  <span>{entry.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-800">{entry.value} Siswa ({Math.round(entry.value/cohort.totalStudents * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Assistant Analytical Report Row */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
        {/* Subtle decorative background light effect */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl text-yellow-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                Asisten Analisis Akademik AI <span className="text-[10px] bg-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded-full">Gemini 3.5</span>
              </h3>
              <p className="text-indigo-200 text-xs mt-0.5">Analisis instan mengenai kurikulum, standarisasi pengujian, dan penanganan siswa rawan remedial.</p>
            </div>
          </div>

          <button
            onClick={() => fetchAiAnalytics(true)}
            disabled={loadingAi}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/20 text-indigo-100 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shrink-0 select-none cursor-pointer"
          >
            {loadingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh Evaluasi AI
          </button>
        </div>

        <div className="relative z-10 font-sans text-sm leading-relaxed prose prose-invert max-w-none text-slate-200">
          {loadingAi ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs text-indigo-300 font-medium">Asisten AI sedang mempelajari formulir nilai dan menghitung deviasi ijazah...</p>
            </div>
          ) : aiReport ? (
            <div className="space-y-4 bg-slate-900/40 p-5 rounded-xl border border-white/5 shadow-inner backdrop-blur-xs">
              <div className="whitespace-pre-line text-slate-200 prose prose-sm max-w-none">
                {aiReport}
              </div>
              {isMockResult && (
                <div className="text-[11px] bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 p-2.5 rounded-lg flex items-center gap-2 mt-4">
                  <Brain className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Kunci API Gemini belum tersedia di pengaturan Secrets. Hasil analisis di atas merupakan simulasi cerdas lapor lokal.</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 py-6 text-center text-xs">Gagal memuat evaluasi akademis AI.</p>
          )}
        </div>
      </div>
    </div>
  );
};

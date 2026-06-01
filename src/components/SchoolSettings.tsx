import React, { useState } from 'react';
import { SchoolInfo, FormulaConfig, Subject } from '../types';
import { Settings, Info, Save, Percent, Award, ArrowLeftCircle } from 'lucide-react';

interface SchoolSettingsProps {
  schoolInfo: SchoolInfo;
  formula: FormulaConfig;
  subjects: Subject[];
  onUpdateSchoolInfo: (info: SchoolInfo) => void;
  onUpdateFormula: (formula: FormulaConfig) => void;
  onUpdateSubjects: (subjects: Subject[]) => void;
}

export const SchoolSettings: React.FC<SchoolSettingsProps> = ({
  schoolInfo,
  formula,
  subjects,
  onUpdateSchoolInfo,
  onUpdateFormula,
  onUpdateSubjects
}) => {
  // Local Form state
  const [localInfo, setLocalInfo] = useState<SchoolInfo>({ ...schoolInfo });
  const [localFormula, setLocalFormula] = useState<FormulaConfig>({ ...formula });
  
  // Weights (scaled 0-100 for user-friendly sliding)
  const [raporPercent, setRaporPercent] = useState<number>(Math.round(formula.weightRapor * 100));

  const handleRaporPercentChange = (valStr: string) => {
    let p = Number(valStr);
    if (isNaN(p)) p = 60;
    p = Math.min(100, Math.max(0, p));
    
    setRaporPercent(p);
    setLocalFormula({
      ...localFormula,
      weightRapor: p / 100,
      weightUM: (100 - p) / 100
    });
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchoolInfo(localInfo);
    alert("Profil Madrasah berhasil disimpan!");
  };

  const handleFormulaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFormula(localFormula);
    alert("Formula kelulusan ijazah berhasil diupdate!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* SECTION 1: Profiling Madrasah */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6">
        <h2 className="text-base font-bold font-display text-slate-800 flex items-center gap-2 pb-4 border-b border-slate-100">
          <Info className="w-5 h-5 text-indigo-600" /> Profil Madrasah Tsanawiyah
        </h2>

        <form onSubmit={handleInfoSubmit} className="space-y-4 mt-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Nama Madrasah</label>
            <input
              type="text"
              required
              value={localInfo.name}
              onChange={(e) => setLocalInfo({ ...localInfo, name: e.target.value })}
              className="w-full mt-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Nomor Statistik (NSM)</label>
              <input
                type="text"
                required
                value={localInfo.nsm}
                onChange={(e) => setLocalInfo({ ...localInfo, nsm: e.target.value })}
                className="w-full mt-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 outline-none transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Nomor Pokok (NPSN)</label>
              <input
                type="text"
                required
                value={localInfo.npsn}
                onChange={(e) => setLocalInfo({ ...localInfo, npsn: e.target.value })}
                className="w-full mt-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Alamat Lengkap Madrasah</label>
            <input
              type="text"
              required
              value={localInfo.address}
              onChange={(e) => setLocalInfo({ ...localInfo, address: e.target.value })}
              className="w-full mt-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Kecamatan</label>
              <input
                type="text"
                required
                value={localInfo.subdistrict}
                onChange={(e) => setLocalInfo({ ...localInfo, subdistrict: e.target.value })}
                className="w-full mt-1.5 bg-slate-50 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Kota / Kabupaten</label>
              <input
                type="text"
                required
                value={localInfo.city}
                onChange={(e) => setLocalInfo({ ...localInfo, city: e.target.value })}
                className="w-full mt-1.5 bg-slate-50 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Provinsi</label>
              <input
                type="text"
                required
                value={localInfo.province}
                onChange={(e) => setLocalInfo({ ...localInfo, province: e.target.value })}
                className="w-full mt-1.5 bg-slate-50 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Nama Kepala Madrasah</label>
              <input
                type="text"
                required
                value={localInfo.headmaster}
                onChange={(e) => setLocalInfo({ ...localInfo, headmaster: e.target.value })}
                className="w-full mt-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">NIP Kepala Madrasah</label>
              <input
                type="text"
                required
                value={localInfo.headmasterNip}
                onChange={(e) => setLocalInfo({ ...localInfo, headmasterNip: e.target.value })}
                className="w-full mt-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 outline-none transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border border-transparent transition-all"
          >
            <Save className="w-4 h-4" /> Simpan Profil Madrasah
          </button>
        </form>
      </div>

      {/* SECTION 2: Formulas weights configurations */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-base font-bold font-display text-slate-800 flex items-center gap-2 pb-4 border-b border-slate-100">
            <Percent className="w-5 h-5 text-emerald-600" /> Formula Bobot & Batas KKM
          </h2>

          <form onSubmit={handleFormulaSubmit} className="space-y-6 mt-4">
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Persentase Rapor (Semester 1-5)</label>
                <span className="text-sm font-extrabold text-emerald-600 font-mono">{raporPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={raporPercent}
                onChange={(e) => handleRaporPercentChange(e.target.value)}
                className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">Menentukan porsi nilai komparasi yang diambil dari akumulasi nilai ujian rapor selama 5 semester.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Persentase Ujian Madrasah (UM)</label>
                <span className="text-sm font-extrabold text-blue-600 font-mono">{100 - raporPercent}%</span>
              </div>
              <input
                type="range"
                disabled
                value={100 - raporPercent}
                className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg appearance-none opacity-50 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400">Porsi nilai Ujian Madrasah (UM) yang secara otomatis terkunci sebagai komplementer dari formula Rapor.</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-500" /> Kriteria Ketuntasan Minimal (KKM)
                </label>
                <input
                  type="number"
                  min="50"
                  max="95"
                  required
                  value={localFormula.kkm}
                  onChange={(e) => setLocalFormula({ ...localFormula, kkm: Number(e.target.value) || 75 })}
                  className="w-20 bg-slate-50 text-center font-bold font-mono text-sm border border-slate-200 focus:border-slate-800 p-1.5 focus:bg-white rounded-lg outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400">Siswa dinyatakan lulus apabila nilai akhir ijazah untuk setiap mata pelajaran berada di atas batas nilai KKM.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border border-transparent transition-all"
            >
              <Save className="w-4 h-4" /> Terapkan & Hitung Ulang Nilai
            </button>
          </form>
        </div>

        {/* Informative advice wrapper */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 text-xs flex gap-3 mt-6">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">🚨 Aturan Perhitungan Ulang:</p>
            <p className="leading-relaxed">Mengubah persentase bobot atau batas KKM akan memicu **pehitungan ulang otomatis** secara instan terhadap nilai akhir ijazah seluruh siswa. Harap pastikan regulasi penilai kurikulum sebelum menyimpan data.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

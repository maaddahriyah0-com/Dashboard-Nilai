import React, { useState } from 'react';
import { Student, Subject, FormulaConfig } from '../types';
import { getStudentStats } from '../utils/calculations';
import { Search, UserPlus, Edit2, Trash2, GraduationCap, X, Eye, HelpCircle } from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  subjects: Subject[];
  formula: FormulaConfig;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onSelectStudent: (student: Student) => void; 
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  subjects,
  formula,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSelectStudent
}) => {
  const [search, setSearch] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form Fields
  const [nama, setNama] = useState<string>('');
  const [nis, setNis] = useState<string>('');
  const [nisn, setNisn] = useState<string>('');
  const [kelas, setKelas] = useState<string>('9-A');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [tempatLahir, setTempatLahir] = useState<string>('');
  const [tanggalLahir, setTanggalLahir] = useState<string>('');

  // Extract classes list for filter
  const classes = Array.from(new Set(students.map(s => s.kelas)));

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setNama('');
    setNis('');
    setNisn('');
    setKelas('9-A');
    setGender('L');
    setTempatLahir('');
    setTanggalLahir('2011-01-01');
    setShowModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setNama(student.nama);
    setNis(student.nis);
    setNisn(student.nisn);
    setKelas(student.kelas);
    setGender(student.gender);
    setTempatLahir(student.tempatLahir);
    setTanggalLahir(student.tanggalLahir);
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !nis || !nisn) {
      alert("Harap lengkapi Nama, NIS, dan NISN siswa!");
      return;
    }

    if (editingStudent) {
      // Modify biodata of existing student preserving existing grades
      const updated: Student = {
        ...editingStudent,
        nama,
        nis,
        nisn,
        kelas,
        gender,
        tempatLahir,
        tanggalLahir
      };
      onUpdateStudent(updated);
    } else {
      // Initialize grades to 0 for all standard subjects upon creation
      const emptyGrades: Record<string, any> = {};
      subjects.forEach(sub => {
        emptyGrades[sub.id] = {
          rapor: [0, 0, 0, 0, 0],
          um: 0,
          rataRapor: 0,
          nilaiIjazah: 0
        };
      });

      const newlyAdded: Student = {
        id: `std-${Date.now()}`,
        nama,
        nis,
        nisn,
        kelas,
        gender,
        tempatLahir,
        tanggalLahir,
        grades: emptyGrades
      };
      onAddStudent(newlyAdded);
    }
    setShowModal(false);
  };

  const filteredStudents = students.filter(s => {
    const term = search.toLowerCase();
    const matchSearch = s.nama.toLowerCase().includes(term) || 
                        s.nis.includes(term) || 
                        s.nisn.includes(term);
    const matchClass = classFilter === 'all' || s.kelas === classFilter;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Search Controls row */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search box input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIS, atau NISN siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm outline-none pl-9 pr-4 py-2 text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Filtering dropdown */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="all">Semua Kelas</option>
            {classes.map(c => (
              <option key={c} value={c}>Kelas {c}</option>
            ))}
          </select>
        </div>

        {/* Add Student CTA */}
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-xs border border-transparent"
        >
          <UserPlus className="w-4 h-4" /> Tambah Siswa Baru
        </button>
      </div>

      {/* Main Grid List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4 w-28">NIS / NISN</th>
                <th className="py-3.5 px-4 max-w-sm">Nama Lengkap Siswa</th>
                <th className="py-3.5 px-4 text-center w-16">L/P</th>
                <th className="py-3.5 px-4 text-center w-20">Kelas</th>
                <th className="py-3.5 px-4 text-center w-24">Avg Rapor</th>
                <th className="py-3.5 px-4 text-center w-24">Avg UM</th>
                <th className="py-3.5 px-4 text-center w-28">Rerata Akhir</th>
                <th className="py-3.5 px-4 text-center w-28">Keterangan</th>
                <th className="py-3.5 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s, idx) => {
                  const stats = getStudentStats(s, subjects, formula);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-1 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-500">
                        <div>{s.nis}</div>
                        <div className="text-[10px] text-slate-400">{s.nisn}</div>
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-slate-900">
                        <div className="font-bold">{s.nama}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{s.tempatLahir}, {s.tanggalLahir}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-sm font-semibold border ${
                          s.gender === 'L' 
                            ? 'bg-blue-50 text-blue-600 border-blue-200' 
                            : 'bg-pink-50 text-pink-600 border-pink-200'
                        }`}>
                          {s.gender === 'L' ? 'L' : 'P'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-600">{s.kelas}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-500">{stats.averageRapor.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-500">{stats.averageUM.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center font-mono font-extrabold text-indigo-700 bg-indigo-50/10">
                        {stats.averageIjazah.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                          stats.isPassed 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          {stats.isPassed ? 'LULUS KKM' : 'REMEDIAL'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Details Button */}
                          <button
                            onClick={() => onSelectStudent(s)}
                            title="Buka Transkrip Siswa"
                            className="bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-250 p-1.5 rounded-lg transition-transform hover:-translate-y-0.5"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(s)}
                            title="Edit Biodata"
                            className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-250 p-1.5 rounded-lg transition-transform hover:-translate-y-0.5"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus data siswa "${s.nama}"? Nilai akademis siswa ini juga akan terhapus permanen.`)) {
                                onDeleteStudent(s.id);
                              }
                            }}
                            title="Hapus Siswa"
                            className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-250 p-1.5 rounded-lg transition-transform hover:-translate-y-0.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    Tidak ditemukan data siswa yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Count footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-xs font-semibold text-slate-500 flex justify-between items-center">
          <span>Menampilkan {filteredStudents.length} dari total {students.length} siswa terdaftar.</span>
        </div>
      </div>

      {/* Modal Dialog Form popup */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white font-display px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                {editingStudent ? `Update Biodata: ${editingStudent.nama}` : 'Tambah Biodata Siswa Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer select-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* NIS Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Nomor Induk Siswa (NIS)</label>
                  <input
                    type="text"
                    required
                    placeholder="202307xxx"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    className="w-full mt-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 transition-all outline-none"
                  />
                </div>

                {/* NISN Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">NIS Nasional (NISN)</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="0102xxxxxx"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    className="w-full mt-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 transition-all outline-none"
                  />
                </div>

              </div>

              {/* Name Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap siswa..."
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full mt-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Class list select field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Kelas</label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full mt-1.5 bg-slate-50 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 outline-none transition-all cursor-pointer"
                  >
                    <option value="9-A">Kelas 9-A</option>
                    <option value="9-B">Kelas 9-B</option>
                    <option value="9-C">Kelas 9-C</option>
                  </select>
                </div>

                {/* Gender Select field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Jenis Kelamin</label>
                  <div className="flex bg-slate-50 p-1 rounded-lg mt-1.5 border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setGender('L')}
                      className={`flex-1 py-1 px-3 text-xs font-bold rounded-md transition-all ${
                        gender === 'L' 
                          ? 'bg-white text-slate-800 shadow-xs' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Laki-laki (L)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('P')}
                      className={`flex-1 py-1 px-3 text-xs font-bold rounded-md transition-all ${
                        gender === 'P' 
                          ? 'bg-white text-slate-800 shadow-xs' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Perempuan (P)
                    </button>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-2">
                
                {/* Birthplace */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Tempat Lahir</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Malang"
                    value={tempatLahir}
                    onChange={(e) => setTempatLahir(e.target.value)}
                    className="w-full mt-1.5 bg-slate-50 focus:bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 outline-none transition-all"
                  />
                </div>

                {/* Birthdate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="w-full mt-1.5 bg-slate-50 focus:bg-white text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-800 outline-none transition-all cursor-pointer"
                  />
                </div>

              </div>

              {/* Helper disclaimer */}
              {!editingStudent && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-lg text-xs flex gap-2">
                  <HelpCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                  <span>Siswa baru akan terdaftar dengan skor awal 0 untuk seluruh mata pelajaran. Nilai dapat dimasukkan di tab **Spreadsheet Nilai** setelah pendaftaran.</span>
                </div>
              )}

              {/* Submits row */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs border border-transparent transition-all"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Daftarkan Siswa'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

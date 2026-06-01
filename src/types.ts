export interface SubjectGrade {
  rapor: number[]; // Array of 5 numbers for Semesters 1 to 5
  um: number; // Madrasah Exam (Ujian Madrasah)
  rataRapor: number; // Derived: average of rapor
  nilaiIjazah: number; // Derived: weightRapor * rataRapor + weightUM * um
}

export interface Student {
  id: string;
  nama: string;
  nis: string; // Nomor Induk Siswa
  nisn: string; // Nomor Induk Siswa Nasional
  kelas: string; // e.g., "9-A"
  gender: 'L' | 'P'; // Laki-laki / Perempuan
  tempatLahir: string;
  tanggalLahir: string; // Format: YYYY-MM-DD
  grades: Record<string, SubjectGrade>; // Maps subject id to grades
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  category: 'Kelompok A (Umum)' | 'Kelompok B (Umum)' | 'Muatan Lokal';
}

export interface FormulaConfig {
  weightRapor: number; // e.g. 0.6 (60%)
  weightUM: number; // e.g. 0.4 (40%)
  kkm: number; // Kriteria Ketuntasan Minimal, e.g. 75
}

export interface SchoolInfo {
  name: string;
  nsm: string; // Nomor Statistik Madrasah
  npsn: string;
  address: string;
  headmaster: string;
  headmasterNip: string;
  subdistrict: string;
  city: string;
  province: string;
}

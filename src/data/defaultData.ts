import { Subject, FormulaConfig, SchoolInfo, Student } from '../types';

export const DEFAULT_SUBJECTS: Subject[] = [
  // Kelompok A (Umum)
  { id: 'qurdis', name: "Al-Qur'an Hadis", code: "QH", category: 'Kelompok A (Umum)' },
  { id: 'akidah', name: "Akidah Akhlak", code: "AA", category: 'Kelompok A (Umum)' },
  { id: 'fikih', name: "Fikih", code: "FIQ", category: 'Kelompok A (Umum)' },
  { id: 'ski', name: "Sejarah Kebudayaan Islam (SKI)", code: "SKI", category: 'Kelompok A (Umum)' },
  { id: 'ppkn', name: "Pendidikan Pancasila dan Kewarganegaraan", code: "PPKN", category: 'Kelompok A (Umum)' },
  { id: 'indonesia', name: "Bahasa Indonesia", code: "IND", category: 'Kelompok A (Umum)' },
  { id: 'arab', name: "Bahasa Arab", code: "ARB", category: 'Kelompok A (Umum)' },
  { id: 'matematika', name: "Matematika", code: "MTK", category: 'Kelompok A (Umum)' },
  { id: 'ipa', name: "Ilmu Pengetahuan Alam (IPA)", code: "IPA", category: 'Kelompok A (Umum)' },
  { id: 'ips', name: "Ilmu Pengetahuan Sosial (IPS)", code: "IPS", category: 'Kelompok A (Umum)' },
  { id: 'inggris', name: "Bahasa Inggris", code: "ING", category: 'Kelompok A (Umum)' },

  // Kelompok B (Umum)
  { id: 'seni', name: "Seni Budaya", code: "SND", category: 'Kelompok B (Umum)' },
  { id: 'pjok', name: "Pendidikan Jasmani, Olahraga, dan Kesehatan", code: "PJOK", category: 'Kelompok B (Umum)' },
  { id: 'prakarya', name: "Prakarya / Informatika", code: "PRK", category: 'Kelompok B (Umum)' },

  // Muatan Lokal
  { id: 'aswaja', name: "Ke-NU-an / Aswaja", code: "NU", category: 'Muatan Lokal' },
  { id: 'sunda', name: "Bahasa Sunda", code: "SNDY", category: 'Muatan Lokal' },
  { id: 'btq', name: "Baca Tulis Al-Qur'an (BTQ)", code: "BTQ", category: 'Muatan Lokal' },
  { id: 'tik', name: "Teknologi Informasi & Komunikasi (TIK)", code: "TIK", category: 'Muatan Lokal' }
];

export const DEFAULT_FORMULA: FormulaConfig = {
  weightRapor: 0.6, // 60%
  weightUM: 0.4,    // 40%
  kkm: 75
};

export const DEFAULT_SCHOOL_INFO: SchoolInfo = {
  name: "MTs KHUD-NUR",
  nsm: "121232780052",
  npsn: "69983236",
  address: "Komplek Pesantren Cidolog",
  headmaster: "Ayi Ramli,S.Pd.I",
  headmasterNip: "-",
  subdistrict: "Tamansari",
  city: "Kota Tasikmalaya",
  province: "Jawa Barat"
};

// Generates uniform mock grades for setup testing
const generateMockGrades = (baseScore: number): Record<string, any> => {
  const grades: Record<string, any> = {};
  
  // Proteksi: Berikan nilai cadangan (fallback) jika objek DEFAULT_FORMULA belum siap dimuat
  const weightRapor = DEFAULT_FORMULA?.weightRapor ?? 0.6;
  const weightUM = DEFAULT_FORMULA?.weightUM ?? 0.4;

  DEFAULT_SUBJECTS.forEach((sub, idx) => {
    // Generate slight variations based on index to make charts interesting
    const offset = (idx % 3) - 1; // -1, 0, or 1
    const rapor = [
      Math.min(100, Math.max(60, baseScore + offset * 2 + Math.floor(Math.random() * 4))),
      Math.min(100, Math.max(60, baseScore + offset + 1 + Math.floor(Math.random() * 4))),
      Math.min(100, Math.max(60, baseScore + offset * 3 - 1 + Math.floor(Math.random() * 4))),
      Math.min(100, Math.max(60, baseScore + offset * 2 + Math.floor(Math.random() * 4))),
      Math.min(100, Math.max(60, baseScore + offset + 2 + Math.floor(Math.random() * 4)))
    ];
    const um = Math.min(100, Math.max(60, baseScore + offset * 3 + Math.floor(Math.random() * 6)));
    const rataRapor = Math.round((rapor.reduce((a, b) => a + b, 0) / 5) * 100) / 100;
    
    // Perhitungan menggunakan variabel lokal aman yang bebas dari potensi NaN
    const kalkulasiIjazah = Math.round((rataRapor * weightRapor + um * weightUM) * 100) / 100;

    grades[sub.id] = { 
      rapor, 
      um, 
      rataRapor, 
      nilaiIjazah: isNaN(kalkulasiIjazah) ? 0 : kalkulasiIjazah // Mencegah crash akibat nilai NaN masuk ke komponen UI/Grafik
    };
  });
  return grades;
};

export const DEFAULT_STUDENTS: Student[] = [
  {
    id: "std-001",
    nama: "Ahmad Fauzi",
    nis: "202307001",
    nisn: "0102345678",
    kelas: "9-A",
    gender: "L",
    tempatLahir: "Malang",
    tanggalLahir: "2011-04-12",
    grades: generateMockGrades(85)
  },
  {
    id: "std-002",
    nama: "Bunga Citra Lestari",
    nis: "202307002",
    nisn: "0118765432",
    kelas: "9-A",
    gender: "P",
    tempatLahir: "Sidoarjo",
    tanggalLahir: "2011-08-23",
    grades: generateMockGrades(88)
  },
  {
    id: "std-003",
    nama: "Danang Setiawan",
    nis: "202307003",
    nisn: "0109871234",
    kelas: "9-B",
    gender: "L",
    tempatLahir: "Malang",
    tanggalLahir: "2011-11-05",
    grades: generateMockGrades(78)
  },
  {
    id: "std-004",
    nama: "Fatimah Azzahra",
    nis: "202307004",
    nisn: "0112468135",
    kelas: "9-A",
    gender: "P",
    tempatLahir: "Pasuruan",
    tanggalLahir: "2011-01-30",
    grades: generateMockGrades(92)
  },
  {
    id: "std-005",
    nama: "Giri Pamungkas",
    nis: "202307005",
    nisn: "0105432109",
    kelas: "9-B",
    gender: "L",
    tempatLahir: "Blitar",
    tanggalLahir: "2011-06-18",
    grades: generateMockGrades(74)
  }
];

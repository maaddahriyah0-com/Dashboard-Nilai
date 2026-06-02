import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Subject, FormulaConfig, SchoolInfo } from '../types';
import { getStudentStats, getSubjectStatsList } from './calculations';

/**
 * Generates and downloads a complete Excel Ledger for MTs KHUDNUR
 */
export const exportToExcel = (
  students: Student[],
  subjects: Subject[],
  formula: FormulaConfig,
  schoolInfo: SchoolInfo
) => {
  const wb = XLSX.utils.book_new();

  // ----- SHEET 1: LEDGER SKOR INDIVIDU -----
  // Prepare row matrix
  const matrixData: any[][] = [
    [schoolInfo.name.toUpperCase()],
    [`DAFTAR NILAI IJAZAH - TAHUN PELAJARAN 2025/2026`],
    [`Alamat: ${schoolInfo.address}, ${schoolInfo.subdistrict}, ${schoolInfo.city}`],
    [], // empty spacer
  ];

  // Subject codes subheaders
  const headers = [
    "No",
    "NIS",
    "NISN",
    "Nama Siswa",
    "L/P",
    ...subjects.map(s => `${s.name} (Rapor)`),
    ...subjects.map(s => `${s.name} (UM)`),
    ...subjects.map(s => `${s.name} (Akhir)`),
    "Rerata Rapor (Sem 1-5)",
    "Rerata Ujian Madrasah",
    "Rangkuman Akhir Ijazah",
    "Keterangan KKM"
  ];
  matrixData.push(headers);

  // Rows of student records
  students.forEach((student, index) => {
    const stats = getStudentStats(student, subjects, formula);
    
    const row = [
      index + 1,
      student.nis,
      student.nisn,
      student.nama,
      student.gender,
      // 1. Rapor Averages for each subject
      ...subjects.map(s => student.grades[s.id]?.rataRapor ?? 0),
      // 2. UM grades for each subject
      ...subjects.map(s => student.grades[s.id]?.um ?? 0),
      // 3. Final weighted grades for each subject
      ...subjects.map(s => student.grades[s.id]?.nilaiIjazah ?? 0),
      stats.averageRapor,
      stats.averageUM,
      stats.averageIjazah,
      stats.isPassed ? "LULUS" : `REMEDIAL (${stats.failedSubjectsCount} Mapel)`
    ];
    matrixData.push(row);
  });

  const wsLedger = XLSX.utils.aoa_to_sheet(matrixData);

  // Set nice design widths for key columns
  const colWidths = [
    { wch: 5 },  // No
    { wch: 12 }, // NIS
    { wch: 14 }, // NISN
    { wch: 25 }, // Nama
    { wch: 6 },  // L/P
  ];
  // populate default widths for subjects
  for (let i = 0; i < subjects.length * 3; i++) {
    colWidths.push({ wch: 12 });
  }
  colWidths.push({ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 16 });
  wsLedger['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, wsLedger, "Ledger Nilai Ijazah");

  // ----- SHEET 2: RINGKASAN & STATISTIK -----
  const statMatrix: any[][] = [
    [`RINGKASAN STATISTIK MATA PELAJARAN - ${schoolInfo.name}`],
    [`Kriteria Ketuntasan Minimal (KKM): ${formula.kkm}`],
    [],
    ["No", "Kode Mapel", "Nama Mata Pelajaran", "Rata-rata Rapor", "Rata-rata UM", "Rata-rata Nilai Ijazah", "Nilai Tertinggi", "Nilai Terendah", "Persentase Kelulusan"]
  ];

  const subjectStats = getSubjectStatsList(students, subjects, formula);
  subjectStats.forEach((stat, index) => {
    statMatrix.push([
      index + 1,
      stat.subjectCode,
      stat.subjectName,
      stat.averageRapor,
      stat.averageUM,
      stat.averageIjazah,
      stat.highestIjazah,
      stat.lowestIjazah,
      `${stat.passPercentage}%`
    ]);
  });

  const wsStats = XLSX.utils.aoa_to_sheet(statMatrix);
  wsStats['!cols'] = [
    { wch: 5 },  // No
    { wch: 10 }, // Kode
    { wch: 30 }, // Nama
    { wch: 16 }, // Rata Rapor
    { wch: 16 }, // Rata UM
    { wch: 20 }, // Rata Ijazah
    { wch: 16 }, // Max
    { wch: 16 }, // Min
    { wch: 18 }  // Pass
  ];

  XLSX.utils.book_append_sheet(wb, wsStats, "Statistik Mapel");

  // Write and Save
  XLSX.writeFile(wb, `Ledger_Nilai_Ijazah_${schoolInfo.name.replace(/\s+/g, '_')}_2026.xlsx`);
};

/**
 * Generates and downloads a gorgeous official individual PDF summary/transcript for a student
 */
export const exportIndividualPDF = (
  student: Student,
  subjects: Subject[],
  formula: FormulaConfig,
  schoolInfo: SchoolInfo
) => {
  // Use portrait A4 (default)
  const doc = new jsPDF();
  const stats = getStudentStats(student, subjects, formula);

  // Define margins and text color
  const xLeft = 14;
  let currentY = 15;

  // Header Madrasah (Kop Surat)
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text("YAYASAN PONDOK PESANTREN MIFTAHUL IHSAN AL-MUSRI", 105, currentY, { align: 'center' });
  currentY += 6;
  
  doc.setFontSize(16);
  doc.text(schoolInfo.name.toUpperCase(), 105, currentY, { align: 'center' });
  currentY += 5;
  
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text("NSM: " + schoolInfo.nsm + "   |   NPSN: " + schoolInfo.npsn, 105, currentY, { align: 'center' });
  currentY += 5;
  
  doc.text("Alamat: " + schoolInfo.address + ", Kec. " + schoolInfo.subdistrict + ", " + schoolInfo.city + ", Prov. " + schoolInfo.province, 105, currentY, { align: 'center' });
  currentY += 4;
  
  // Double horizontal border lines
  doc.setLineWidth(1);
  doc.line(14, currentY, 196, currentY);
  doc.setLineWidth(0.3);
  doc.line(14, currentY + 1, 196, currentY + 1);
  currentY += 10;

  // Title of the template document
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text("SURAT KETERANGAN TRANSKRIP NILAI IJAZAH", 105, currentY, { align: 'center' });
  currentY += 5;
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text("Nomor: 138/MTs.10.23.052/PP.01.1/6/2026", 105, currentY, { align: 'center' });
  currentY += 12;

  // Student details block (Biodata)
  doc.setFont('times', 'bold');
  doc.text("KETERANGAN IDENTITAS SISWA", xLeft, currentY);
  currentY += 5;

  doc.setFont('times', 'normal');
  const details = [
    { label: "Nama Lengkap", val: `: ${student.nama}` },
    { label: "Nomor Induk Siswa (NIS)", val: `: ${student.nis}` },
    { label: "NIS Nasional (NISN)", val: `: ${student.nisn}` },
    { label: "Tempat, Tanggal Lahir", val: `: ${student.tempatLahir}, ${formatDateID(student.tanggalLahir)}` },
    { label: "Kelas", val: `: ${student.kelas}` },
  ];

  details.forEach(detail => {
    doc.text(detail.label, xLeft + 4, currentY);
    doc.text(detail.val, xLeft + 60, currentY);
    currentY += 5;
  });
  currentY += 6;

  // Score Table block
  doc.setFont('times', 'bold');
  doc.text("DAFTAR NILAI AKADEMIS", xLeft, currentY);
  currentY += 3;

  // Let's create subjects mapping rows
  const tableRows: any[] = [];
  
  // Track categories
  const categories = ['Kelompok A (Umum)', 'Kelompok B (Umum)', 'Muatan Lokal'];
  let orderNo = 1;

  categories.forEach(cat => {
    // Add sub-header for category
    tableRows.push([
      { content: cat.toUpperCase(), colSpan: 5, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }
    ]);

    const catSubjects = subjects.filter(s => s.category === cat);
    catSubjects.forEach(sub => {
      const g = student.grades[sub.id] || { rataRapor: 0, um: 0, nilaiIjazah: 0 };
      tableRows.push([
        orderNo++,
        sub.name,
        g.rataRapor.toFixed(1),
        g.um.toFixed(1),
        g.nilaiIjazah.toFixed(1)
      ]);
    });
  });

  // Append aggregate totals row
  tableRows.push([
    { content: "RATA-RATA KUMULATIF", colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
    stats.averageRapor.toFixed(2),
    stats.averageUM.toFixed(2),
    { content: stats.averageIjazah.toFixed(2), styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["No", "Mata Pelajaran", "Rata Rapor (Sem 1-5)", "Nilai Ujian Madrasah (UM)", "Nilai Akhir Ijazah"]],
    body: tableRows,
    theme: 'grid',
    styles: { font: 'times', fontSize: 9.5, cellPadding: 2.2 },
    headStyles: { fillColor: [15, 23, 42], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' }
    },
    didDrawPage: (data: any) => {
      currentY = data.cursor.y + 12;
    }
  });

  // Guarantee enough layout height for signature block (otherwise add new page)
  if (currentY > 230) {
    doc.addPage();
    currentY = 25;
  }

  // Legal signing block (Tanda Tangan Kepala Madrasah)
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const signatureX = 130;
  
  // Date of signature (usually release of certificate)
  doc.text(`Tasikmalaya, ${formatDateID("2026-06-02")}`, signatureX, currentY);
  currentY += 5;
  
  doc.text("Kepala Madrasah,", signatureX, currentY);
  
  // Adding stamp or signing location
  currentY += 28; // height for real signatures
  
  doc.setFont('times', 'bold');
  doc.text(schoolInfo.headmaster, signatureX, currentY);
  
  doc.setLineWidth(0.2);
  doc.line(signatureX, currentY + 0.5, signatureX + 55, currentY + 0.5);
  currentY += 5;
  
  doc.setFont('times', 'normal');
  doc.text(`NIP. ${schoolInfo.headmasterNip}`, signatureX, currentY);

  // Status and KKM stamp at the lower left
  doc.rect(xLeft, currentY - 24, 60, 22);
  doc.setFont('times', 'bold');
  doc.text("KETERANGAN KKM:", xLeft + 3, currentY - 20);
  doc.setFont('times', 'normal');
  doc.text(`Batas Minimum (KKM) : ${formula.kkm}`, xLeft + 3, currentY - 15);
  doc.setFont('times', 'bold');
  if (stats.isPassed) {
    doc.setTextColor(22, 101, 52); // green-800
    doc.text("STATUS: LULUS", xLeft + 3, currentY - 8);
  } else {
    doc.setTextColor(153, 27, 27); // red-800
    doc.text(`STATUS: REMEDIAL (${stats.failedSubjectsCount} Mapel)`, xLeft + 3, currentY - 8);
  }
  doc.setTextColor(0); // reset color

  doc.save(`SKL_${student.nama.replace(/\s+/g, '_')}_${student.nis}.pdf`);
};

/**
 * Basic mapper to convert YYYY-MM-DD into Indonesian formatted date: e.g. "12 April 2011"
 */
const formatDateID = (dateStr: string): string => {
  if (!dateStr) return '';
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      return `${day} ${months[monthIdx]} ${year}`;
    }
  } catch (e) {
    // return raw
  }
  return dateStr;
};

/**
 * Generates and downloads the XLSX template for adding new students
 */
export const downloadStudentTemplate = () => {
  const wb = XLSX.utils.book_new();
  
  const headers = ["No", "NIS", "NISN", "Nama Siswa", "L/P", "Kelas"];
  const sampleData = [
    [1, "202307006", "0105432101", "Budi Santoso", "L", "9-A"],
    [2, "202307007", "0105432102", "Susi Susanti", "P", "9-B"],
    [3, "202307008", "0105432103", "Rian Hidayat", "L", "9-A"],
    [4, "202307009", "0105432104", "Dewi Lestari", "P", "9-C"],
  ];
  
  const matrix = [
    ["TEMPLATE TAMBAH SISWA BARU - MTs KHUDNUR"],
    ["Petunjuk: Isi data siswa baru mulai dari baris ke-4. Kolom L/P diisi L (Laki-laki) atau P (Perempuan)."],
    ["Gunakan file ini untuk menambahkan siswa secara massal lalu unggah ke aplikasi."],
    headers,
    ...sampleData
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(matrix);
  
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 15 }, // NIS
    { wch: 15 }, // NISN
    { wch: 25 }, // Nama Siswa
    { wch: 8 },  // L/P
    { wch: 10 }  // Kelas
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, "Siswa Baru");
  XLSX.writeFile(wb, "Template_Tambah_Siswa_Baru.xlsx");
};

/**
 * Generates and downloads the XLSX template for uploading grades
 */
export const downloadGradesTemplate = (students: Student[], subjects: Subject[]) => {
  const wb = XLSX.utils.book_new();
  
  const headers = [
    "No",
    "NIS",
    "NISN",
    "Nama Siswa",
    "L/P",
    "Kelas",
    ...subjects.flatMap(s => [`${s.name} (Rapor)`, `${s.name} (UM)`])
  ];
  
  const rowsData: any[][] = [];
  
  if (students && students.length > 0) {
    students.forEach((std, idx) => {
      const studentGradesRow: any[] = [
        idx + 1,
        std.nis,
        std.nisn,
        std.nama,
        std.gender,
        std.kelas
      ];
      
      subjects.forEach(sub => {
        const studentGrades = std.grades[sub.id] || { rataRapor: 80, um: 80 };
        studentGradesRow.push(studentGrades.rataRapor || 0);
        studentGradesRow.push(studentGrades.um || 50); // Using 50 or other standard minimum or current
      });
      
      rowsData.push(studentGradesRow);
    });
  } else {
    // Fallback sample data row if no students are loaded yet
    const sampleRow = [
      1,
      "202307001",
      "0102345678",
      "Ahmad Fauzi",
      "L",
      "9-A"
    ];
    subjects.forEach(() => {
      sampleRow.push(80, 85);
    });
    rowsData.push(sampleRow);
  }
  
  const matrix = [
    ["TEMPLATE UNGGAH NILAI SISWA - MTs KHUDNUR"],
    ["Petunjuk: Kolom (Rapor) diisi rata-rata nilai semester 1-5 (skala 0-100). Kolom (UM) diisi nilai Ujian Madrasah."],
    ["Tabel ini otomatis menyertakan seluruh daftar siswa yang aktif saat ini. Silakan ubah nilainya lalu simpan & unggah."],
    headers,
    ...rowsData
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(matrix);
  
  const colWidths = [
    { wch: 6 },  // No
    { wch: 15 }, // NIS
    { wch: 15 }, // NISN
    { wch: 25 }, // Nama Siswa
    { wch: 8 },  // L/P
    { wch: 10 }  // Kelas
  ];
  subjects.forEach(() => {
    colWidths.push({ wch: 22 }, { wch: 22 });
  });
  ws['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(wb, ws, "Unggah Nilai");
  XLSX.writeFile(wb, "Template_Unggah_Nilai.xlsx");
};


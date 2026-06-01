import { Student, Subject, FormulaConfig, SubjectGrade } from '../types';

/**
 * Calculates raw and derived scores for a single subject grade.
 */
export const calculateSubjectGrade = (
  rapor: number[],
  um: number,
  config: FormulaConfig
): SubjectGrade => {
  const filteredRapor = rapor.map(val => Math.min(100, Math.max(0, Number(val) || 0)));
  const checkedUm = Math.min(100, Math.max(0, Number(um) || 0));

  // Average of semester 1-5
  const sumRapor = filteredRapor.reduce((acc, score) => acc + score, 0);
  const rataRapor = filteredRapor.length > 0 
    ? Math.round((sumRapor / filteredRapor.length) * 100) / 100 
    : 0;

  // Weighted graduation certificate score
  const nilaiIjazah = Math.round((rataRapor * config.weightRapor + checkedUm * config.weightUM) * 100) / 100;

  return {
    rapor: filteredRapor,
    um: checkedUm,
    rataRapor,
    nilaiIjazah
  };
};

/**
 * Recalculates all subject scores for a student based on current FormulaConfig.
 */
export const recalculateStudentGrades = (
  student: Student,
  subjects: Subject[],
  config: FormulaConfig
): Student => {
  const updatedGrades: Record<string, SubjectGrade> = {};

  subjects.forEach(subject => {
    const existing = student.grades[subject.id] || {
      rapor: [0, 0, 0, 0, 0],
      um: 0,
      rataRapor: 0,
      nilaiIjazah: 0
    };

    updatedGrades[subject.id] = calculateSubjectGrade(
      existing.rapor,
      existing.um,
      config
    );
  });

  return {
    ...student,
    grades: updatedGrades
  };
};

/**
 * Calculates student stats (Average Rapor, Average UM, Average Ijazah, and Pass Status)
 */
export interface StudentStats {
  averageRapor: number;
  averageUM: number;
  averageIjazah: number;
  isPassed: boolean;
  failedSubjectsCount: number;
  minScore: number;
  maxScore: number;
}

export const getStudentStats = (
  student: Student,
  subjects: Subject[],
  config: FormulaConfig
): StudentStats => {
  let sumRapor = 0;
  let sumUM = 0;
  let sumIjazah = 0;
  let failedSubjectsCount = 0;
  let minScore = 100;
  let maxScore = 0;
  let validCount = 0;

  subjects.forEach(sub => {
    const score = student.grades[sub.id];
    if (score) {
      sumRapor += score.rataRapor;
      sumUM += score.um;
      sumIjazah += score.nilaiIjazah;
      validCount++;

      if (score.nilaiIjazah < config.kkm) {
        failedSubjectsCount++;
      }

      if (score.nilaiIjazah < minScore) minScore = score.nilaiIjazah;
      if (score.nilaiIjazah > maxScore) maxScore = score.nilaiIjazah;
    }
  });

  if (validCount === 0) {
    return {
      averageRapor: 0,
      averageUM: 0,
      averageIjazah: 0,
      isPassed: true,
      failedSubjectsCount: 0,
      minScore: 0,
      maxScore: 0
    };
  }

  const averageRapor = Math.round((sumRapor / validCount) * 100) / 100;
  const averageUM = Math.round((sumUM / validCount) * 100) / 100;
  const averageIjazah = Math.round((sumIjazah / validCount) * 200) / 200; // refined calculation
  const isPassed = failedSubjectsCount === 0;

  return {
    averageRapor,
    averageUM,
    averageIjazah,
    isPassed,
    failedSubjectsCount,
    minScore,
    maxScore
  };
};

/**
 * Calculates descriptive statistics for a list of students of all subjects
 */
export interface SubjectStats {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  averageRapor: number;
  averageUM: number;
  averageIjazah: number;
  highestIjazah: number;
  lowestIjazah: number;
  passPercentage: number;
}

export const getSubjectStatsList = (
  students: Student[],
  subjects: Subject[],
  config: FormulaConfig
): SubjectStats[] => {
  if (students.length === 0) return [];

  return subjects.map(sub => {
    let sumRapor = 0;
    let sumUM = 0;
    let sumIjazah = 0;
    let highestIjazah = 0;
    let lowestIjazah = 100;
    let passedCount = 0;

    students.forEach(student => {
      const grade = student.grades[sub.id];
      if (grade) {
        sumRapor += grade.rataRapor;
        sumUM += grade.um;
        sumIjazah += grade.nilaiIjazah;

        if (grade.nilaiIjazah > highestIjazah) highestIjazah = grade.nilaiIjazah;
        if (grade.nilaiIjazah < lowestIjazah) lowestIjazah = grade.nilaiIjazah;

        if (grade.nilaiIjazah >= config.kkm) {
          passedCount++;
        }
      }
    });

    const totalStudents = students.length;
    return {
      subjectId: sub.id,
      subjectName: sub.name,
      subjectCode: sub.code,
      averageRapor: Math.round((sumRapor / totalStudents) * 100) / 100,
      averageUM: Math.round((sumUM / totalStudents) * 100) / 100,
      averageIjazah: Math.round((sumIjazah / totalStudents) * 100) / 100,
      highestIjazah,
      lowestIjazah: lowestIjazah === 100 ? 0 : lowestIjazah,
      passPercentage: Math.round((passedCount / totalStudents) * 100)
    };
  });
};

/**
 * Overall school/cohort summary stats
 */
export interface CohortStats {
  totalStudents: number;
  maleCount: number;
  femaleCount: number;
  passedCount: number;
  failedCount: number;
  averageIjazahClass: number;
  highestStudent: { name: string; score: number } | null;
  lowestStudent: { name: string; score: number } | null;
}

export const getCohortStats = (
  students: Student[],
  subjects: Subject[],
  config: FormulaConfig
): CohortStats => {
  if (students.length === 0) {
    return {
      totalStudents: 0,
      maleCount: 0,
      femaleCount: 0,
      passedCount: 0,
      failedCount: 0,
      averageIjazahClass: 0,
      highestStudent: null,
      lowestStudent: null
    };
  }

  let maleCount = 0;
  let femaleCount = 0;
  let passedCount = 0;
  let sumIjazahOfAllStudents = 0;

  let highestScore = -1;
  let highestName = "";
  let lowestScore = 101;
  let lowestName = "";

  students.forEach(student => {
    if (student.gender === 'L') maleCount++;
    if (student.gender === 'P') femaleCount++;

    const stats = getStudentStats(student, subjects, config);
    sumIjazahOfAllStudents += stats.averageIjazah;

    if (stats.isPassed) {
      passedCount++;
    }

    if (stats.averageIjazah > highestScore) {
      highestScore = stats.averageIjazah;
      highestName = student.nama;
    }
    if (stats.averageIjazah < lowestScore) {
      lowestScore = stats.averageIjazah;
      lowestName = student.nama;
    }
  });

  const totalStudents = students.length;
  const averageIjazahClass = Math.round((sumIjazahOfAllStudents / totalStudents) * 100) / 100;

  return {
    totalStudents,
    maleCount,
    femaleCount,
    passedCount,
    failedCount: totalStudents - passedCount,
    averageIjazahClass,
    highestStudent: highestScore !== -1 ? { name: highestName, score: highestScore } : null,
    lowestStudent: lowestScore !== 101 ? { name: lowestName, score: lowestScore } : null
  };
};

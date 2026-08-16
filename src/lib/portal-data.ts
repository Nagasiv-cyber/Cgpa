export type GradeCode = "O" | "A+" | "A" | "B+" | "B" | "C" | "U";

export const GRADES: GradeCode[] = ["O", "A+", "A", "B+", "B", "C", "U"];

export const GRADE_POINTS: Record<GradeCode, number> = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  U: 0,
};

export type Section = "A" | "B" | "C" | "D";
export const SECTIONS: Section[] = ["A", "B", "C", "D"];

export const SEMESTERS = ["2", "1"];

export const SEMESTER_LABELS: Record<string, string> = {
  "1": "I Semester",
  "2": "II Semester",
};

export type Subject = {
  code: string;
  name: string;
  abbr: string;
  credits: number;
  faculty: string;
  semester?: string;
};

export const SUBJECTS: Subject[] = [
  {
    code: "AD19643",
    name: "Innovation & Design Thinking",
    abbr: "IDT",
    credits: 4,
    faculty: "Dr. S. Kavitha",
  },
  {
    code: "24NCS08",
    name: "Deep Learning Architectures",
    abbr: "DLA",
    credits: 4,
    faculty: "Prof. R. Manikandan",
  },
  {
    code: "AD19651",
    name: "Natural Language Processing",
    abbr: "NLP",
    credits: 3,
    faculty: "Dr. P. Anitha",
  },
  {
    code: "AD19662",
    name: "Big Data Analytics",
    abbr: "BDA",
    credits: 3,
    faculty: "Prof. V. Sathish",
  },
  {
    code: "CS19671",
    name: "Cloud & Edge Computing",
    abbr: "CEC",
    credits: 3,
    faculty: "Dr. M. Lakshmi",
  },
  {
    code: "AD19681",
    name: "AI Systems Laboratory",
    abbr: "AIL",
    credits: 2,
    faculty: "Prof. K. Deepa",
  },
];

export type Student = {
  id: string;
  regNo: string;
  name: string;
  section: Section;
  grades: Record<string, GradeCode>;
};

const FIRST = [
  "Priya",
  "Arjun",
  "Meera",
  "Karthik",
  "Divya",
  "Rahul",
  "Sneha",
  "Vignesh",
  "Ananya",
  "Hari",
  "Lakshmi",
  "Sanjay",
  "Nithya",
  "Aravind",
  "Keerthi",
  "Manoj",
];
const LAST = ["R", "S", "M", "K", "V", "P", "N", "B"];

// Deterministic pseudo-random so SSR and client agree.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function buildStudents(): Student[] {
  const out: Student[] = [];
  let n = 0;
  SECTIONS.forEach((section, si) => {
    const rand = rng(97 + si * 31);
    for (let i = 0; i < 14; i++) {
      n++;
      const first = FIRST[(si * 5 + i) % FIRST.length];
      const last = LAST[(si * 3 + i) % LAST.length];
      const regNo = `24AD${section}${String(i + 1).padStart(3, "0")}`;
      const grades: Record<string, GradeCode> = {};
      for (const sub of SUBJECTS) {
        const r = rand();
        const g: GradeCode =
          r > 0.78 ? "O" : r > 0.55 ? "A+" : r > 0.34 ? "A" : r > 0.2 ? "B+" : r > 0.1 ? "B" : r > 0.04 ? "C" : "U";
        grades[sub.code] = g;
      }
      out.push({ id: `stu-${n}`, regNo, name: `${first} ${last}`, section, grades });
    }
  });
  return out;
}

export const STUDENTS: Student[] = buildStudents();

export function computeGpa(
  grades: Record<string, GradeCode>,
  subjects: { code: string; credits: number }[] = SUBJECTS
) {
  let points = 0;
  let credits = 0;
  for (const sub of subjects) {
    const g = grades[sub.code as keyof typeof grades];
    if (!g) continue;
    credits += sub.credits;
    points += GRADE_POINTS[g] * sub.credits;
  }
  return credits ? points / credits : 0;
}

export function arrears(student: Student) {
  return SUBJECTS.filter((s) => student.grades[s.code] === "U").map((s) => s.code);
}

export type Ranked = Student & { gpa: number; arrears: string[]; rank: number };

export function ranked(students: Student[] = STUDENTS): Ranked[] {
  return students
    .map((s) => ({ ...s, gpa: computeGpa(s.grades), arrears: arrears(s) }))
    .sort((a, b) => b.gpa - a.gpa)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

export function sectionStudents(section: Section) {
  return STUDENTS.filter((s) => s.section === section);
}

export function departmentStats() {
  const all = ranked();
  const cleared = all.filter((s) => s.arrears.length === 0);
  return {
    total: all.length,
    appeared: all.length,
    cleared: cleared.length,
    failed: all.length - cleared.length,
    passPct: (cleared.length / all.length) * 100,
    toppers: all.slice(0, 5),
  };
}

export function subjectStats(subject: Subject) {
  const strength = STUDENTS.length;
  const absentees = 2;
  const appeared = strength - absentees;
  const failed = STUDENTS.filter((s) => s.grades[subject.code] === "U").length;
  const distribution = GRADES.map((g) => ({
    grade: g,
    count: STUDENTS.filter((s) => s.grades[subject.code] === g).length,
  }));
  return {
    subject,
    strength,
    absentees,
    appeared,
    failed,
    passPct: ((appeared - failed) / appeared) * 100,
    distribution,
    arrearList: STUDENTS.filter((s) => s.grades[subject.code] === "U"),
  };
}

export function gradeTone(grade: GradeCode) {
  if (grade === "O" || grade === "A+" || grade === "A") return "success" as const;
  if (grade === "U") return "danger" as const;
  return "warning" as const;
}

export function cgpaFor(student: Student) {
  // Mock cumulative: current SGPA nudged by prior semesters.
  const sgpa = computeGpa(student.grades);
  return Math.min(10, sgpa * 0.6 + 8.1 * 0.4);
}

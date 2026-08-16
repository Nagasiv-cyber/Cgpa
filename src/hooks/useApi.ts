import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api";

async function fetcher(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = "An error occurred";
    try {
      const data = await res.json();
      msg = data.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// Queries
export function useStudents(section?: string) {
  return useQuery({
    queryKey: ["students", section],
    queryFn: () => fetcher(`/students${section ? `?section=${section}` : ""}`),
  });
}

export function useStudent(regNo: string) {
  return useQuery({
    queryKey: ["student", regNo],
    queryFn: () => fetcher(`/students/${regNo}`),
    enabled: !!regNo,
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetcher("/subjects/"),
  });
}

export function useLeaderboard(limit: number = 100, semester?: string) {
  return useQuery({
    queryKey: ["leaderboard", limit, semester],
    queryFn: () => fetcher(`/results/leaderboard?limit=${limit}${semester ? `&semester=${semester}` : ""}`),
  });
}

export function useToppers(semester: string, limit: number = 5) {
  return useQuery({
    queryKey: ["toppers", semester, limit],
    queryFn: () => fetcher(`/results/semester/${semester}/toppers?limit=${limit}`),
    enabled: !!semester,
  });
}

export function useSubjectAnalysis(semester: string) {
  return useQuery({
    queryKey: ["subject-analysis", semester],
    queryFn: () => fetcher(`/results/semester/${semester}/subject-analysis`),
    enabled: !!semester,
  });
}

export function useGradeDistribution(semester: string) {
  return useQuery({
    queryKey: ["grade-distribution", semester],
    queryFn: () => fetcher(`/results/semester/${semester}/grade-distribution`),
    enabled: !!semester,
  });
}

export function useStudentResults(regNo: string) {
  return useQuery({
    queryKey: ["student-results", regNo],
    queryFn: () => fetcher(`/results/student/${regNo}`),
    enabled: !!regNo,
  });
}

export function useSectionResults(section: string) {
  return useQuery({
    queryKey: ["section-results", section],
    queryFn: () => fetcher(`/results/section/${section}`),
    enabled: !!section,
  });
}

// Mutations
export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      register_no: string;
      name: string;
      section: string;
      department?: string;
      batch?: string;
      email?: string;
    }) =>
      fetcher("/students", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useSubmitGrades() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetcher("/results/submit", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["toppers"] });
      queryClient.invalidateQueries({ queryKey: ["student-results"] });
      queryClient.invalidateQueries({ queryKey: ["subject-analysis"] });
      queryClient.invalidateQueries({ queryKey: ["grade-distribution"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student"] });
      queryClient.invalidateQueries({ queryKey: ["section-results"] });
    },
  });
}

export function useBulkUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetcher("/results/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["toppers"] });
      queryClient.invalidateQueries({ queryKey: ["student-results"] });
      queryClient.invalidateQueries({ queryKey: ["subject-analysis"] });
      queryClient.invalidateQueries({ queryKey: ["grade-distribution"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student"] });
      queryClient.invalidateQueries({ queryKey: ["section-results"] });
    },
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      code: string;
      name: string;
      abbr: string;
      credits: number;
      faculty: string;
      semester: string;
    }) =>
      fetcher("/subjects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectCode: string) =>
      fetcher(`/subjects/${subjectCode}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: any) =>
      fetcher("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

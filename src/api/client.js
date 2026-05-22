import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://eduflowindia-api.vercel.app/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token),
  );
  failedQueue = [];
};

// Auto refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem("refreshToken");
      try {
        const { data } = await axios.post("/api/auth/refresh", {
          refreshToken,
        });
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        apiClient.defaults.headers.Authorization = `Bearer ${data.data.accessToken}`;
        processQueue(null, data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

// ── API endpoint helpers ─────────────────────────────────────────

export const authAPI = {
  login: (data) => apiClient.post("/auth/login", data),
  logout: (refreshToken) => apiClient.post("/auth/logout", { refreshToken }),
  refresh: (refreshToken) => apiClient.post("/auth/refresh", { refreshToken }),
  getMe: () => apiClient.get("/auth/me"),
  changePassword: (data) => apiClient.post("/auth/change-password", data),
  forgotPassword: (email) => apiClient.post("/auth/forgot-password", { email }),
  resetPassword: (data) => apiClient.post("/auth/reset-password", data),
  updatePreferences: (data) => apiClient.patch("/auth/preferences", data),
};

export const superadminAPI = {
  getSchools: () => apiClient.get("/superadmin/schools"),
  createSchool: (data) => apiClient.post("/superadmin/schools", data),
  updateSchool: (id, data) => apiClient.put(`/superadmin/schools/${id}`, data),
  deleteSchool: (id) => apiClient.delete(`/superadmin/schools/${id}`),
  getStats: () => apiClient.get("/superadmin/stats"),
};

export const principalAPI = {
  getSchoolProfile: () => apiClient.get("/principal/school"),
  updateSchoolProfile: (data) => apiClient.put("/principal/school", data),
  getClassrooms: () => apiClient.get("/principal/classrooms"),
  createClassroom: (data) => apiClient.post("/principal/classrooms", data),
  updateClassroom: (id, data) =>
    apiClient.put(`/principal/classrooms/${id}`, data),
  deleteClassroom: (id) => apiClient.delete(`/principal/classrooms/${id}`),
  getTeachers: () => apiClient.get("/principal/teachers"),
  createTeacher: (data) => apiClient.post("/principal/teachers", data),
  updateTeacher: (id, data) => apiClient.put(`/principal/teachers/${id}`, data),
  getStudents: (params) => apiClient.get("/principal/students", { params }),
  createStudent: (data) => apiClient.post("/principal/students", data),
  updateStudent: (id, data) => apiClient.put(`/principal/students/${id}`, data),
  getReports: () => apiClient.get("/principal/reports"),
};

export const classroomAPI = {
  getAll: () => apiClient.get("/classrooms"),
  getById: (id) => apiClient.get(`/classrooms/${id}`),
  manageStudents: (id, data) =>
    apiClient.post(`/classrooms/${id}/students`, data),
};

export const attendanceAPI = {
  get: (classroomId, date) =>
    apiClient.get(`/attendance/${classroomId}`, { params: { date } }),
  save: (classroomId, data) =>
    apiClient.post(`/attendance/${classroomId}`, data),
  submit: (classroomId, data) =>
    apiClient.post(`/attendance/${classroomId}/submit`, data),
  getStudentMonthly: (studentId, month, year) =>
    apiClient.get(`/attendance/student/${studentId}`, {
      params: { month, year },
    }),
  getStudentYearly: (studentId) =>
    apiClient.get(`/attendance/student/${studentId}/yearly`),
  getSchoolSummary: () => apiClient.get("/attendance/school-summary"),
};

export const examAPI = {
  getAll: (params) => apiClient.get("/exams", { params }),
  create: (data) => apiClient.post("/exams", data),
  update: (id, data) => apiClient.put(`/exams/${id}`, data),
  delete: (id) => apiClient.delete(`/exams/${id}`),
  enterResults: (id, data) => apiClient.post(`/exams/${id}/results`, data),
  getResults: (id) => apiClient.get(`/exams/${id}/results`),
  getStudentResults: (studentId) =>
    apiClient.get(`/exams/results/${studentId}`),
};

export const feeAPI = {
  getAll: (params) => apiClient.get("/fees", { params }),
  create: (data) => apiClient.post("/fees", data),
  collectInstallment: (id, data) =>
    apiClient.patch(`/fees/${id}/collect`, data),
  getStudentFees: (studentId) => apiClient.get(`/fees/student/${studentId}`),
  getDefaulters: () => apiClient.get("/fees/defaulters"),
};

export const salaryAPI = {
  getAll: (params) => apiClient.get("/salaries", { params }),
  create: (data) => apiClient.post("/salaries", data),
  update: (id, data) => apiClient.put(`/salaries/${id}`, data),
  delete: (id) => apiClient.delete(`/salaries/${id}`),
};

export const calendarAPI = {
  getEvents: (params) => apiClient.get("/calendar", { params }),
  createEvent: (data) => apiClient.post("/calendar", data),
  updateEvent: (id, data) => apiClient.put(`/calendar/${id}`, data),
  deleteEvent: (id) => apiClient.delete(`/calendar/${id}`),
};

export const announcementAPI = {
  getAll: () => apiClient.get("/announcements"),
  create: (data) => apiClient.post("/announcements", data),
  update: (id, data) => apiClient.put(`/announcements/${id}`, data),
  delete: (id) => apiClient.delete(`/announcements/${id}`),
  markRead: (id) => apiClient.patch(`/announcements/${id}/read`),
};

export const leaveAPI = {
  getAll: (params) => apiClient.get("/leaves", { params }),
  apply: (data) => apiClient.post("/leaves", data),
  approve: (id, data) => apiClient.patch(`/leaves/${id}/approve`, data),
};

export const messageAPI = {
  getAll: () => apiClient.get("/messages"),
  send: (data) => apiClient.post("/messages", data),
  markRead: (id) => apiClient.patch(`/messages/${id}/read`),
};

export const studentAPI = {
  getFullData: (studentId) => apiClient.get(`/students/${studentId}/full`),
  getMyProfile: () => apiClient.get("/students/profile/me"),
  getMyChildren: () => apiClient.get("/students/my-children"),
  getBirthdays: (classroomId) =>
    apiClient.get(`/students/birthdays/${classroomId}`),
  getDiaryNotes: (params) => apiClient.get("/students/diary", { params }),
  createDiaryNote: (data) => apiClient.post("/students/diary", data),
  updateDiaryNote: (id, data) => apiClient.put(`/students/diary/${id}`, data),
  deleteDiaryNote: (id) => apiClient.delete(`/students/diary/${id}`),
};

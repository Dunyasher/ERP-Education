import { apiSlice } from '../apiSlice';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query({
      query: () => '/dashboard/admin',
      providesTags: ['Dashboard'],
    }),
    getAccountantDashboard: builder.query({
      query: () => '/accountant/dashboard',
      providesTags: ['Dashboard'],
    }),
    getTeacherDashboard: builder.query({
      query: () => '/dashboard/teacher',
      providesTags: ['Dashboard'],
    }),
    getStudentDashboard: builder.query({
      query: () => '/dashboard/student',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAccountantDashboardQuery,
  useGetTeacherDashboardQuery,
  useGetStudentDashboardQuery,
} = dashboardApi;


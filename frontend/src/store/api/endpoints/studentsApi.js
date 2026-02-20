import { apiSlice } from '../apiSlice';

export const studentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query({
      query: () => '/students',
      providesTags: ['Students'],
    }),
    getStudent: builder.query({
      query: (id) => `/students/${id}`,
      providesTags: (result, error, id) => [{ type: 'Students', id }],
    }),
    getNextSerial: builder.query({
      query: () => '/students/next-serial',
    }),
    createStudent: builder.mutation({
      query: (studentData) => ({
        url: '/students',
        method: 'POST',
        body: studentData,
      }),
      invalidatesTags: ['Students'],
    }),
    updateStudent: builder.mutation({
      query: ({ id, ...studentData }) => ({
        url: `/students/${id}`,
        method: 'PUT',
        body: studentData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Students', id }, 'Students'],
    }),
    deleteStudent: builder.mutation({
      query: (id) => ({
        url: `/students/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Students'],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentQuery,
  useGetNextSerialQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = studentsApi;


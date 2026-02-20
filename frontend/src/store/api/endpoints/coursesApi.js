import { apiSlice } from '../apiSlice';

export const coursesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCourses: builder.query({
      query: () => '/courses',
      providesTags: ['Courses'],
    }),
    getCourse: builder.query({
      query: (id) => `/courses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Courses', id }],
    }),
    createCourse: builder.mutation({
      query: (courseData) => ({
        url: '/courses',
        method: 'POST',
        body: courseData,
      }),
      invalidatesTags: ['Courses'],
    }),
    updateCourse: builder.mutation({
      query: ({ id, ...courseData }) => ({
        url: `/courses/${id}`,
        method: 'PUT',
        body: courseData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Courses', id }, 'Courses'],
    }),
    deleteCourse: builder.mutation({
      query: (id) => ({
        url: `/courses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Courses'],
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
} = coursesApi;


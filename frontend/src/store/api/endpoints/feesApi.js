import { apiSlice } from '../apiSlice';

export const feesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: () => '/fees/invoices',
      providesTags: ['Invoices'],
    }),
    getInvoice: builder.query({
      query: (id) => `/fees/invoices/${id}`,
      providesTags: (result, error, id) => [{ type: 'Invoices', id }],
    }),
    createInvoice: builder.mutation({
      query: (invoiceData) => ({
        url: '/fees/invoices',
        method: 'POST',
        body: invoiceData,
      }),
      invalidatesTags: ['Invoices', 'Fees'],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...invoiceData }) => ({
        url: `/fees/invoices/${id}`,
        method: 'PUT',
        body: invoiceData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Invoices', id }, 'Invoices', 'Fees'],
    }),
    getFeeHistory: builder.query({
      query: (studentId) => `/fees/history/${studentId}`,
      providesTags: (result, error, studentId) => [{ type: 'Fees', id: studentId }],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useGetFeeHistoryQuery,
} = feesApi;


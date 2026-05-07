import axios from './axios'

export function getDashboard(params?: any) {
  return axios.get('/reports/dashboard', { params }).then(r => r.data)
}

export function getFinancial(params?: any) {
  return axios.get('/reports/financial', { params }).then(r => r.data)
}

export function getOccupancy(params?: any) {
  return axios.get('/reports/occupancy', { params }).then(r => r.data)
}

export const getDashboardKpis = async (params?: any) => (await axios.get('/reports/dashboard', { params })).data;
export const getFinancialTrend = async (params?: any) => (await axios.get('/reports/financial', { params })).data;
export const getOccupancyInsights = async (params?: any) => (await axios.get('/reports/occupancy', { params })).data;
export const getRevenueDrilldown = async (params?: any) => (await axios.get('/reports/drilldown', { params })).data;
export const getVacancyTrend = async () => (await axios.get('/reports/vacancy-trend')).data;
export const getOverdueAging = async (params?: any) => (await axios.get('/reports/overdue-aging', { params })).data;
export const getMaintenanceAnalytics = async () => (await axios.get('/reports/maintenance-analytics')).data;
export const getTurnover = () => axios.get('/reports/turnover').then(res => res.data);
export const getUtilities = (params?: any) => axios.get('/reports/utilities', { params }).then(res => res.data);
export const exportReport = (type: string) => `${axios.defaults.baseURL}/reports/export?type=${type}`;
export const exportPdfReport = (type: string) => `${axios.defaults.baseURL}/reports/export-pdf?type=${type}`;

export const getSchedules = async () => (await axios.get('/reports/schedules')).data;
export const createSchedule = async (data: any) => (await axios.post('/reports/schedules', data)).data;
export const deleteSchedule = async (id: string) => (await axios.delete(`/reports/schedules/${id}`)).data;

export const getPeopleReport = async (params?: any) => (await axios.get('/reports/people', { params })).data;
export const getLeaseReport = async (params?: any) => (await axios.get('/reports/leases', { params })).data;
export const getPropertyReport = async (params?: any) => (await axios.get('/reports/properties', { params })).data;
export const getOverdueDetails = async (params?: any) => (await axios.get('/reports/overdue-details', { params })).data;
export const getDetailedFinancials = async (params?: any) => (await axios.get('/reports/detailed-financials', { params })).data;
export const getFinanceAnalytics = async (params?: any) => (await axios.get('/reports/finance-analytics', { params })).data;
export const getPropertyAnalytics = async (params?: any) => (await axios.get('/reports/property-analytics', { params })).data;
export const getLeaseAnalytics = async (params?: any) => (await axios.get('/reports/lease-analytics', { params })).data;
export const getPeopleAnalytics = async (params?: any) => (await axios.get('/reports/people-analytics', { params })).data;
export const getInvoiceStatusBreakdown = async (params?: any) => (await axios.get('/reports/invoice-status-breakdown', { params })).data;
export const getCollectionRateTrend = async (params?: any) => (await axios.get('/reports/collection-rate-trend', { params })).data;
export const getTenantPaymentHistory = async (params?: any) => (await axios.get('/reports/tenant-payment-history', { params })).data;

export default {
  getDashboard,
  getFinancial,
  getOccupancy,
  getPeopleReport,
  getLeaseReport,
  getPropertyReport,
  getOverdueDetails,
  getDetailedFinancials,
}

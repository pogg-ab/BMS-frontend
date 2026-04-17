import axios from './axios'

export function getDashboard() {
  return axios.get('/reports/dashboard').then(r => r.data)
}

export function getFinancial() {
  return axios.get('/reports/financial').then(r => r.data)
}

export function getOccupancy() {
  return axios.get('/reports/occupancy').then(r => r.data)
}

export const getDashboardKpis = async () => (await axios.get('/reports/dashboard')).data;
export const getFinancialTrend = async () => (await axios.get('/reports/financial')).data;
export const getOccupancyInsights = async () => (await axios.get('/reports/occupancy')).data;
export const getRevenueDrilldown = async () => (await axios.get('/reports/drilldown')).data;
export const getVacancyTrend = async () => (await axios.get('/reports/vacancy-trend')).data;
export const getOverdueAging = async () => (await axios.get('/reports/overdue-aging')).data;
export const getMaintenanceAnalytics = async () => (await axios.get('/reports/maintenance-analytics')).data;
export const getTurnover = () => axios.get('/reports/turnover').then(res => res.data);
export const getUtilities = () => axios.get('/reports/utilities').then(res => res.data);
export const exportReport = (type: string) => `${axios.defaults.baseURL}/reports/export?type=${type}`;

export const getPeopleReport = async () => (await axios.get('/reports/people')).data;
export const getLeaseReport = async () => (await axios.get('/reports/leases')).data;
export const getPropertyReport = async () => (await axios.get('/reports/properties')).data;
export const getOverdueDetails = async () => (await axios.get('/reports/overdue-details')).data;
export const getDetailedFinancials = async () => (await axios.get('/reports/detailed-financials')).data;
export const getFinanceAnalytics = async () => (await axios.get('/reports/finance-analytics')).data;
export const getPropertyAnalytics = async () => (await axios.get('/reports/property-analytics')).data;
export const getLeaseAnalytics = async () => (await axios.get('/reports/lease-analytics')).data;
export const getPeopleAnalytics = async () => (await axios.get('/reports/people-analytics')).data;

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

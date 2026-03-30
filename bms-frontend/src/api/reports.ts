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

export default {
  getDashboard,
  getFinancial,
  getOccupancy,
}

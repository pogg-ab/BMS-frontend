import axios from '../api/axios';

export async function downloadReport(type: string, format: 'csv' | 'pdf' = 'csv') {
  try {
    const endpoint = format === 'pdf' ? '/reports/export-pdf' : '/reports/export';
    const response = await axios.get(`${endpoint}?type=${type}`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const filename = `${type}_report_${new Date().getTime()}.${format}`;
    link.setAttribute('download', filename);
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

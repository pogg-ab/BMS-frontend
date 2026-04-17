import axios from '../api/axios';

export async function downloadReport(type: string) {
  try {
    const response = await axios.get(`/reports/export?type=${type}`, {
      responseType: 'blob',
    });
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Set filename
    const filename = `${type}_report_${new Date().getTime()}.csv`;
    link.setAttribute('download', filename);
    
    // Append to body, click and remove
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

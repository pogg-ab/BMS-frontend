const axios = require('axios');

async function main() {
    const baseUrl = 'http://localhost:3000';
    const admin = { email: 'superadmin@example.com', password: '12345678' };

    try {
        console.log('Logging in as Admin...');
        const adminLogin = await axios.post(`${baseUrl}/auth/login`, admin);
        const adminToken = adminLogin.data.access_token || adminLogin.data.token;

        console.log('Checking all tenants...');
        const tenants = await axios.get(`${baseUrl}/tenants`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log('--- TENANTS LIST ---');
        console.log(JSON.stringify(tenants.data.map(t => ({
            id: t.id,
            email: t.email,
            user_id: t.user?.id
        })), null, 2));

        console.log('Checking all users via users API...');
        const users = await axios.get(`${baseUrl}/users`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const abel = users.data.find(u => u.email === 'abellegesse29@gmail.com');
        console.log('Abel User:', JSON.stringify(abel, null, 2));

    } catch (e) {
        console.error('Error detail:', e.response?.data || e.message);
    }
}
main();

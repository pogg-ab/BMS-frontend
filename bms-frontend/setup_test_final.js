const axios = require('axios');

async function main() {
    const baseUrl = 'http://localhost:3000';
    const abel = { email: 'abellegesse29@gmail.com', password: '12345678' };
    const admin = { email: 'superadmin@example.com', password: '12345678' };

    try {
        console.log('Logging in as Abel...');
        const abelLogin = await axios.post(`${baseUrl}/auth/login`, abel);
        const abelToken = abelLogin.data.access_token || abelLogin.data.token;

        console.log('Fetching Abel profile...');
        const profileRes = await axios.get(`${baseUrl}/auth/profile`, {
            headers: { Authorization: `Bearer ${abelToken}` }
        });
        const tenant = profileRes.data.tenant;
        if (!tenant) throw new Error('Abel is not a tenant!');
        const tenantId = tenant.id;

        console.log('Fetching a unit...');
        const units = await axios.get(`${baseUrl}/units`, {
            headers: { Authorization: `Bearer ${abelToken}` }
        });
        const unitId = units.data[0]?.id;
        if (!unitId) throw new Error('No units found!');

        console.log('Creating request...');
        const reqRes = await axios.post(`${baseUrl}/maintenance/requests`, {
            tenant_id: tenantId,
            unit_id: unitId,
            category: 'Plumbing',
            priority: 'MEDIUM',
            description: 'Final Verification Request'
        }, {
            headers: { Authorization: `Bearer ${abelToken}` }
        });
        const requestId = reqRes.data.id;
        console.log(`Created request: ${requestId}`);

        console.log('Logging in as Admin...');
        const adminLogin = await axios.post(`${baseUrl}/auth/login`, admin);
        const adminToken = adminLogin.data.access_token || adminLogin.data.token;

        const contractors = await axios.get(`${baseUrl}/maintenance/contractors`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const contractorId = contractors.data[0]?.id;

        console.log('Creating and completing Work Order...');
        const woRes = await axios.post(`${baseUrl}/maintenance/work-orders`, {
            request_id: requestId,
            contractor_id: contractorId,
            cost_estimate: 75,
            scheduled_date: new Date().toISOString()
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const woId = woRes.data.id;

        await axios.patch(`${baseUrl}/maintenance/work-orders/${woId}/status`, {
            status: 'COMPLETED',
            actual_cost: 75
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log('SUCCESS: Request is now COMPLETED and ready for Abel to rate.');
    } catch (e) {
        console.error('Error detail:', e.response?.data || e.message);
    }
}
main();

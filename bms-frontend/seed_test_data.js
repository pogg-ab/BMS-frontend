const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const ADMIN_EMAIL = 'superadmin@example.com';
const ADMIN_PASS = 'SuperSecure123!';

async function seed() {
    console.log('--- Seeding Test Data for Frontend Verification ---');

    let token = '';
    try {
        const loginRes = await axios.post(`${API_BASE}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });
        token = loginRes.data.access_token;
        console.log('[PASS] Auth successful');
    } catch (err) {
        console.log(`[FAIL] Auth failed: ${err.message}`);
        return;
    }

    const client = axios.create({
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${token}` }
    });

    try {
        // 1. Get a Building ID
        const buildingsRes = await client.get('/buildings');
        const buildings = buildingsRes.data?.data || buildingsRes.data || [];
        if (buildings.length === 0) {
            console.log('[FAIL] No buildings found to link data to.');
            return;
        }
        const buildingId = buildings[0].id;
        console.log(`[INFO] Using Building ID: ${buildingId}`);

        // 2. Create a Unit
        try {
            const unitRes = await client.post('/units', {
                unit_number: 'TEST-101',
                buildingId: buildingId,
                floor: 1,
                bedrooms: 2,
                bathrooms: 1,
                size_sqm: 85,
                type: 'STUDIO', // Frontend uses Studio/1BR/etc
                status: 'VACANT',
                rent_price: 15000
            });
            console.log(`[PASS] Unit created: ${unitRes.data.id}`);
        } catch (err) {
            console.log(`[WARN] Unit creation failed (maybe exists?): ${err.message}`);
        }

        // 3. Create a Tenant
        try {
            const tenantRes = await client.post('/tenants', {
                name: 'John Doe Test',
                email: 'johntest@example.com',
                phone: '0911223344',
                type: 'individual'
            });
            console.log(`[PASS] Tenant created: ${tenantRes.data.id}`);
        } catch (err) {
            console.log(`[WARN] Tenant creation failed: ${err.message}`);
        }

    } catch (err) {
        console.log(`[FAIL] Seeding failed: ${err.message}`);
    }
}

seed();

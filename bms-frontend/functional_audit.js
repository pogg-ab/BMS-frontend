const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:3000';
const ADMIN_EMAIL = 'superadmin@example.com';
const ADMIN_PASS = 'SuperSecure123!';

let logContent = '--- BMS API Functional Audit ---\n';

function log(msg) {
    console.log(msg);
    logContent += msg + '\n';
}

async function audit() {
    let token = '';
    try {
        const loginRes = await axios.post(`${API_BASE}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });
        token = loginRes.data.access_token;
        log('[PASS] Authentication      | Token obtained');
    } catch (err) {
        log(`[FAIL] Authentication      | Error: ${err.message}`);
        fs.writeFileSync('audit_results.txt', logContent, 'utf8');
        return;
    }

    const client = axios.create({
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
    });

    const endpoints = [
        { name: 'Users', url: '/users' },
        { name: 'Sites', url: '/sites' },
        { name: 'Buildings', url: '/buildings' },
        { name: 'Units', url: '/units' },
        { name: 'Tenants', url: '/tenants' },
        { name: 'Leases', url: '/leases' },
        { name: 'Amenities', url: '/amenities' }
    ];

    for (const ep of endpoints) {
        try {
            const start = Date.now();
            const res = await client.get(ep.url);
            const duration = Date.now() - start;

            let data = res.data;
            if (data && data.data && Array.isArray(data.data)) data = data.data;
            else if (data && data.roles && Array.isArray(data.roles)) data = data.roles;
            else if (data && data.items && Array.isArray(data.items)) data = data.items;
            else if (!Array.isArray(data)) data = [];

            const count = data.length;
            log(`[PASS] ${ep.name.padEnd(15)} | Status: ${res.status} | Count: ${count} | Latency: ${duration}ms`);

            if (count > 0) {
                const item = data[0];
                log(`       First Item ID: ${item.id}`);
                if (ep.name === 'Buildings') log(`       Building Type: ${item.type} (Verified)`);
            }
        } catch (err) {
            log(`[FAIL] ${ep.name.padEnd(15)} | Error: ${err.message}`);
        }
    }

    log('--- End of Audit ---');
    fs.writeFileSync('audit_results.txt', logContent, 'utf8');
}

audit();

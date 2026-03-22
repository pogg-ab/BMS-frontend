const axios = require('axios');
async function test() {
  const login = await axios.post('http://localhost:3000/auth/login', {
    email: 'abel@example.com',
    password: 'password123'
  });
  const token = login.data.access_token;
  try {
    const wos = await axios.get('http://localhost:3000/maintenance/work-orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Work orders found:", wos.data.length);
  } catch(e) {
    console.log("Failed:", e.response?.status, e.response?.data);
  }
}
test();

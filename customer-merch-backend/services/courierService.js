const axios = require('axios');

// Fungsi Fetch Tracking dari API Kurir Pihak Ketiga
exports.fetchCourierTracking = async (courierCode, waybillNumber) => {
  try {
    // Contoh pengintegrasian dengan API Lacak Resi Binderbyte / RajaOngkir API
    // Ganti API_KEY dengan API Key milik Anda
    const apiKey = process.env.COURIER_API_KEY || 'YOUR_BINDERBYTE_API_KEY';
    
    // Format standar kode kurir: jne, sicepat, jnt, anteraja
    const response = await axios.get(`https://api.binderbyte.com/v1/track`, {
      params: {
        api_key: apiKey,
        courier: courierCode.toLowerCase(),
        awb: waybillNumber
      }
    });

    if (response.data && response.data.status === 200) {
      const data = response.data.data;
      
      // Map format history dari API Kurir ke format internal C-Merch
      const historyLogs = data.history.map(item => ({
        title: item.description,
        location: item.location || 'In Transit',
        timestamp: item.date,
        status_code: item.code
      }));

      return {
        success: true,
        summary: data.summary,
        delivered: data.summary.is_delivered,
        history: historyLogs
      };
    }

    return { success: false, history: [] };
  } catch (error) {
    console.error('Gagal mengambil data dari API Kurir Pihak Ketiga:', error.message);
    return { success: false, history: [] };
  }
};
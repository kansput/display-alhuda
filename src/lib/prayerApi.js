export async function getJadwalMuhammadiyah() {
  try {
    const lat = -6.2000;
    const lng = 106.8667;
    
    // Get today's date in WIB timezone (UTC+7)
    const now = new Date();
    const wibTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    
    const today = wibTime;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format: DD-MM-YYYY
    const todayStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
    const tomorrowStr = `${tomorrow.getDate().toString().padStart(2, '0')}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getFullYear()}`;
    
    // Fetch today - Method 11 = Majelis Tarjih Muhammadiyah
    const resToday = await fetch(`https://api.aladhan.com/v1/timings/${todayStr}?latitude=${lat}&longitude=${lng}&method=11`, { 
      cache: 'no-store'
    });
    const resultToday = await resToday.json();
    if (resultToday.code !== 200) return null;

    // Fetch tomorrow
    const resTomorrow = await fetch(`https://api.aladhan.com/v1/timings/${tomorrowStr}?latitude=${lat}&longitude=${lng}&method=11`, { 
      cache: 'no-store'
    });
    const resultTomorrow = await resTomorrow.json();
    if (resultTomorrow.code !== 200) return null;

    return {
      jadwal: {
        subuh: resultToday.data.timings.Fajr,
        syuruq: resultToday.data.timings.Sunrise, 
        dzuhur: resultToday.data.timings.Dhuhr,
        ashar: resultToday.data.timings.Asr,
        maghrib: resultToday.data.timings.Maghrib,
        isya: resultToday.data.timings.Isha,    
        tanggal: resultToday.data.date.readable
      },
      jadwalBesok: {
        subuh: resultTomorrow.data.timings.Fajr,
        dzuhur: resultTomorrow.data.timings.Dhuhr,
        ashar: resultTomorrow.data.timings.Asr,
        maghrib: resultTomorrow.data.timings.Maghrib,
        isya: resultTomorrow.data.timings.Isha,
      },
      hijri: resultToday.data.date.hijri,
      lokasi: "Matraman, Jakarta Timur"
    };
  } catch (error) {
    return null;
  }
}
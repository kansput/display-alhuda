export const formatJamMenit = (date) => {
  return date.toLocaleTimeString('id-ID', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  }).replace(/\./g, ':'); 
};

export const formatTanggalMasehi = (date) => {
  // Pastikan pakai timezone Indonesia
  return date.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
};

export const formatTanggalHijriahFromAPI = (hijriData) => {
  if (!hijriData) return '';
  const { day, month, year } = hijriData;
  const bulanHijriah = [
    'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 
    'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Syakban',
    'Ramadhan', 'Syawal', 'Dzulqaidah', 'Dzulhijjah'
  ];
  return `${day} ${bulanHijriah[month.number - 1]} ${year} H`;
};
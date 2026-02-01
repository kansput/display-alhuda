export default function RunningText() {
  const quote = "يَا بَنِي آدَمَ خُذُوا زِينَتَكُمْ عِندَ كُلِّ مَسْجِدٍ • Hai anak Adam, pakailah pakaianmu yang indah di setiap (memasuki) masjid (QS. Al-A'raf: 31) • صَلَاةُ الْجَمَاعَةِ أَفْضَلُ مِنْ صَلَاةِ الْفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً • Shalat berjamaah lebih utama daripada shalat sendirian dengan 27 derajat (HR. Bukhari Muslim) • مَنْ تَوَضَّأَ فَأَحْسَنَ الْوُضُوءَ ثُمَّ أَتَى الْمَسْجِدَ لاَ يُرِيدُ إِلاَّ الصَّلاَةَ لَمْ يَخْطُ خَطْوَةً إِلاَّ رَفَعَهُ اللَّهُ بِهَا دَرَجَةً • Barangsiapa berwudhu dengan sempurna kemudian pergi ke masjid tidak ada tujuan lain kecuali shalat, maka setiap langkahnya akan diangkat satu derajat oleh Allah (HR. Muslim)";

  return (
    <div className="relative bg-teal-700 py-1.5 overflow-hidden flex whitespace-nowrap">
      {/* Container utama yang bergerak */}
      <div className="flex animate-running-text min-w-full">
        {/* Bagian 1 */}
        <span className="text-white text-sm font-semibold tracking-wide px-4">
          {quote} ★ ★ ★
        </span>
        {/* Bagian 2 (Duplikat persis agar saat balik ke 0% tidak melompat) */}
        <span className="text-white text-sm font-semibold tracking-wide px-4">
          {quote} ★ ★ ★
        </span>
      </div>
    </div>
  );
}
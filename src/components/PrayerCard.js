export default function PrayerCard({ nama, waktu, data, isJumat, isActive, isNext, isTomorrow }) {
  const isJumatTime = isJumat && nama === "DZUHUR";
  const isSyuruq = nama.toUpperCase() === "SYURUQ" || nama.toUpperCase() === "SYURUQ";

  // Warna dasar
  let borderColor = "border-slate-300";
  let bgColor = "bg-gradient-to-br from-white to-slate-50";
  let textColor = "text-slate-900";
  let labelColor = "text-slate-600";
  let infoBorder = "border-slate-200";
  let infoText = "text-slate-600";

  if (isActive) {
    borderColor = "border-teal-600";
    bgColor = "bg-gradient-to-br from-teal-50 to-teal-100";
    textColor = "text-teal-900";
    labelColor = "text-teal-700";
    infoBorder = "border-teal-200";
    infoText = "text-teal-700";
  } else if (isNext) {
    borderColor = "border-teal-500";
    bgColor = "bg-gradient-to-br from-teal-50/50 to-teal-50/30";
  }

 

  return (
    <div
      className={`text-center pt-4 pb-4 border-t-4 rounded-lg transition-all duration-300 shadow-md ${borderColor} ${bgColor}`}
    >
      {/* Nama Sholat / Syuruq */}
      <p
        className={`text-sm font-black tracking-widest uppercase mb-2 ${labelColor}`}
      >
        {isJumatTime ? "JUMAT" : nama}
        {isTomorrow && <span className="ml-1 text-xs bg-orange-500 text-white px-2 py-1 rounded">BESOK</span>}
      </p>

      {/* Waktu */}
      <p className={`text-4xl font-light tabular-nums tracking-tight mb-3 ${textColor}`}>
        {waktu}
      </p>

      {/* Info Imam / Keterangan */}
      <div className={`text-sm pt-2 border-t-2 ${infoBorder} ${infoText}`}>
        {isJumatTime ? (
          <div className="space-y-1">
            <p className="font-bold">K: {data?.khatib || "-"}</p>
            <p className="font-bold">I: {data?.imam || "-"}</p>
          </div>
        ) : isSyuruq ? (
          <p className="font-semibold italic">Waktu terbit matahari</p>
        ) : (
          <div className="space-y-1">
            <p className="font-bold">{data?.utama || "-"}</p>
            <p className="font-semibold opacity-70">{data?.badal || "-"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
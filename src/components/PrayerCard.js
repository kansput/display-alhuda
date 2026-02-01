export default function PrayerCard({ nama, waktu, data, isJumat, isActive, isNext, isTomorrow }) {
  const isJumatTime = isJumat && nama === "DZUHUR";
  const isSyuruq = nama.toUpperCase() === "SYURUQ" || nama.toUpperCase() === "SYURUQ";

  // Warna dasar
  let borderColor = "border-slate-300";
  let bgColor = "bg-white/60";
  let textColor = "text-slate-900";
  let labelColor = "text-slate-600";
  let infoBorder = "border-slate-200";
  let infoText = "text-slate-600";

  if (isActive) {
    borderColor = "border-teal-600";
    bgColor = "bg-teal-50";
    textColor = "text-teal-900";
    labelColor = "text-teal-700";
    infoBorder = "border-teal-200";
    infoText = "text-teal-700";
  } else if (isNext) {
    borderColor = "border-teal-500";
    bgColor = "bg-teal-50/50";
  }

 

  return (
    <div
      className={`text-center pt-2.5 pb-2 border-t-2 transition-all duration-300 ${borderColor} ${bgColor}`}
    >
      {/* Nama Sholat / Syuruq */}
      <p
        className={`text-[9px] font-black tracking-widest uppercase mb-1 ${labelColor}`}
      >
        {isJumatTime ? "JUMAT" : nama}
        {isTomorrow && <span className="ml-1 text-[7px] bg-orange-500 text-white px-1 py-0.5 rounded">BESOK</span>}
      </p>

      {/* Waktu */}
      <p className={`text-xl font-light tabular-nums tracking-tight mb-1.5 ${textColor}`}>
        {waktu}
      </p>

      {/* Info Imam / Keterangan */}
      <div className={`text-[9px] pt-1 border-t ${infoBorder} ${infoText}`}>
        {isJumatTime ? (
          <div className="space-y-0.5">
            <p className="font-semibold">K: {data?.khatib || "-"}</p>
            <p className="font-semibold">I: {data?.imam || "-"}</p>
          </div>
        ) : isSyuruq ? (
          <p className="font-medium italic">Waktu terbit matahari</p>
        ) : (
          <div className="space-y-0.5">
            <p className="font-semibold">{data?.utama || "-"}</p>
            <p className="font-medium opacity-70">{data?.badal || "-"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
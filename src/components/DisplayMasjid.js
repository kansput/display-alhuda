"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { BookOpen, ChevronRight } from "lucide-react";
import { playAdzanBeep, playIqamahWarning } from "@/lib/audio";
import {
  formatJamMenit,
  formatTanggalMasehi,
  formatTanggalHijriahFromAPI,
} from "@/lib/formatter";
import { weeklySchedule } from "@/lib/weeklySchedule";
import { kajianSchedule } from "@/lib/kajianSchedule";
import PrayerCard from "@/components/PrayerCard";
import RunningText from "@/components/RunningText";
import SholatOverlay from "@/components/SholatOverlay";

export default function DisplayMasjid({ initialData }) {
  const [now, setNow] = useState(new Date());
  const [status, setStatus] = useState("IDLE"); // IDLE -> ADZAN (15 detik) -> WAITING_IQAMAH
  const [adzanStartTime, setAdzanStartTime] = useState(null);
  const [iqamahStartTime, setIqamahStartTime] = useState(null);
  const [audioReady, setAudioReady] = useState(false);
  const { jadwal, jadwalBesok } = initialData;

  const currentDay = now.toLocaleDateString("id-ID", { weekday: "long" });
  const daySchedule = weeklySchedule[currentDay] || weeklySchedule["Senin"];
  const isJumat = currentDay === "Jumat";

  const [showSholatOverlay, setShowSholatOverlay] = useState(false);
  const [overlayTriggered, setOverlayTriggered] = useState(false);
  const [iqamahWarningPlayed, setIqamahWarningPlayed] = useState(false);

  // Get tomorrow's schedule (untuk display card footer kalo udah lewat Isya)
  const getTomorrowDay = () => {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString("id-ID", { weekday: "long" });
  };
  const tomorrowDay = getTomorrowDay();
  const tomorrowSchedule =
    weeklySchedule[tomorrowDay] || weeklySchedule["Senin"];
  const isTomorrowJumat = tomorrowDay === "Jumat";

  // Mapping nama hari untuk UI
  const dayNameMap = {
    Minggu: "Ahad",
    Senin: "Senin",
    Selasa: "Selasa",
    Rabu: "Rabu",
    Kamis: "Kamis",
    Jumat: "Jumat",
    Sabtu: "Sabtu",
  };
  const displayDay = dayNameMap[currentDay] || currentDay;

  
  const iqamahDuration = {
    SUBUH: 20, 
    DZUHUR:12, 
    ASHAR: 10, 
    MAGHRIB: 10, 
    ISYA: 10, 
  };

  // Define listShalat TANPA data besok dulu (untuk getCurrentPrayer)
  const listShalatTemp = [
    { nama: "SUBUH", waktu: jadwal.subuh, data: daySchedule.subuh },
    { nama: "SYURUQ", waktu: jadwal.syuruq },
    {
      nama: "DZUHUR",
      waktu: jadwal.dzuhur,
      data: isJumat ? daySchedule.jumat : daySchedule.dzuhur,
    },
    { nama: "ASHAR", waktu: jadwal.ashar, data: daySchedule.ashar },
    { nama: "MAGHRIB", waktu: jadwal.maghrib, data: daySchedule.maghrib },
    { nama: "ISYA", waktu: jadwal.isya, data: daySchedule.isya },
  ];

  const getCurrentPrayer = () => {
    const currentTime = formatJamMenit(now);
    const prayerTimes = listShalatTemp.filter((p) => p.nama !== "SYURUQ");

    for (let i = 0; i < prayerTimes.length; i++) {
      const current = prayerTimes[i];
      const next = prayerTimes[i + 1];

      if (currentTime >= current.waktu && (!next || currentTime < next.waktu)) {
        return {
          current: current.nama,
          next: next?.nama || "SUBUH",
        };
      }
    }

    // Fallback: waktu sebelum Subuh (00:00-04:xx) = belum ada waktu sholat, next = Subuh hari ini
    return { current: null, next: "SUBUH" };
  };

  const { current: currentPrayer, next: nextPrayer } = getCurrentPrayer();

  // Sekarang baru define listShalat FINAL dengan logic besok
  // Cuma pakai jadwal besok kalau: current=ISYA DAN jam >= 19:00 (setelah Isya)
  const useJadwalBesok = currentPrayer === "ISYA" && now.getHours() >= 19;
  
  const listShalat = [
    {
      nama: "SUBUH",
      waktu: useJadwalBesok ? jadwalBesok.subuh : jadwal.subuh,
      data: useJadwalBesok ? tomorrowSchedule.subuh : daySchedule.subuh,
      isTomorrow: useJadwalBesok,
    },
    { nama: "SYURUQ", waktu: jadwal.syuruq },
    {
      nama: "DZUHUR",
      waktu: jadwal.dzuhur,
      data: isJumat ? daySchedule.jumat : daySchedule.dzuhur,
    },
    { nama: "ASHAR", waktu: jadwal.ashar, data: daySchedule.ashar },
    { nama: "MAGHRIB", waktu: jadwal.maghrib, data: daySchedule.maghrib },
    { nama: "ISYA", waktu: jadwal.isya, data: daySchedule.isya },
  ];
  const todayKajian =
    kajianSchedule.find((k) => k.hari === displayDay) || kajianSchedule[0];

  const getCountdown = () => {
    if (status === "ADZAN" && adzanStartTime) {
      const adzanEndTime = new Date(adzanStartTime.getTime() + 180 * 1000); // 3 menit (180 detik)
      const diff = adzanEndTime - now;

      if (diff <= 0) return null;

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours: 0, minutes, seconds, isAdzan: true };
    }

    // Jika sedang menunggu iqamah, hitung mundur dari waktu iqamah
    if (status === "WAITING_IQAMAH" && iqamahStartTime) {
      const duration = iqamahDuration[currentPrayer] || 0.25;
      const iqamahEndTime = new Date(
        iqamahStartTime.getTime() + duration * 60 * 1000,
      );
      const diff = iqamahEndTime - now;

      if (diff <= 0) return null;

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours: 0, minutes, seconds, isIqamah: true };
    }


    let nextTime;
    // Cuma pakai jadwalBesok kalau: current=ISYA DAN jam >= 19:00
    if (nextPrayer === "SUBUH" && currentPrayer === "ISYA" && now.getHours() >= 19 && jadwalBesok) {
      nextTime = jadwalBesok.subuh;
    } else {
      nextTime = listShalat.find((s) => s.nama === nextPrayer)?.waktu;
    }

    if (!nextTime) return null;

    const [h, m] = nextTime.split(":").map(Number);
    const nextDate = new Date(now);
    nextDate.setHours(h, m, 0, 0);

    // Hanya set hari besok kalau next=SUBUH DAN jam >= 19:00 (setelah Isya)
    if (nextPrayer === "SUBUH" && now.getHours() >= 19) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    const diff = nextDate - now;
    if (diff < 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, isIqamah: false };
  };

  const countdown = getCountdown();

  useEffect(() => {
    if (status === "IDLE" && overlayTriggered) {
      setOverlayTriggered(false);
    }
  }, [status, overlayTriggered]);
  // Unlock audio dengan indikator visual
  useEffect(() => {
    const unlockAudio = () => {
      const audio = new Audio("/sounds/beep.mp3");
      audio.volume = 0.1; // volume kecil biar gak kaget
      audio
        .play()
        .then(() => {
          audio.pause();
          setAudioReady(true);
          console.log(" AUDIO SIAP!");
        })
        .catch(() => {
          console.log(" Klik layar untuk aktifkan audio");
        });
    };

    // Coba unlock otomatis
    unlockAudio();

    // Unlock saat user klik dimana aja
    const handleClick = () => {
      if (!audioReady) {
        unlockAudio();
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [audioReady]);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = new Date();
      setNow(currentTime);
      const jamMenit = formatJamMenit(currentTime);

   
      if (listShalat.some((s) => s.waktu === jamMenit) && status === "IDLE") {
        console.log(" ADZAN MASUK!");
        setStatus("ADZAN");
        setAdzanStartTime(currentTime);
        playAdzanBeep();
      }

      
      if (status === "ADZAN" && adzanStartTime) {
        const diff = currentTime - adzanStartTime;
        const elapsedMinutes = diff / (1000 * 60);

        if (elapsedMinutes >= 3) {
          
          console.log(" MULAI IQAMAH!");
          setStatus("WAITING_IQAMAH");
          setIqamahStartTime(currentTime);
          setIqamahWarningPlayed(false);
        }
      }

     
      if (status === "WAITING_IQAMAH" && iqamahStartTime) {
        const duration = iqamahDuration[currentPrayer] || 0.25;
        const diff = currentTime - iqamahStartTime;
        const elapsedMinutes = diff / (1000 * 60);
        const remainingSeconds = duration * 60 - diff / 1000;

     
        if (remainingSeconds <= 8 && remainingSeconds > 7) {
          console.log("  8 detik lagi iqamah!");
          playIqamahWarning();
          setIqamahWarningPlayed(true);
        }

        if (elapsedMinutes >= duration && !overlayTriggered) {
          console.log(" SHOLAT DIMULAI!");
          setShowSholatOverlay(true);
          setOverlayTriggered(true);

          setStatus("IDLE");
          setAdzanStartTime(null);
          setIqamahStartTime(null);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [
    status,
    adzanStartTime,
    iqamahStartTime,
    listShalat,
    currentPrayer,
    iqamahDuration,
    overlayTriggered,
    iqamahWarningPlayed,
  ]);

  return (
    <main className="h-screen w-screen bg-gradient-to-br from-slate-100 via-slate-50 to-gray-100 text-slate-900 flex flex-col px-8 py-3 select-none overflow-hidden cursor-none">
      {/* HEADER */}
      <header className="flex justify-between items-center border-b-4 border-teal-700 pb-3 mb-3">
        <div className="flex gap-6 items-center">
          <Image
            src="/logo-muhammadiyah.png"
            alt="Logo"
            width={70}
            height={70}
            className="object-contain"
          />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-teal-700 leading-none">
              MASJID AL-HUDA
            </h1>
            <p className="text-sm font-bold text-slate-600 tracking-widest uppercase mt-1">
              Pimpinan Ranting Muhammadiyah Rambutan • Utankayu Utara
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-4xl font-black tabular-nums tracking-tight text-slate-900">
            {now.toLocaleTimeString("id-ID", { hour12: false })}
          </p>
          <p className="text-sm font-bold text-slate-700 mt-1">
            {formatTanggalMasehi(now)}
          </p>
          <p className="text-sm font-bold text-slate-700 mt-0.5">
            {formatTanggalHijriahFromAPI(initialData.hijri)}
          </p>

          {/* INDIKATOR AUDIO */}
          {!audioReady && (
            <p className="text-xs text-red-600 font-bold mt-1 animate-pulse">
              🔇 KLIK LAYAR UNTUK AKTIFKAN AUDIO
            </p>
          )}
          {audioReady && (
            <p className="text-xs text-green-600 font-bold mt-1">
               AUDIO AKTIF
            </p>
          )}
        </div>
      </header>

      {/* MAIN DISPLAY - COUNTDOWN & KAJIAN */}
      <div className="grid grid-cols-2 gap-3 mb-2 flex-1">
        {/* COUNTDOWN KIRI */}
        <div className="flex flex-col justify-center items-center bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-4 shadow-lg">
          <p className="text-sm uppercase tracking-widest text-teal-100 font-bold mb-2">
            {countdown?.isAdzan
              ? `WAKTU ADZAN ${currentPrayer}`
              : countdown?.isIqamah
                ? `MENUJU IQAMAH ${currentPrayer}`
                : `MENUJU ${nextPrayer}`}
          </p>
          {countdown && (
            <div className="flex items-center justify-center gap-2">
              {!countdown.isIqamah && !countdown.isAdzan && (
                <>
                  <div className="text-center">
                    <p className="text-4xl font-black text-white tabular-nums leading-none">
                      {countdown.hours.toString().padStart(2, "0")}
                    </p>
                    <p className="text-[9px] font-bold text-teal-100 mt-1 tracking-wider">
                      JAM
                    </p>
                  </div>
                  <p className="text-3xl font-black text-teal-300">:</p>
                </>
              )}
              <div className="text-center">
                <p className="text-4xl font-black text-white tabular-nums leading-none">
                  {countdown.minutes.toString().padStart(2, "0")}
                </p>
                <p className="text-[9px] font-bold text-teal-100 mt-1 tracking-wider">
                  MENIT
                </p>
              </div>
              <p className="text-3xl font-black text-teal-300">:</p>
              <div className="text-center">
                <p className="text-4xl font-black text-white tabular-nums leading-none">
                  {countdown.seconds.toString().padStart(2, "0")}
                </p>
                <p className="text-[9px] font-bold text-teal-100 mt-1 tracking-wider">
                  DETIK
                </p>
              </div>
            </div>
          )}
        </div>

        {/* KAJIAN & IMAM KANAN */}
        <div className="flex flex-col justify-between bg-white/90 rounded-xl p-4 shadow-lg border border-slate-200">
          {/* Kajian Info - ENHANCED */}
          <div className="mb-3 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-lg -z-10"></div>
            <div className="relative bg-gradient-to-r from-teal-50 to-emerald-50 border-l-4 border-teal-600 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen
                  className="text-teal-600 animate-pulse"
                  size={18}
                  strokeWidth={2.5}
                />
                <h3 className="text-base font-black text-teal-800 tracking-wide uppercase font-serif">
                  Kajian Hari Ini
                </h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[9px] text-teal-600 font-bold uppercase tracking-wider mb-1">
                    Tema Kajian
                  </p>
                  <p className="text-base font-black text-slate-900 leading-tight font-serif">
                    {todayKajian.tema}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-teal-200/50">
                  <div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide mb-0.5">
                      Waktu
                    </p>
                    <p className="text-sm font-bold text-teal-700">
                      {todayKajian.waktu}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide mb-0.5">
                      Koordinator 
                    </p>
                    <p className="text-sm font-bold text-teal-700">
                      {todayKajian.Koordinator}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current & Next Prayer Imam Info */}
          {(() => {
            const currentPrayerData = listShalat.find(
              (s) => s.nama === currentPrayer,
            );
            const nextPrayerData = listShalat.find(
              (s) => s.nama === nextPrayer,
            );
            const isCurrentJumat = isJumat && currentPrayer === "DZUHUR";
            const isNextJumat = isJumat && nextPrayer === "DZUHUR";

            return (
              <div className="pt-2.5 border-t-2 border-slate-200 space-y-2.5">
                {/* CURRENT IMAM - HIGHLIGHTED */}
                <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg p-2.5 shadow-md">
                  <h3 className="text-xs font-black text-white tracking-wide uppercase mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    IMAM {currentPrayer} SEKARANG
                  </h3>
                  {isCurrentJumat ? (
                    <div className="space-y-1">
                      <div>
                        <p className="text-[8px] text-teal-100 font-semibold uppercase tracking-wide mb-0.5">
                          Khatib
                        </p>
                        <p className="text-sm font-bold text-white">
                          {currentPrayerData?.data?.khatib || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-teal-100 font-semibold uppercase tracking-wide mb-0.5">
                          Imam
                        </p>
                        <p className="text-sm font-bold text-white">
                          {currentPrayerData?.data?.imam || "-"}
                        </p>
                      </div>
                    </div>
                  ) : currentPrayer !== "SYURUQ" ? (
                    <div className="space-y-1">
                      <div>
                        <p className="text-[8px] text-teal-100 font-semibold uppercase tracking-wide mb-0.5">
                          Imam Utama
                        </p>
                        <p className="text-sm font-bold text-white">
                          {currentPrayerData?.data?.utama || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-teal-100 font-semibold uppercase tracking-wide mb-0.5">
                          Imam Badal
                        </p>
                        <p className="text-xs font-medium text-teal-50">
                          {currentPrayerData?.data?.badal || "-"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] font-medium text-teal-100 italic">
                      Waktu terbit matahari
                    </p>
                  )}
                </div>

                {/* NEXT IMAM - CARD SUBTLE */}
                <div className="bg-slate-100/70 border border-slate-200 rounded-lg p-2">
                  <h3 className="text-[10px] font-bold text-slate-500 tracking-wide uppercase mb-1">
                    Imam {nextPrayer} Berikutnya
                  </h3>
                  {isNextJumat ? (
                    <div className="space-y-0.5">
                      <div>
                        <p className="text-[8px] text-slate-500 font-semibold uppercase tracking-wide mb-0.5">
                          Khatib
                        </p>
                        <p className="text-xs font-semibold text-slate-700">
                          {nextPrayerData?.data?.khatib || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-500 font-semibold uppercase tracking-wide mb-0.5">
                          Imam
                        </p>
                        <p className="text-xs font-semibold text-slate-700">
                          {nextPrayerData?.data?.imam || "-"}
                        </p>
                      </div>
                    </div>
                  ) : nextPrayer !== "SYURUQ" ? (
                    <div className="space-y-0.5">
                      <div>
                        <p className="text-[8px] text-slate-500 font-semibold uppercase tracking-wide mb-0.5">
                          Imam Utama
                        </p>
                        <p className="text-xs font-semibold text-slate-700">
                          {nextPrayerData?.data?.utama || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-500 font-semibold uppercase tracking-wide mb-0.5">
                          Imam Badal
                        </p>
                        <p className="text-[10px] font-medium text-slate-600">
                          {nextPrayerData?.data?.badal || "-"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[9px] font-medium text-slate-500 italic">
                      Waktu terbit matahari
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* RUNNING TEXT - HADITS & AYAT */}
      <RunningText />

      {/* JADWAL SHOLAT - FOOTER */}
      <div className="flex items-center gap-3 py-2">
        {listShalat.map((sh, index) => (
          <React.Fragment key={sh.nama}>
            <div className="flex-1">
              <PrayerCard
                {...sh}
                isJumat={isJumat}
                isActive={sh.nama === currentPrayer}
                isNext={sh.nama === nextPrayer}
              />
            </div>

            {/* Arrow Indicator between current and next prayer */}
            {index < listShalat.length - 1 && sh.nama === currentPrayer && (
              <div className="flex items-center justify-center w-8">
                <div className="animate-arrow-slide flex gap-1">
                  <ChevronRight
                    className="text-teal-600"
                    size={20}
                    strokeWidth={3}
                  />
                  <ChevronRight
                    className="text-teal-600"
                    size={20}
                    strokeWidth={3}
                  />
                  <ChevronRight
                    className="text-teal-600"
                    size={20}
                    strokeWidth={3}
                  />
                </div>
              </div>
            )}

            {/* Empty space for other gaps */}
            {index < listShalat.length - 1 && sh.nama !== currentPrayer && (
              <div className="w-8"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {showSholatOverlay && (
        <SholatOverlay
          currentPrayer={currentPrayer}
          imamData={listShalat.find((s) => s.nama === currentPrayer)?.data}
          isJumat={isJumat && currentPrayer === "DZUHUR"}
          onClose={() => setShowSholatOverlay(false)}
        />
      )}
    </main>
  );
}
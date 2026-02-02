"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { BookOpen, ChevronRight } from "lucide-react";
import { playAdzanBeep, playIqamahWarning } from "@/lib/audio";
import { formatJamMenit, formatTanggalMasehi, formatTanggalHijriahFromAPI, } from "@/lib/formatter";
import { weeklySchedule } from "@/lib/weeklySchedule";
import { kajianSchedule } from "@/lib/kajianSchedule";
import PrayerCard from "@/components/PrayerCard";
import RunningText from "@/components/RunningText";
import SholatOverlay from "@/components/SholatOverlay";

export default function DisplayMasjid({ initialData }) {
  const [now, setNow] = useState(new Date());
  const [status, setStatus] = useState("IDLE"); 
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
    SUBUH: 23,
    DZUHUR: 15,
    ASHAR: 13,
    MAGHRIB: 13,
    ISYA: 13,
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
      const adzanEndTime = new Date(adzanStartTime.getTime() + 10 * 1000); // 3 menit (180 detik)
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
   
    if (
      nextPrayer === "SUBUH" &&
      currentPrayer === "ISYA" &&
      now.getHours() >= 19 &&
      jadwalBesok
    ) {
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
    <main className="h-screen w-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 text-slate-900 flex flex-col px-6 py-2 select-none overflow-hidden cursor-none">
      {/* HEADER */}
      <header className="flex justify-between items-center border-b-4 border-teal-700 pb-3 mb-3">
        <div className="flex gap-6 items-center">
          <Image
            src="/logo-muhammadiyah.png"
            alt="Logo"
            width={80}
            height={80}
            className="object-contain"
          />
          <div>
            <h1 className="text-4xl font-black tracking-tight text-teal-700 leading-none">
              MASJID AL-HUDA
            </h1>
            <p className="text-base font-bold text-slate-600 tracking-widest uppercase mt-1">
              Pimpinan Ranting Muhammadiyah Rambutan • Utankayu Utara
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-5xl font-black tabular-nums tracking-tight text-slate-900">
            {now.toLocaleTimeString("id-ID", { hour12: false })}
          </p>
          <p className="text-base font-bold text-slate-700 mt-1">
            {formatTanggalMasehi(now)}
          </p>
          <p className="text-base font-bold text-slate-700 mt-0.5">
            {formatTanggalHijriahFromAPI(initialData.hijri)}
          </p>

          {/* INDIKATOR AUDIO */}
          {!audioReady && (
            <p className="text-xs text-red-600 font-bold mt-1 animate-pulse">
              🔇 KLIK LAYAR UNTUK AKTIFKAN AUDIO
            </p>
          )}
          {audioReady && (
            <p className="text-xs text-green-600 font-bold mt-1">AUDIO AKTIF</p>
          )}
        </div>
      </header>

      {/* MAIN DISPLAY - VERTICAL LAYOUT (COUNTDOWN ATAS, INFO BAWAH) */}
      <div className="flex-1 mb-2 space-y-1.5">
        {/* COUNTDOWN - DIPERBESAR */}
        <div className="flex flex-col justify-center items-center bg-white rounded-xl p-2 shadow-lg border-2 border-teal-600">
          <p className="text-sm uppercase tracking-widest text-teal-700 font-black mb-2">
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
                    <p className="text-4xl font-black text-slate-900 tabular-nums leading-none">
                      - {countdown.hours.toString().padStart(2, "0")}
                    </p>
                    <p className="text-xs font-bold text-slate-600 mt-1 tracking-wider">
                      JAM
                    </p>
                  </div>
                  <p className="text-4xl font-black text-teal-600">:</p>
                </>
              )}
              <div className="text-center">
                <p className="text-4xl font-black text-slate-900 tabular-nums leading-none">
                  {countdown.minutes.toString().padStart(2, "0")}
                </p>
                <p className="text-xs font-bold text-slate-600 mt-1 tracking-wider">
                  MENIT
                </p>
              </div>
              <p className="text-4xl font-black text-teal-600">:</p>
              <div className="text-center">
                <p className="text-4xl font-black text-slate-900 tabular-nums leading-none">
                  {countdown.seconds.toString().padStart(2, "0")}
                </p>
                <p className="text-xs font-bold text-slate-600 mt-1 tracking-wider">
                  DETIK
                </p>
              </div>
            </div>
          )}
        </div>

        {/* INFO KAJIAN & IMAM - DIPERBESAR */}
        <div className="grid grid-cols-2 gap-4">
          {/* KAJIAN INFO */}
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-xl border-2 border-teal-100">
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen
                  className="text-teal-600 animate-pulse"
                  size={24}
                  strokeWidth={2.5}
                />
                <h3 className="text-xl font-black text-teal-800 tracking-wide uppercase font-serif">
                  Kajian Hari Ini
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-teal-600 font-bold uppercase tracking-wider mb-1.5">
                    Tema Kajian
                  </p>
                  <p className="text-lg font-bold text-teal-700 font-serif">
                    {todayKajian.tema}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t-2 border-teal-200/50">
                  <div>
                    <p className="text-sm text-slate-600 font-bold uppercase tracking-wide mb-1.5">
                      Waktu
                    </p>
                    <p className="text-lg font-bold text-teal-700 font-sans">
                      {todayKajian.waktu}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-bold uppercase tracking-wide mb-1.5">
                      Koordinator
                    </p>
                    <p className="text-lg font-bold text-teal-700 font-sans">
                      {todayKajian.Koordinator}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* IMAM INFO */}
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-xl border-2 border-teal-100">
            {(() => {
              const displayPrayer =
                status === "IDLE" ? nextPrayer : currentPrayer;
              const displayPrayerData = listShalat.find(
                (s) => s.nama === displayPrayer,
              );
              const isDisplayJumat = isJumat && displayPrayer === "DZUHUR";

              return (
                <div>
                  {/* IMAM CARD - DINAMIS */}
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 shadow-md border-2 border-teal-600">
                    <h3 className="text-base font-black text-teal-700 tracking-wide uppercase mb-3 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-teal-600 rounded-full animate-pulse"></span>
                      IMAM {displayPrayer}{" "}
                      {status === "IDLE" ? "BERIKUTNYA" : "SEKARANG"}
                    </h3>
                    {isDisplayJumat ? (
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-sm text-slate-500 font-bold uppercase tracking-wide mb-1">
                            Khatib
                          </p>
                          <p className="text-xl font-bold text-slate-900 font-sans">
                            {displayPrayerData?.data?.khatib || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-bold uppercase tracking-wide mb-1">
                            Imam
                          </p>
                          <p className="text-xl font-bold text-slate-900 font-sans">
                            {displayPrayerData?.data?.imam || "-"}
                          </p>
                        </div>
                      </div>
                    ) : displayPrayer !== "SYURUQ" ? (
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-sm text-slate-500 font-bold uppercase tracking-wide mb-1">
                            Imam Utama
                          </p>
                          <p className="text-xl font-bold text-slate-700 font-[family-name:var(--font-poppins)]">
                            {displayPrayerData?.data?.utama || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-bold uppercase tracking-wide mb-1">
                            Imam Badal
                          </p>
                          <p className="text-xl font-bold text-slate-700 font-[family-name:var(--font-poppins)]">
                            {displayPrayerData?.data?.badal || "-"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base font-medium text-slate-600 italic font-sans">
                        Waktu terbit matahari
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* RUNNING TEXT - HADITS & AYAT */}
      <RunningText />

      {/* JADWAL SHOLAT - FOOTER DIPERBESAR */}
      <div className="flex items-center gap-5 py-2 px-2">
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

            {/* Arrow Indicator - skip SYURUQ */}
            {/* Arrow - cuma muncul SEBELUM nextPrayer */}
            {index < listShalat.length - 1 &&
            listShalat[index + 1]?.nama === nextPrayer ? (
              <div className="flex items-center justify-center w-8">
                <div className="animate-arrow-slide flex gap-1">
                  <ChevronRight
                    className="text-teal-600"
                    size={24}
                    strokeWidth={3}
                  />
                  <ChevronRight
                    className="text-teal-600"
                    size={24}
                    strokeWidth={3}
                  />
                  <ChevronRight
                    className="text-teal-600"
                    size={24}
                    strokeWidth={3}
                  />
                </div>
              </div>
            ) : (
              <div className="w-8"></div>
            )}
            {/* Remove the old empty space logic */}

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

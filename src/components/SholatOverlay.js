"use client";
import React, { useEffect, useState } from 'react';

export default function SholatOverlay({ currentPrayer, imamData, isJumat, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log(' SholatOverlay MOUNTED');
    
    // Trigger animation
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      console.log(' Overlay visible');
    }, 50);
    
    // Auto close setelah 10 detik
    const closeTimer = setTimeout(() => {
      console.log(' 10 detik habis, mulai close...');
      setIsVisible(false);
      
      
      setTimeout(() => {
        console.log(' Panggil onClose');
        onClose();
      }, 300);
    }, 15000);

    return () => {
      console.log('🧹 Cleanup timers');
      clearTimeout(showTimer);
      clearTimeout(closeTimer);
    };
  }, []); 

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/95 via-teal-800/95 to-emerald-900/95"></div>

      {/* Main Content */}
      <div 
        className={`relative max-w-4xl mx-auto px-8 transform transition-all duration-500 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header - Sholat Dimulai */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-2xl px-8 py-4 shadow-2xl">
              <p className="text-sm font-bold text-teal-200 uppercase tracking-widest mb-2">
                Sholat Akan Segera Dimulai
              </p>
              <h1 className="text-6xl font-black text-white tracking-tight">
                SHOLAT {currentPrayer}
              </h1>
            </div>
          </div>
        </div>

        {/* Imam Info - Highlighted */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl mb-8 border-4 border-teal-400">
          <div className="text-center">
            <p className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-3">
              {isJumat ? 'Khatib & Imam' : 'Imam Yang Memimpin'}
            </p>
            
            {isJumat ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Khatib</p>
                  <p className="text-3xl font-black text-teal-700">
                    {imamData?.khatib || '-'}
                  </p>
                </div>
                <div className="border-t-2 border-slate-200 pt-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Imam</p>
                  <p className="text-3xl font-black text-teal-700">
                    {imamData?.imam || '-'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Imam Utama</p>
                  <p className="text-4xl font-black text-teal-700">
                    {imamData?.utama || '-'}
                  </p>
                </div>
                <div className="border-t-2 border-slate-200 pt-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Imam Badal</p>
                  <p className="text-xl font-bold text-slate-600">
                    {imamData?.badal || '-'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hadits - Luruskan Shaf */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-2 border-white/50">
          <div className="text-center space-y-4">
            {/* Hadits Arab */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-4 border-l-4 border-teal-600">
              <p className="text-2xl font-bold text-slate-800 leading-relaxed" style={{ fontFamily: 'Arial, sans-serif' }}>
                سَوُّوا صُفُوفَكُمْ فَإِنَّ تَسْوِيَةَ الصُّفُوفِ مِنْ تَمَامِ الصَّلاَةِ
              </p>
            </div>

            {/* Terjemah */}
            <div>
              <p className="text-lg font-bold text-teal-700 mb-2">
                "Luruskan shaf-shaf kalian, sesungguhnya meluruskan shaf termasuk kesempurnaan sholat."
              </p>
              <p className="text-sm font-semibold text-slate-500">
                (HR. Bukhari dan Muslim)
              </p>
            </div>

            {/* Additional Reminder */}
            <div className="pt-4 border-t-2 border-slate-200">
              <p className="text-base font-bold text-slate-700">
                 Rapatkan shaf dan luruskan barisan 
              </p>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                Tempelkan bahu ke bahu, tumit ke tumit
              </p>
            </div>
          </div>
        </div>

      
      </div>
    </div>
  );
}
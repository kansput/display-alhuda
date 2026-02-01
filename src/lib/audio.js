// Play MP3 audio file
export const playAudio = (filename) => {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio(`/sounds/${filename}`);
    audio.play().catch(e => console.error("Audio play error:", e));
  } catch (e) {
    console.error("Audio error:", e);
  }
};

// Audio untuk adzan masuk
export const playAdzanBeep = () => {
  playAudio('beep.mp3');
};

// Audio untuk warning iqamah
export const playIqamahWarning = () => {
  playAudio('beep.mp3');
};
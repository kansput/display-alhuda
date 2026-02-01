import { Inter, El_Messiri } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter" 
});

const elMessiri = El_Messiri({ 
  subsets: ["latin"], 
  weight: ["600", "700"],
  variable: "--font-el-messiri" 
});

// Penambahan Metadata
export const metadata = {
  title: "Smart Display - Masjid Al-Huda",
  description: "Sistem Informasi Digital Masjid Al-Huda Pimpinan Ranting Muhammadiyah",
};

export default function RootLayout({ children }) {
  return (

    <html lang="id" className={`${inter.variable} ${elMessiri.variable}`}>
  
      <body className="font-sans antialiased bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
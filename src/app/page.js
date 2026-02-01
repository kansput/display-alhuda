import { getJadwalMuhammadiyah } from '@/lib/prayerApi'; // Sesuaikan path-nya
import DisplayMasjid from '@/components/DisplayMasjid';

export default async function Page() {
  const dataApi = await getJadwalMuhammadiyah();

  if (!dataApi) {
    return <div className="p-20 text-center">Gagal memuat jadwal. Cek koneksi internet.</div>;
  }

  return (
    <DisplayMasjid initialData={dataApi} />
  );
}
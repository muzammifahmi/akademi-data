import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKelas extends Document {
  nama_kelas: string;
  kode_kelas: string;
  sekolah_id: mongoose.Types.ObjectId;
  guru_pengampu: mongoose.Types.ObjectId | null;
  status: 'Aktif' | 'Nonaktif';
  jumlah_siswa: number;
  createdAt: Date;
  updatedAt: Date;
}

const KelasSchema: Schema = new Schema({
  nama_kelas: { type: String, required: true },
  kode_kelas: { type: String, required: true, unique: true },
  sekolah_id: { type: Schema.Types.ObjectId, ref: 'Sekolah', required: true },
  guru_pengampu: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['Aktif', 'Nonaktif'], default: 'Aktif' },
  jumlah_siswa: { type: Number, default: 0 },
}, { timestamps: true });

const Kelas: Model<IKelas> = mongoose.models.Kelas || mongoose.model<IKelas>('Kelas', KelasSchema);

export default Kelas;

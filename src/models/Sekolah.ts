import mongoose from 'mongoose';

const SekolahSchema = new mongoose.Schema({
  npsn: { type: String, required: true, unique: true },
  nama_sekolah: { type: String, required: true },
  email_sekolah: { type: String, required: true },
  telepon: { type: String },
  alamat: { type: String, required: true },
  admin_nama: { type: String, required: true },
  admin_email: { type: String, required: true, unique: true },
  admin_password: { type: String, required: true },
}, { timestamps: true });

export const Sekolah = mongoose.models.Sekolah || mongoose.model('Sekolah', SekolahSchema);

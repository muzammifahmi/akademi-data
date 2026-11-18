import mongoose from 'mongoose';

const SekolahSchema = new mongoose.Schema({
  npsn: { type: String, required: true, unique: true },
  nama_sekolah: { type: String, required: true },
  email_sekolah: { type: String, required: true },
  telepon: { type: String },
  alamat: { type: String, required: true },
  token_sekolah: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  // Legacy optional fields for backward compatibility
  admin_nama: { type: String },
  admin_email: { type: String },
  admin_password: { type: String },
}, { timestamps: true });

if (mongoose.models.Sekolah) {
  delete mongoose.models.Sekolah;
}

export const Sekolah = mongoose.model('Sekolah', SekolahSchema);

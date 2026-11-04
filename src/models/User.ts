import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'guru', 'siswa'], required: true },
  sekolah_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sekolah' }, // Nullable untuk superadmin
  nisn_nip: { type: String }, // For Guru and Siswa
  kelas: { type: String }, // For Siswa
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);

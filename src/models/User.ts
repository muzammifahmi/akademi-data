import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'guru', 'siswa'], required: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  googleId: { type: String },
  avatar: { type: String },
  sekolah_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sekolah' },
  nisn_nip: { type: String },
  kelas: { type: String },
  sandbox_tables: { type: Array, default: [] },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' }
}, { timestamps: true });

if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model('User', userSchema);

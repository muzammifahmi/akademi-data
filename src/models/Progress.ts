import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProgress extends Document {
  user_id: mongoose.Types.ObjectId;
  modul_id: mongoose.Types.ObjectId;
  completed_subbabs: string[]; // Stores strings like "babIdx-subIdx"
  status: 'Sedang Dipelajari' | 'Selesai';
  completedAt?: Date;
  exercise_scores?: {
    subbab_id: string;
    score: number;
    answers: Record<string, string>;
    results?: Record<string, any>;
  }[];
}

const ProgressSchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  modul_id: { type: Schema.Types.ObjectId, ref: 'Modul', required: true },
  completed_subbabs: [{ type: String }],
  status: { type: String, enum: ['Sedang Dipelajari', 'Selesai'], default: 'Sedang Dipelajari' },
  completedAt: { type: Date },
  exercise_scores: [{
    subbab_id: { type: String },
    score: { type: Number },
    answers: { type: Schema.Types.Mixed },
    results: { type: Schema.Types.Mixed }
  }]
});

// Compound index to ensure a user can only have one progress record per module
ProgressSchema.index({ user_id: 1, modul_id: 1 }, { unique: true });

if (mongoose.models.Progress) {
  delete mongoose.models.Progress;
}

const Progress: Model<IProgress> = mongoose.model<IProgress>('Progress', ProgressSchema);

export default Progress;

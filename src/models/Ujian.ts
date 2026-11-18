import mongoose, { Schema, Document, Model } from "mongoose";

const OptionSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, default: "" },
  isCorrect: { type: Boolean, default: false },
});

const QuestionSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ["sql_query", "multiple_choice"], required: true },
  instruction: { type: String, default: "" },
  sqlAnswerKey: { type: String, default: "" },
  queryType: { type: String, default: "DQL" },
  targetTable: { type: String, default: "" },
  tables: { type: Array, default: [] },
  answerTables: { type: Array, default: [] },
  scoreWeight: { type: Number, default: 10 },
  options: [OptionSchema],
});

const SubmissionSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  score: { type: Number, default: 0 },
  answers: { type: Schema.Types.Mixed, default: {} },
  results: { type: Schema.Types.Mixed, default: {} },
  violations: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
});

export interface IUjian extends Document {
  judul: string;
  deskripsi: string;
  kelas_id: mongoose.Types.ObjectId;
  durasi_menit: number;
  jadwal: string;
  proctoring: boolean;
  status: "Draft" | "Terjadwal" | "Aktif" | "Selesai";
  questions: any[];
  submissions: any[];
  createdAt: Date;
  updatedAt: Date;
}

const UjianSchema: Schema = new Schema(
  {
    judul: { type: String, required: true },
    deskripsi: { type: String, default: "" },
    kelas_id: { type: Schema.Types.ObjectId, ref: "Kelas", required: true },
    durasi_menit: { type: Number, default: 60 },
    jadwal: { type: String, default: "" },
    proctoring: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["Draft", "Terjadwal", "Aktif", "Selesai"],
      default: "Aktif",
    },
    questions: [QuestionSchema],
    submissions: { type: [SubmissionSchema], default: [] },
  },
  { timestamps: true }
);

if (mongoose.models.Ujian) {
  delete mongoose.models.Ujian;
}

const Ujian: Model<IUjian> = mongoose.model<IUjian>("Ujian", UjianSchema);

export default Ujian;

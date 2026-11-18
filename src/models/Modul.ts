import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubBab {
  title: string;
  content: string;
  hasExercise: boolean;
  exerciseInstruction?: string;
  exerciseQuery?: string;
  exerciseScore?: number;
}

export interface IBab {
  title: string;
  subBabs: ISubBab[];
}

export interface IModul extends Document {
  judul: string;
  tujuan: string;
  kelas_id: mongoose.Types.ObjectId;
  babs: IBab[];
  status: 'Draft' | 'Terbit';
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, default: "" },
  isCorrect: { type: Boolean, default: false }
});

const QuestionSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['sql_query', 'multiple_choice'], required: true },
  instruction: { type: String, default: "" },
  sqlAnswerKey: { type: String, default: "" },
  queryType: { type: String, default: "DQL" },
  targetTable: { type: String, default: "" },
  tables: { type: Array, default: [] },
  answerTables: { type: Array, default: [] },
  scoreWeight: { type: Number, default: 10 },
  options: [OptionSchema]
});

const SubBabSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, default: "" },
  hasExercise: { type: Boolean, default: false },
  exerciseInstruction: { type: String, default: "" },
  exerciseQuery: { type: String, default: "" },
  exerciseScore: { type: Number, default: 10 },
  questions: [QuestionSchema]
});

const BabSchema = new Schema({
  title: { type: String, required: true },
  subBabs: [SubBabSchema]
});

const ModulSchema: Schema = new Schema({
  judul: { type: String, required: true },
  tujuan: { type: String, required: true },
  kelas_id: { type: Schema.Types.ObjectId, ref: 'Kelas', required: true },
  babs: [BabSchema],
  status: { type: String, enum: ['Draft', 'Terbit'], default: 'Draft' }
}, { timestamps: true });

if (mongoose.models.Modul) {
  delete mongoose.models.Modul;
}
const Modul: Model<IModul> = mongoose.model<IModul>('Modul', ModulSchema);

export default Modul;

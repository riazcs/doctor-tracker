import { Schema, model, Types, type InferSchemaType } from 'mongoose';
import { buildKeywords } from '../utils/search.js';

export const GENDERS = ['male', 'female', 'other'] as const;
export const PATIENT_STATUSES = ['stable', 'under_observation', 'critical', 'recovered'] as const;

const patientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    age: { type: Number, required: true, min: 0, max: 130 },
    gender: { type: String, enum: GENDERS, required: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    /** Medical condition / diagnosis, e.g. "Hypertension" */
    condition: { type: String, required: true, trim: true, maxlength: 80 },
    status: { type: String, enum: PATIENT_STATUSES, default: 'stable', required: true },
    admissionDate: { type: Date, required: true, default: () => new Date() },
    notes: { type: String, trim: true, maxlength: 1000 },
    doctor: { type: Types.ObjectId, ref: 'Doctor', required: true },
    keywords: { type: [String], select: false },
  },
  { timestamps: true },
);

patientSchema.pre('validate', function () {
  this.keywords = buildKeywords(this.name, this.email, this.phone, this.condition);
});

// Doctor's patient list, newest first
patientSchema.index({ doctor: 1, admissionDate: -1, _id: -1 });
// Default listing, date range filter, dashboard trend ($match on admissionDate)
patientSchema.index({ admissionDate: -1, _id: -1 });
// Equality filters + date sort (ESR)
patientSchema.index({ condition: 1, admissionDate: -1, _id: -1 });
patientSchema.index({ status: 1, admissionDate: -1, _id: -1 });
// Name sort
patientSchema.index({ name: 1, _id: 1 });
// Prefix search (multikey)
patientSchema.index({ keywords: 1 });

export type PatientDoc = InferSchemaType<typeof patientSchema>;
export const Patient = model('Patient', patientSchema);

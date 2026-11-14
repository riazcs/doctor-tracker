import { Schema, model, type InferSchemaType } from 'mongoose';
import { buildKeywords } from '../utils/search.js';

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    specialization: { type: String, required: true, trim: true, maxlength: 80 },
    hospital: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    /**
     * Denormalised counter, maintained with atomic $inc whenever a patient is
     * created / deleted / reassigned. Lets us sort doctors by workload and build
     * the "patients per doctor" chart without a $lookup over the patients collection.
     */
    patientCount: { type: Number, default: 0, min: 0 },
    keywords: { type: [String], select: false },
  },
  { timestamps: true },
);

doctorSchema.pre('validate', function () {
  this.keywords = buildKeywords(this.name, this.specialization, this.hospital, this.email, this.phone);
});

// Uniqueness + lookup by email
doctorSchema.index({ email: 1 }, { unique: true });
// Prefix search (multikey)
doctorSchema.index({ keywords: 1 });
// Default listing + date range filter on "joined" date
doctorSchema.index({ createdAt: -1, _id: -1 });
// Equality filter first, then sort/range field (ESR rule). _id is the pagination tiebreaker,
// so including it lets Mongo return pages straight from the index with no in-memory SORT.
doctorSchema.index({ specialization: 1, createdAt: -1, _id: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1, _id: -1 });
// "Most patients" sort and dashboard top-N
doctorSchema.index({ patientCount: -1, _id: -1 });
doctorSchema.index({ name: 1, _id: 1 });

export type DoctorDoc = InferSchemaType<typeof doctorSchema>;
export const Doctor = model('Doctor', doctorSchema);

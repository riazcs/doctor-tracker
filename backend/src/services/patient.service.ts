import type { QueryFilter } from 'mongoose';
import { Doctor } from '../models/Doctor.js';
import { Patient, type PatientDoc } from '../models/Patient.js';
import { ApiError } from '../utils/ApiError.js';
import { dateRangeFilter, paginate } from '../utils/pagination.js';
import { keywordFilter } from '../utils/search.js';
import { PATIENT_SORTS, type PatientListQuery } from '../validators/patient.validators.js';

const PUBLIC_FIELDS = 'name age gender phone email condition status admissionDate notes doctor createdAt updatedAt';
const DOCTOR_SUMMARY = { path: 'doctor', select: 'name specialization hospital' } as const;

type PatientInput = Partial<Omit<PatientDoc, 'admissionDate' | 'doctor'>> & {
  admissionDate?: string;
  doctor?: string;
};

const normalise = ({ admissionDate, email, ...rest }: PatientInput) => ({
  ...rest,
  ...(email !== undefined ? { email: email || undefined } : {}),
  ...(admissionDate ? { admissionDate: new Date(`${admissionDate}T12:00:00.000Z`) } : {}),
});

export async function listPatients(q: PatientListQuery) {
  const filter: QueryFilter<PatientDoc> = { ...keywordFilter(q.search) };
  if (q.condition) filter.condition = q.condition;
  if (q.status) filter.status = q.status;
  if (q.gender) filter.gender = q.gender;
  if (q.doctor) filter.doctor = q.doctor;
  const admitted = dateRangeFilter(q.from, q.to);
  if (admitted) filter.admissionDate = admitted;

  return paginate(Patient, filter, {
    page: q.page,
    limit: q.limit,
    sort: { ...PATIENT_SORTS[q.sort] },
    projection: PUBLIC_FIELDS,
    populate: DOCTOR_SUMMARY,
  });
}

export async function patientFacets() {
  const conditions = await Patient.distinct('condition'); // covered by {condition, admissionDate} index
  return { conditions: conditions.sort() };
}

export async function getPatient(id: string) {
  const patient = await Patient.findById(id, PUBLIC_FIELDS).populate(DOCTOR_SUMMARY).lean();
  if (!patient) throw ApiError.notFound('Patient');
  return patient;
}

export async function createPatientForDoctor(doctorId: string, data: PatientInput) {
  const doctorExists = await Doctor.exists({ _id: doctorId });
  if (!doctorExists) throw ApiError.notFound('Doctor');

  const patient = await Patient.create({ ...normalise(data), doctor: doctorId });
  await Doctor.updateOne({ _id: doctorId }, { $inc: { patientCount: 1 } });
  return getPatient(String(patient._id));
}

export async function updatePatient(id: string, data: PatientInput) {
  const patient = await Patient.findById(id);
  if (!patient) throw ApiError.notFound('Patient');

  const previousDoctor = String(patient.doctor);
  if (data.doctor && data.doctor !== previousDoctor) {
    const doctorExists = await Doctor.exists({ _id: data.doctor });
    if (!doctorExists) throw ApiError.badRequest('Selected doctor does not exist');
  }

  patient.set(normalise(data));
  await patient.save();

  if (data.doctor && data.doctor !== previousDoctor) {
    await Doctor.bulkWrite([
      { updateOne: { filter: { _id: previousDoctor }, update: { $inc: { patientCount: -1 } } } },
      { updateOne: { filter: { _id: data.doctor }, update: { $inc: { patientCount: 1 } } } },
    ]);
  }
  return getPatient(id);
}

export async function deletePatient(id: string, expectedDoctorId?: string) {
  const filter: QueryFilter<PatientDoc> = { _id: id };
  if (expectedDoctorId) filter.doctor = expectedDoctorId;

  const deleted = await Patient.findOneAndDelete(filter, { projection: { doctor: 1 } }).lean();
  if (!deleted) throw ApiError.notFound('Patient');
  await Doctor.updateOne({ _id: deleted.doctor, patientCount: { $gt: 0 } }, { $inc: { patientCount: -1 } });
}

import type { QueryFilter } from 'mongoose';
import { Doctor, type DoctorDoc } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { ApiError } from '../utils/ApiError.js';
import { dateRangeFilter, paginate } from '../utils/pagination.js';
import { keywordFilter } from '../utils/search.js';
import { DOCTOR_SORTS, type DoctorListQuery } from '../validators/doctor.validators.js';

const PUBLIC_FIELDS = 'name specialization hospital phone email patientCount createdAt updatedAt';

export async function listDoctors(q: DoctorListQuery) {
  const filter: QueryFilter<DoctorDoc> = { ...keywordFilter(q.search) };
  if (q.specialization) filter.specialization = q.specialization;
  if (q.hospital) filter.hospital = q.hospital;
  const created = dateRangeFilter(q.from, q.to);
  if (created) filter.createdAt = created;

  return paginate(Doctor, filter, {
    page: q.page,
    limit: q.limit,
    sort: { ...DOCTOR_SORTS[q.sort] },
    projection: PUBLIC_FIELDS,
  });
}

/** Distinct values for filter dropdowns — served straight from the {specialization}/{hospital} indexes. */
export async function doctorFacets() {
  const [specializations, hospitals] = await Promise.all([
    Doctor.distinct('specialization'),
    Doctor.distinct('hospital'),
  ]);
  return { specializations: specializations.sort(), hospitals: hospitals.sort() };
}

/** Lightweight id/name list for "assign to doctor" pickers. */
export async function doctorOptions() {
  return Doctor.find({}, 'name specialization').sort({ name: 1 }).lean();
}

export async function getDoctor(id: string) {
  const doctor = await Doctor.findById(id, PUBLIC_FIELDS).lean();
  if (!doctor) throw ApiError.notFound('Doctor');
  return doctor;
}

export async function createDoctor(data: Partial<DoctorDoc>) {
  const doctor = await Doctor.create(data);
  return getDoctor(String(doctor._id));
}

export async function updateDoctor(id: string, data: Partial<DoctorDoc>) {
  const doctor = await Doctor.findById(id);
  if (!doctor) throw ApiError.notFound('Doctor');
  doctor.set(data);
  await doctor.save(); // save() (not findByIdAndUpdate) so the keywords hook re-runs
  return getDoctor(id);
}

export async function deleteDoctor(id: string) {
  const hasPatients = await Patient.exists({ doctor: id });
  if (hasPatients) {
    throw ApiError.conflict('This doctor still has patients. Reassign or remove them first.');
  }
  const deleted = await Doctor.findByIdAndDelete(id);
  if (!deleted) throw ApiError.notFound('Doctor');
}

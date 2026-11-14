/**
 * Seeds demo users, doctors and ~2,500 patients spread over the last 14 months.
 * Usage: npm run seed            (wipes doctors/patients/users first)
 */
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Doctor } from '../src/models/Doctor.js';
import { Patient, GENDERS, PATIENT_STATUSES } from '../src/models/Patient.js';
import { User } from '../src/models/User.js';
import { buildKeywords } from '../src/utils/search.js';

// Deterministic PRNG so every seed produces the same demo data.
let state = 20261114;
const rand = () => ((state = (state * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!;
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const FIRST = ['Aisha', 'Rahim', 'Sophia', 'Liam', 'Nadia', 'Omar', 'Emma', 'Noah', 'Fatima', 'Lucas', 'Zara', 'Ethan', 'Maya', 'Arjun', 'Chloe', 'Daniel', 'Leila', 'Samuel', 'Hana', 'Yusuf', 'Grace', 'Ibrahim', 'Mia', 'Kenji', 'Sara', 'Mateo', 'Amara', 'Ravi', 'Elena', 'Tariq', 'Nora', 'Kabir'];
const LAST = ['Rahman', 'Chowdhury', 'Smith', 'Khan', 'Garcia', 'Patel', 'Nguyen', 'Hossain', 'Kim', 'Ahmed', 'Silva', 'Islam', 'Tanaka', 'Brown', 'Haque', 'Rossi', 'Begum', 'Lopez', 'Siddiqui', 'Wilson', 'Karim', 'Novak'];
const SPECIALIZATIONS = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Oncology', 'General Medicine', 'Endocrinology', 'Psychiatry', 'Gastroenterology'];
const HOSPITALS = ['City General Hospital', 'Green Valley Medical Center', 'St. Mary Clinic', 'Riverside Health', 'Northside Specialist Hospital', 'Lakeview Medical'];
const CONDITIONS: Record<string, string[]> = {
  Cardiology: ['Hypertension', 'Coronary Artery Disease', 'Arrhythmia', 'Heart Failure'],
  Neurology: ['Migraine', 'Epilepsy', 'Parkinson’s Disease', 'Stroke Recovery'],
  Pediatrics: ['Asthma', 'Bronchiolitis', 'Otitis Media', 'Fever'],
  Orthopedics: ['Fracture', 'Osteoarthritis', 'Back Pain', 'Sports Injury'],
  Dermatology: ['Eczema', 'Psoriasis', 'Acne', 'Dermatitis'],
  Oncology: ['Breast Cancer', 'Lung Cancer', 'Lymphoma', 'Leukemia'],
  'General Medicine': ['Influenza', 'Diabetes', 'Hypertension', 'Anemia'],
  Endocrinology: ['Diabetes', 'Hypothyroidism', 'Hyperthyroidism', 'Obesity'],
  Psychiatry: ['Depression', 'Anxiety Disorder', 'Bipolar Disorder', 'Insomnia'],
  Gastroenterology: ['GERD', 'IBS', 'Hepatitis', 'Gastritis'],
};
const STATUS_WEIGHTS: [(typeof PATIENT_STATUSES)[number], number][] = [
  ['stable', 0.45], ['under_observation', 0.22], ['recovered', 0.23], ['critical', 0.1],
];
const weightedStatus = () => {
  let r = rand();
  for (const [s, w] of STATUS_WEIGHTS) if ((r -= w) <= 0) return s;
  return 'stable';
};
const phone = () => `+880 17${int(10, 99)}-${int(100000, 999999)}`;
const DAY = 86_400_000;
const now = Date.now();

async function main() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Doctor.deleteMany({}), Patient.deleteMany({})]);
  await Promise.all([Doctor.syncIndexes(), Patient.syncIndexes(), User.syncIndexes()]);

  const [adminHash, viewerHash] = await Promise.all([bcrypt.hash('Admin@123', 12), bcrypt.hash('Viewer@123', 12)]);
  await User.insertMany([
    { name: 'Admin User', email: 'admin@doctortracker.dev', passwordHash: adminHash, role: 'admin' },
    { name: 'Read-only Viewer', email: 'viewer@doctortracker.dev', passwordHash: viewerHash, role: 'viewer' },
  ]);

  const usedEmails = new Set<string>();
  const doctors = Array.from({ length: 48 }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    const name = `Dr. ${first} ${last}`;
    let email = `${first}.${last}`.toLowerCase() + '@doctortracker.dev';
    if (usedEmails.has(email)) email = email.replace('@', `${i}@`);
    usedEmails.add(email);
    const specialization = SPECIALIZATIONS[i % SPECIALIZATIONS.length]!;
    const hospital = pick(HOSPITALS);
    const createdAt = new Date(now - int(5, 420) * DAY);
    const p = phone();
    return {
      name, specialization, hospital, phone: p, email, createdAt, updatedAt: createdAt,
      keywords: buildKeywords(name, specialization, hospital, email, p),
    };
  });
  const insertedDoctors = await Doctor.insertMany(doctors, { lean: true });

  const patients = [];
  for (const doc of insertedDoctors) {
    const workload = int(15, 90); // uneven so the per-doctor chart is interesting
    const doctorStart = doc.createdAt!.getTime();
    for (let j = 0; j < workload; j++) {
      const name = `${pick(FIRST)} ${pick(LAST)}`;
      const condition = pick(CONDITIONS[doc.specialization]!);
      // skew toward recent dates so the trend line grows
      const age = Math.pow(rand(), 1.6);
      const admissionDate = new Date(Math.max(doctorStart, now - age * 400 * DAY) - int(0, 12) * 3_600_000);
      const p = phone();
      const email = rand() > 0.3 ? `${name.replace(' ', '.').toLowerCase()}${int(1, 99)}@mail.com` : undefined;
      patients.push({
        name,
        age: doc.specialization === 'Pediatrics' ? int(0, 17) : int(18, 88),
        gender: pick(GENDERS.slice(0, 2).concat(rand() > 0.95 ? ['other'] : [])),
        phone: p,
        email,
        condition,
        status: weightedStatus(),
        admissionDate,
        doctor: doc._id,
        createdAt: admissionDate,
        updatedAt: admissionDate,
        keywords: buildKeywords(name, email, p, condition),
      });
    }
  }
  await Patient.insertMany(patients, { lean: true });

  // Recompute the denormalised counters from source of truth.
  const counts = await Patient.aggregate<{ _id: unknown; n: number }>([{ $group: { _id: '$doctor', n: { $sum: 1 } } }]);
  await Doctor.bulkWrite(counts.map((c) => ({ updateOne: { filter: { _id: c._id }, update: { $set: { patientCount: c.n } } } })));

  console.log(`Seeded 2 users, ${insertedDoctors.length} doctors, ${patients.length} patients.`);
  console.log('  admin@doctortracker.dev / Admin@123   (full access)');
  console.log('  viewer@doctortracker.dev / Viewer@123 (read-only)');
  await disconnectDB();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDB();
  process.exit(1);
});

import type { Request, Response } from 'express';
import * as doctorService from '../services/doctor.service.js';
import * as patientService from '../services/patient.service.js';
import { parse } from '../utils/validate.js';
import { idParams } from '../validators/common.js';
import { doctorBody, doctorListQuery, doctorUpdateBody } from '../validators/doctor.validators.js';
import { patientBody, patientListQuery } from '../validators/patient.validators.js';
import { z } from 'zod';
import { objectId } from '../validators/common.js';

export async function list(req: Request, res: Response) {
  const { items, meta } = await doctorService.listDoctors(parse(doctorListQuery, req.query));
  res.json({ data: items, meta });
}

export async function facets(_req: Request, res: Response) {
  res.set('Cache-Control', 'private, max-age=60');
  res.json({ data: await doctorService.doctorFacets() });
}

export async function options(_req: Request, res: Response) {
  res.json({ data: await doctorService.doctorOptions() });
}

export async function get(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await doctorService.getDoctor(id) });
}

export async function create(req: Request, res: Response) {
  const doctor = await doctorService.createDoctor(parse(doctorBody, req.body));
  res.status(201).location(`/api/doctors/${doctor._id}`).json({ data: doctor });
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await doctorService.updateDoctor(id, parse(doctorUpdateBody, req.body)) });
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await doctorService.deleteDoctor(id);
  res.status(204).end();
}

// ── Nested: /doctors/:id/patients ─────────────────────────────────────────────

export async function listPatients(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  const query = parse(patientListQuery, { ...req.query, doctor: id });
  const { items, meta } = await patientService.listPatients(query);
  res.json({ data: items, meta });
}

export async function addPatient(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  const patient = await patientService.createPatientForDoctor(id, parse(patientBody, req.body));
  res.status(201).location(`/api/patients/${patient._id}`).json({ data: patient });
}

export async function removePatient(req: Request, res: Response) {
  const { id, patientId } = parse(z.object({ id: objectId, patientId: objectId }), req.params);
  await patientService.deletePatient(patientId, id);
  res.status(204).end();
}

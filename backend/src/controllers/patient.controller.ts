import type { Request, Response } from 'express';
import * as patientService from '../services/patient.service.js';
import { parse } from '../utils/validate.js';
import { idParams } from '../validators/common.js';
import { patientListQuery, patientUpdateBody } from '../validators/patient.validators.js';

export async function list(req: Request, res: Response) {
  const { items, meta } = await patientService.listPatients(parse(patientListQuery, req.query));
  res.json({ data: items, meta });
}

export async function facets(_req: Request, res: Response) {
  res.set('Cache-Control', 'private, max-age=60');
  res.json({ data: await patientService.patientFacets() });
}

export async function get(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await patientService.getPatient(id) });
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await patientService.updatePatient(id, parse(patientUpdateBody, req.body)) });
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await patientService.deletePatient(id);
  res.status(204).end();
}

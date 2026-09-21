/**
 * In-memory mock of POST /api/v1/attendance.
 * Mirrors the validation rules we expect the real API to enforce,
 * so the suite can run locally and in CI without a backend.
 */
import http from 'node:http';

const PORT = Number(process.env.MOCK_PORT ?? 3000);
const VALID_STATUSES = ['PRESENT', 'ABSENT'];

type Participant = { participant_id?: unknown; status?: unknown };
type AttendancePayload = {
  mentor_id?: unknown;
  bootcamp_id?: unknown;
  session_date?: unknown;
  participants?: unknown;
};

function isValidDate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function validate(body: AttendancePayload): string[] {
  const errors: string[] = [];

  if (typeof body.mentor_id !== 'string' || !/^MNT-\d+$/.test(body.mentor_id)) {
    errors.push('mentor_id is required and must look like MNT-1234');
  }
  if (typeof body.bootcamp_id !== 'string' || body.bootcamp_id.trim() === '') {
    errors.push('bootcamp_id is required');
  }
  if (!isValidDate(body.session_date)) {
    errors.push('session_date must be a valid date in YYYY-MM-DD format');
  }

  if (!Array.isArray(body.participants)) {
    errors.push('participants must be an array');
    return errors;
  }
  if (body.participants.length === 0) {
    errors.push('participants must contain at least one record');
  }

  const seen = new Set<string>();
  (body.participants as Participant[]).forEach((p, i) => {
    if (typeof p?.participant_id !== 'string' || !/^YTH-\d+$/.test(p.participant_id)) {
      errors.push(`participants[${i}].participant_id must look like YTH-1234`);
    } else if (seen.has(p.participant_id)) {
      errors.push(`participants[${i}].participant_id ${p.participant_id} is duplicated`);
    } else {
      seen.add(p.participant_id);
    }
    if (typeof p?.status !== 'string' || !VALID_STATUSES.includes(p.status)) {
      errors.push(`participants[${i}].status must be one of ${VALID_STATUSES.join(', ')}`);
    }
  });

  return errors;
}

function send(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true });

  if (req.method !== 'POST' || req.url !== '/api/v1/attendance') {
    return send(res, 404, { success: false, message: 'Not found' });
  }

  let raw = '';
  req.on('data', (chunk) => (raw += chunk));
  req.on('end', () => {
    let body: AttendancePayload;
    try {
      body = JSON.parse(raw);
    } catch {
      return send(res, 400, { success: false, errors: ['Request body must be valid JSON'] });
    }

    const errors = validate(body ?? {});
    if (errors.length) return send(res, 400, { success: false, errors });

    const participants = body.participants as Participant[];
    return send(res, 201, {
      success: true,
      message: 'Attendance recorded',
      data: {
        mentor_id: body.mentor_id,
        bootcamp_id: body.bootcamp_id,
        session_date: body.session_date,
        recorded: participants.length,
      },
    });
  });
});

server.listen(PORT, () => console.log(`Mock attendance API listening on :${PORT}`));

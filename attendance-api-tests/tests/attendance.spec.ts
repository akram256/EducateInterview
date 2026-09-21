import { test, expect } from '@playwright/test';
import { AttendanceClient } from '../src/api/AttendanceClient';
import { buildAttendancePayload, without } from '../src/data/attendanceFactory';

let api: AttendanceClient;

test.beforeEach(({ request }) => {
  api = new AttendanceClient(request);
});

test.describe('POST /api/v1/attendance', () => {
  test.describe('Happy path', () => {
    test('records attendance for a valid payload', async () => {
      const payload = buildAttendancePayload();

      const res = await api.submit(payload);
      const body = await res.json();

      expect(res.status()).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        mentor_id: payload.mentor_id,
        bootcamp_id: payload.bootcamp_id,
        session_date: payload.session_date,
        recorded: payload.participants.length,
      });
    });
  });

  test.describe('Validation failures', () => {
    test('rejects a payload with no mentor_id', async () => {
      const res = await api.submit(without(buildAttendancePayload(), 'mentor_id'));
      const body = await res.json();

      expect(res.status()).toBe(400);
      expect(body.success).toBe(false);
      expect(body.errors).toContainEqual(expect.stringContaining('mentor_id'));
    });

    test('rejects an unknown status like "LATE"', async () => {
      const payload = buildAttendancePayload({
        participants: [{ participant_id: 'YTH-8821', status: 'LATE' }],
      });

      const res = await api.submit(payload);
      const body = await res.json();

      expect(res.status()).toBe(400);
      expect(body.errors).toContainEqual(expect.stringContaining('status'));
    });

    test('rejects an impossible session_date', async () => {
      const res = await api.submit(buildAttendancePayload({ session_date: '2026-02-30' }));

      expect(res.status()).toBe(400);
      expect((await res.json()).errors).toContainEqual(expect.stringContaining('session_date'));
    });

    test('rejects a malformed JSON body', async () => {
      const res = await api.submitRaw('{"mentor_id": "MNT-1042",');

      expect(res.status()).toBe(400);
    });
  });

  test.describe('Edge cases', () => {
    test('rejects an empty participants list', async () => {
      const res = await api.submit(buildAttendancePayload({ participants: [] }));
      const body = await res.json();

      expect(res.status()).toBe(400);
      expect(body.errors).toContainEqual(expect.stringContaining('at least one'));
    });

    test('rejects duplicate participant_ids in the same request', async () => {
      const payload = buildAttendancePayload({
        participants: [
          { participant_id: 'YTH-8821', status: 'PRESENT' },
          { participant_id: 'YTH-8821', status: 'ABSENT' },
        ],
      });

      const res = await api.submit(payload);
      const body = await res.json();

      expect(res.status()).toBe(400);
      expect(body.errors).toContainEqual(expect.stringContaining('duplicated'));
    });
  });
});

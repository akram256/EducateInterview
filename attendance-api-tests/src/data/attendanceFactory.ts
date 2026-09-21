/**
 * Test data builder. Every test starts from one known-good payload
 * and only changes the field it cares about, which keeps tests short
 * and makes it obvious what each one is actually testing.
 */
export type AttendanceStatus = 'PRESENT' | 'ABSENT';

export interface Participant {
  participant_id: string;
  status: AttendanceStatus | string;
}

export interface AttendancePayload {
  mentor_id: string;
  bootcamp_id: string;
  session_date: string;
  participants: Participant[];
}

export function buildAttendancePayload(
  overrides: Partial<AttendancePayload> = {},
): AttendancePayload {
  return {
    mentor_id: 'MNT-1042',
    bootcamp_id: 'KMP-2026-09',
    session_date: '2026-09-11',
    participants: [
      { participant_id: 'YTH-8821', status: 'PRESENT' },
      { participant_id: 'YTH-8822', status: 'ABSENT' },
    ],
    ...overrides,
  };
}

/** Returns a copy of the payload with the given top-level field removed. */
export function without<K extends keyof AttendancePayload>(
  payload: AttendancePayload,
  field: K,
): Omit<AttendancePayload, K> {
  const { [field]: _removed, ...rest } = payload;
  return rest;
}

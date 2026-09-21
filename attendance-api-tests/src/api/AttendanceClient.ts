/**
 * API Object Model: the API-testing equivalent of a Page Object.
 * Tests talk to this class instead of hard-coding URLs and request details,
 * so if the endpoint or auth changes we fix it in one place.
 */
import { APIRequestContext, APIResponse } from '@playwright/test';
import { AttendancePayload } from '../data/attendanceFactory';

export class AttendanceClient {
  static readonly PATH = '/api/v1/attendance';

  constructor(private readonly request: APIRequestContext) {}

  submit(payload: AttendancePayload | Record<string, unknown>): Promise<APIResponse> {
    return this.request.post(AttendanceClient.PATH, { data: payload });
  }

  submitRaw(body: string): Promise<APIResponse> {
    return this.request.post(AttendanceClient.PATH, { data: body });
  }
}

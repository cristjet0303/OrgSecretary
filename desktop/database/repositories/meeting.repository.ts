import { getDatabase } from '../connection';

export class MeetingRepository {
  static list(filter?: any) {
    const db = getDatabase();
    let query = 'SELECT * FROM meetings WHERE 1=1';
    const params: any[] = [];

    if (filter?.status && filter.status !== 'All') {
      query += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter?.searchQuery) {
      query += ' AND (title LIKE ? OR chairperson LIKE ?)';
      params.push(`%${filter.searchQuery}%`, `%${filter.searchQuery}%`);
    }

    query += ' ORDER BY meeting_date ASC';
    const rows = db.prepare(query).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      meetingType: r.meeting_type,
      meetingNumber: r.meeting_number,
      meetingDate: r.meeting_date,
      startTime: r.start_time,
      endTime: r.end_time,
      venue: r.venue,
      chairperson: r.chairperson,
      secretary: r.secretary,
      purpose: r.purpose,
      status: r.status,
      relatedMeetingId: r.related_meeting_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  static getById(id: string) {
    const db = getDatabase();
    const r = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      meetingType: r.meeting_type,
      meetingNumber: r.meeting_number,
      meetingDate: r.meeting_date,
      startTime: r.start_time,
      endTime: r.end_time,
      venue: r.venue,
      chairperson: r.chairperson,
      secretary: r.secretary,
      purpose: r.purpose,
      status: r.status,
      relatedMeetingId: r.related_meeting_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  static create(m: any) {
    const db = getDatabase();
    const id = 'meeting-' + Date.now();
    const now = new Date().toISOString();

    db.prepare(
      `
      INSERT INTO meetings (id, title, meeting_type, meeting_number, meeting_date, start_time, end_time, venue, chairperson, secretary, purpose, status, related_meeting_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      id,
      m.title,
      m.meetingType,
      m.meetingNumber || null,
      m.meetingDate,
      m.startTime || null,
      m.endTime || null,
      m.venue || null,
      m.chairperson || null,
      m.secretary || null,
      m.purpose || null,
      m.status || 'Planned',
      m.relatedMeetingId || null,
      now,
      now,
    );

    return this.getById(id);
  }

  static update(id: string, m: any) {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) throw new Error(`Meeting with id ${id} not found`);

    const updated = { ...existing, ...m };
    const now = new Date().toISOString();

    db.prepare(
      `
      UPDATE meetings
      SET title = ?, meeting_type = ?, meeting_number = ?, meeting_date = ?, start_time = ?, end_time = ?, venue = ?, chairperson = ?, secretary = ?, purpose = ?, status = ?, updated_at = ?
      WHERE id = ?
    `,
    ).run(
      updated.title,
      updated.meetingType,
      updated.meetingNumber || null,
      updated.meetingDate,
      updated.startTime || null,
      updated.endTime || null,
      updated.venue || null,
      updated.chairperson || null,
      updated.secretary || null,
      updated.purpose || null,
      updated.status,
      now,
      id,
    );

    return this.getById(id);
  }

  static delete(id: string) {
    const db = getDatabase();
    const res = db.prepare('DELETE FROM meetings WHERE id = ?').run(id);
    return res.changes > 0;
  }
}

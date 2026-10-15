import { getDatabase } from '../connection';

export class OrganizationRepository {
  static get() {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM organizations LIMIT 1').get() as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      acronym: row.acronym,
      address: row.address,
      contactDetails: row.contact_details,
      logoPath: row.logo_path,
      headerLines: row.header_lines_json ? JSON.parse(row.header_lines_json) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static save(org: any) {
    const db = getDatabase();
    const existing = this.get();
    const now = new Date().toISOString();
    const id = org.id || existing?.id || 'org-' + Date.now();

    if (existing) {
      db.prepare(
        `
        UPDATE organizations
        SET name = ?, acronym = ?, address = ?, contact_details = ?, logo_path = ?, header_lines_json = ?, updated_at = ?
        WHERE id = ?
      `,
      ).run(
        org.name,
        org.acronym || null,
        org.address || null,
        org.contactDetails || null,
        org.logoPath || null,
        JSON.stringify(org.headerLines || []),
        now,
        id,
      );
    } else {
      db.prepare(
        `
        INSERT INTO organizations (id, name, acronym, address, contact_details, logo_path, header_lines_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        id,
        org.name,
        org.acronym || null,
        org.address || null,
        org.contactDetails || null,
        org.logoPath || null,
        JSON.stringify(org.headerLines || []),
        now,
        now,
      );
    }
    return this.get();
  }
}

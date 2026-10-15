import { ipcMain } from 'electron';
import { OrganizationRepository } from '../database/repositories/organization.repository';
import { MeetingRepository } from '../database/repositories/meeting.repository';
import { getDatabase } from '../database/connection';

export function registerIpcHandlers(): void {
  ipcMain.handle('localApi:getOrganization', () => OrganizationRepository.get());
  ipcMain.handle('localApi:saveOrganization', (_, org) => OrganizationRepository.save(org));
  ipcMain.handle('localApi:getMeetings', (_, filter) => MeetingRepository.list(filter));
  ipcMain.handle('localApi:getMeetingById', (_, id) => MeetingRepository.getById(id));
  ipcMain.handle('localApi:createMeeting', (_, meeting) => MeetingRepository.create(meeting));
  ipcMain.handle('localApi:updateMeeting', (_, id, meeting) =>
    MeetingRepository.update(id, meeting),
  );
  ipcMain.handle('localApi:deleteMeeting', (_, id) => MeetingRepository.delete(id));
  ipcMain.handle('localApi:getDatabaseStatus', () => {
    const db = getDatabase();
    const tables = db
      .prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table'")
      .get() as any;
    return {
      connected: true,
      type: 'electron-sqlite',
      tablesCount: tables?.count || 0,
    };
  });
}

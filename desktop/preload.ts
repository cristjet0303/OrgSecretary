import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('localApi', {
  getOrganization: () => ipcRenderer.invoke('localApi:getOrganization'),
  saveOrganization: (org: any) =>
    ipcRenderer.invoke('localApi:saveOrganization', org),
  getMeetings: (filter: any) =>
    ipcRenderer.invoke('localApi:getMeetings', filter),
  getMeetingById: (id: string) =>
    ipcRenderer.invoke('localApi:getMeetingById', id),
  createMeeting: (m: any) => ipcRenderer.invoke('localApi:createMeeting', m),
  updateMeeting: (id: string, m: any) =>
    ipcRenderer.invoke('localApi:updateMeeting', id, m),
  deleteMeeting: (id: string) =>
    ipcRenderer.invoke('localApi:deleteMeeting', id),
  getDatabaseStatus: () => ipcRenderer.invoke('localApi:getDatabaseStatus'),
});

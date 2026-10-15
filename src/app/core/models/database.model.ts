export interface DatabaseStatus {
  connected: boolean;
  type: 'electron-sqlite' | 'web-storage';
  filePath?: string;
  tablesCount: number;
}

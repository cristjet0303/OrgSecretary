export interface Organization {
  id: string;
  name: string;
  acronym?: string;
  address?: string;
  contactDetails?: string;
  logoPath?: string;
  headerLines?: string[];
  createdAt: string;
  updatedAt: string;
}

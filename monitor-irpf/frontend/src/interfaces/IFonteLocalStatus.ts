export interface FonteLocalStatus {
  configured: boolean;
  ok?: boolean;
  message?: string;
  tables?: { name: string }[];
}
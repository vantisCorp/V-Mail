// Email Labels/Tags Types

export interface Label {
  id: string;
  name: string;
  color: string; // hex color code
  description?: string;
  createdAt: string;
  emailCount?: number;
}

export interface LabelStats {
  totalLabels: number;
  totalLabeledEmails: number;
}

export type LabelAction =
  | 'add'
  | 'remove'
  | 'toggle';

export interface LabeledEmail {
  emailId: string;
  labelId: string;
  appliedAt: string;
}

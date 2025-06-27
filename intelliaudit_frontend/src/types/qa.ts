export enum QASeverity {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum QACategory {
  EQUIPMENT = 'equipment',
  ENERGY_USE = 'energy_use',
  CALCULATIONS = 'calculations',
  DATA_QUALITY = 'data_quality',
  ASSUMPTIONS = 'assumptions'
}

export enum QAStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export interface QAComment {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  timestamp: string;
  attachments?: {
    url: string;
    type: string;
    name: string;
  }[];
}

export interface QAFlag {
  id: string;
  title: string;
  description: string;
  severity: QASeverity;
  category: QACategory;
  status: QAStatus;
  impact?: number;
  comments?: QAComment[];
  relatedData?: {
    type: string;
    id?: string;
    value?: any;
    expectedRange?: {
      min: number;
      max: number;
      unit?: string;
    };
  };
  suggestedAction?: string;
  assignedTo?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'USER' | 'POLICE' | 'NGO' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: string;
  title: string;
  description: string;
  missingPersonName: string;
  age?: number;
  gender?: string;
  lastSeenLocation?: string;
  lastSeenDate?: string;
  status: 'ACTIVE' | 'FOUND' | 'CLOSED' | 'ARCHIVED';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Tip {
  id: string;
  content: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  isAnonymous: boolean;
  isVerified: boolean;
  createdAt: string;
  caseId: string;
  userId?: string;
}

export interface Volunteer {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  userId: string;
  caseId: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  caseId: string;
  leaderId: string;
  createdAt: string;
  case?: {
    id: string;
    title: string;
  };
  leader?: {
    id: string;
    name: string;
  };
  members?: Array<{
    role: string;
    joinedAt: string;
  }>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'TIP_RECEIVED' | 'CASE_UPDATE' | 'VOLUNTEER_JOINED' | 'CASE_RESOLVED' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  userId: string;
  caseId?: string;
}

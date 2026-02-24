// localStorage utilities - Session management & utility functions only
// All data operations have been moved to supabase-storage.ts

import { HospitalSession, PatientSession, AdminSession } from '@/types/healthcare';

const STORAGE_KEYS = {
  HOSPITAL_SESSION: 'healthcare_hospital_session',
  PATIENT_SESSION: 'healthcare_patient_session',
  ADMIN_SESSION: 'healthcare_admin_session',
} as const;

// Hospital session functions
export function getHospitalSession(): HospitalSession | null {
  const data = localStorage.getItem(STORAGE_KEYS.HOSPITAL_SESSION);
  return data ? JSON.parse(data) : null;
}

export function setHospitalSession(session: HospitalSession): void {
  localStorage.setItem(STORAGE_KEYS.HOSPITAL_SESSION, JSON.stringify(session));
}

export function clearHospitalSession(): void {
  localStorage.removeItem(STORAGE_KEYS.HOSPITAL_SESSION);
}

// Patient session functions
export function getPatientSession(): PatientSession | null {
  const data = localStorage.getItem(STORAGE_KEYS.PATIENT_SESSION);
  return data ? JSON.parse(data) : null;
}

export function setPatientSession(session: PatientSession): void {
  localStorage.setItem(STORAGE_KEYS.PATIENT_SESSION, JSON.stringify(session));
}

export function clearPatientSession(): void {
  localStorage.removeItem(STORAGE_KEYS.PATIENT_SESSION);
}

// Admin session functions
export function getAdminSession(): AdminSession | null {
  const data = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
  return data ? JSON.parse(data) : null;
}

export function setAdminSession(session: AdminSession): void {
  localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
}

export function clearAdminSession(): void {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
}

// Utility functions
export function generateBookingId(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `BK-${randomNum}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

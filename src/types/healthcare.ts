// Healthcare Appointment System Types

export interface Hospital {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  approved: boolean;
  createdAt: string;
}

export interface Feedback {
  id: string;
  bookingId: string;
  doctorId: string;
  hospitalId: string;
  patientId: string;
  rating: number; // 1-5
  reviewText: string;
  createdAt: string;
}

export interface DoctorWithRating extends Doctor {
  averageRating?: number;
  totalReviews?: number;
}

export interface AdminSession {
  isLoggedIn: boolean;
}

// Default admin credentials (for demo)
export const ADMIN_CREDENTIALS = {
  email: 'admin@healthcare.com',
  password: 'admin123',
} as const;

export interface Doctor {
  id: string;
  hospitalId: string;
  name: string;
  specialization: string;
  experience: number;
  consultationFee: number;
  availability: DoctorAvailability[];
}

export interface DoctorAvailability {
  date: string; // ISO date string
  timeSlots: string[]; // Array of time slots like "09:00 AM", "10:00 AM"
}

export interface Booking {
  id: string;
  bookingId: string; // Human readable ID like "BK-12345"
  hospitalId: string;
  doctorId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'male' | 'female' | 'other';
  patientPhone: string;
  problemDescription: string;
  date: string;
  timeSlot: string;
  amountPaid: number;
  status: 'pending' | 'appeared' | 'not-appeared';
  rescheduleCount: number;
  createdAt: string;
}

export interface HospitalSession {
  hospitalId: string;
  isLoggedIn: boolean;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  password: string;
  createdAt: string;
}

export interface PatientSession {
  patientId: string;
  phone: string;
  name: string;
  isLoggedIn: boolean;
}

// Specializations list
export const SPECIALIZATIONS = [
  'Cardiology',
  'Dermatology',
  'ENT (Ear, Nose, Throat)',
  'Gastroenterology',
  'General Medicine',
  'Gynecology',
  'Neurology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Urology',
] as const;

export type Specialization = typeof SPECIALIZATIONS[number];

// Time slots for doctor availability
export const TIME_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
] as const;

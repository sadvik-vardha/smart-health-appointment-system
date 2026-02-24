// Supabase database operations for Healthcare Appointment System
import { supabase } from '@/integrations/supabase/client';
import { Hospital, Doctor, DoctorAvailability, Booking, Patient, Feedback } from '@/types/healthcare';

// ==================== Mappers ====================

function mapHospital(row: any): Hospital {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    password: row.password,
    approved: row.approved,
    createdAt: row.created_at,
  };
}

function mapDoctor(row: any): Doctor {
  const availability: DoctorAvailability[] = (row.doctor_availability || []).map((a: any) => ({
    date: a.date,
    timeSlots: a.time_slots || [],
  }));

  return {
    id: row.id,
    hospitalId: row.hospital_id,
    name: row.name,
    specialization: row.specialization,
    experience: row.experience,
    consultationFee: Number(row.consultation_fee),
    availability,
  };
}

function mapBooking(row: any): Booking {
  return {
    id: row.id,
    bookingId: row.booking_id,
    hospitalId: row.hospital_id,
    doctorId: row.doctor_id,
    patientName: row.patient_name,
    patientAge: row.patient_age,
    patientGender: row.patient_gender,
    patientPhone: row.patient_phone,
    problemDescription: row.problem_description || '',
    date: row.date,
    timeSlot: row.time_slot,
    amountPaid: Number(row.amount_paid),
    status: row.status,
    rescheduleCount: row.reschedule_count,
    createdAt: row.created_at,
  };
}

function mapPatient(row: any): Patient {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    password: row.password,
    createdAt: row.created_at,
  };
}

function mapFeedback(row: any): Feedback {
  return {
    id: row.id,
    bookingId: row.booking_id,
    doctorId: row.doctor_id,
    hospitalId: row.hospital_id,
    patientId: row.patient_id,
    rating: row.rating,
    reviewText: row.review_text || '',
    createdAt: row.created_at,
  };
}

// ==================== Hospital Functions ====================

export async function getHospitals(): Promise<Hospital[]> {
  const { data, error } = await supabase.from('hospitals').select('*');
  if (error) { console.error('getHospitals error:', error); return []; }
  return (data || []).map(mapHospital);
}

export async function saveHospital(hospital: Hospital): Promise<void> {
  const { error } = await supabase.from('hospitals').insert({
    id: hospital.id,
    name: hospital.name,
    email: hospital.email,
    phone: hospital.phone,
    address: hospital.address,
    password: hospital.password,
    approved: hospital.approved,
    created_at: hospital.createdAt,
  });
  if (error) console.error('saveHospital error:', error);
}

export async function getHospitalByEmail(email: string): Promise<Hospital | undefined> {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .ilike('email', email)
    .maybeSingle();
  if (error) { console.error('getHospitalByEmail error:', error); return undefined; }
  return data ? mapHospital(data) : undefined;
}

export async function getHospitalById(id: string): Promise<Hospital | undefined> {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.error('getHospitalById error:', error); return undefined; }
  return data ? mapHospital(data) : undefined;
}

export async function approveHospital(hospitalId: string): Promise<void> {
  const { error } = await supabase
    .from('hospitals')
    .update({ approved: true })
    .eq('id', hospitalId);
  if (error) console.error('approveHospital error:', error);
}

export async function rejectHospital(hospitalId: string): Promise<void> {
  const { error } = await supabase
    .from('hospitals')
    .delete()
    .eq('id', hospitalId);
  if (error) console.error('rejectHospital error:', error);
}

export async function getApprovedHospitals(): Promise<Hospital[]> {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('approved', true);
  if (error) { console.error('getApprovedHospitals error:', error); return []; }
  return (data || []).map(mapHospital);
}

export async function getUniqueLocations(): Promise<string[]> {
  const hospitals = await getHospitals();
  const locations = hospitals.map(h => h.address);
  return [...new Set(locations)];
}

// ==================== Doctor Functions ====================

export async function getDoctors(): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*, doctor_availability(*)');
  if (error) { console.error('getDoctors error:', error); return []; }
  return (data || []).map(mapDoctor);
}

export async function getDoctorsByHospital(hospitalId: string): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*, doctor_availability(*)')
    .eq('hospital_id', hospitalId);
  if (error) { console.error('getDoctorsByHospital error:', error); return []; }
  return (data || []).map(mapDoctor);
}

export async function getDoctorById(id: string): Promise<Doctor | undefined> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*, doctor_availability(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.error('getDoctorById error:', error); return undefined; }
  return data ? mapDoctor(data) : undefined;
}

export async function getDoctorsBySpecialization(specialization: string): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*, doctor_availability(*)')
    .eq('specialization', specialization);
  if (error) { console.error('getDoctorsBySpecialization error:', error); return []; }
  return (data || []).map(mapDoctor);
}

export async function saveDoctor(doctor: Doctor): Promise<void> {
  const { error: doctorError } = await supabase.from('doctors').insert({
    id: doctor.id,
    hospital_id: doctor.hospitalId,
    name: doctor.name,
    specialization: doctor.specialization,
    experience: doctor.experience,
    consultation_fee: doctor.consultationFee,
  });
  if (doctorError) { console.error('saveDoctor error:', doctorError); return; }

  if (doctor.availability.length > 0) {
    const availabilityRows = doctor.availability.map(a => ({
      id: `${doctor.id}-${a.date}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      doctor_id: doctor.id,
      date: a.date,
      time_slots: a.timeSlots,
    }));
    const { error: availError } = await supabase.from('doctor_availability').insert(availabilityRows);
    if (availError) console.error('saveDoctor availability error:', availError);
  }
}

export async function deleteDoctor(doctorId: string): Promise<void> {
  const { error } = await supabase.from('doctors').delete().eq('id', doctorId);
  if (error) console.error('deleteDoctor error:', error);
}

// ==================== Booking Functions ====================

export async function getBookings(): Promise<Booking[]> {
  const { data, error } = await supabase.from('bookings').select('*');
  if (error) { console.error('getBookings error:', error); return []; }
  return (data || []).map(mapBooking);
}

export async function getBookingsByHospital(hospitalId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('hospital_id', hospitalId);
  if (error) { console.error('getBookingsByHospital error:', error); return []; }
  return (data || []).map(mapBooking);
}

export async function getBookingsByPatientPhone(phone: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('patient_phone', phone);
  if (error) { console.error('getBookingsByPatientPhone error:', error); return []; }
  return (data || []).map(mapBooking);
}

export async function getBookingById(bookingId: string): Promise<Booking | undefined> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .or(`booking_id.eq.${bookingId},id.eq.${bookingId}`)
    .maybeSingle();
  if (error) { console.error('getBookingById error:', error); return undefined; }
  return data ? mapBooking(data) : undefined;
}

export async function saveBooking(booking: Booking): Promise<void> {
  const { error } = await supabase.from('bookings').insert({
    id: booking.id,
    booking_id: booking.bookingId,
    hospital_id: booking.hospitalId,
    doctor_id: booking.doctorId,
    patient_name: booking.patientName,
    patient_age: booking.patientAge,
    patient_gender: booking.patientGender,
    patient_phone: booking.patientPhone,
    problem_description: booking.problemDescription,
    date: booking.date,
    time_slot: booking.timeSlot,
    amount_paid: booking.amountPaid,
    status: booking.status,
    reschedule_count: booking.rescheduleCount,
    created_at: booking.createdAt,
  });
  if (error) console.error('saveBooking error:', error);
}

export async function updateBooking(updatedBooking: Booking): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({
      date: updatedBooking.date,
      time_slot: updatedBooking.timeSlot,
      status: updatedBooking.status,
      reschedule_count: updatedBooking.rescheduleCount,
    })
    .eq('id', updatedBooking.id);
  if (error) console.error('updateBooking error:', error);
}

// ==================== Patient Functions ====================

export async function savePatient(patient: Patient): Promise<void> {
  const { error } = await supabase.from('patients').insert({
    id: patient.id,
    name: patient.name,
    phone: patient.phone,
    password: patient.password,
    created_at: patient.createdAt,
  });
  if (error) console.error('savePatient error:', error);
}

export async function getPatientByPhone(phone: string): Promise<Patient | undefined> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();
  if (error) { console.error('getPatientByPhone error:', error); return undefined; }
  return data ? mapPatient(data) : undefined;
}

export async function getPatientById(id: string): Promise<Patient | undefined> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.error('getPatientById error:', error); return undefined; }
  return data ? mapPatient(data) : undefined;
}

// ==================== Feedback Functions ====================

export async function saveFeedback(feedback: Feedback): Promise<void> {
  const { error } = await supabase.from('feedback').insert({
    id: feedback.id,
    booking_id: feedback.bookingId,
    doctor_id: feedback.doctorId,
    hospital_id: feedback.hospitalId,
    patient_id: feedback.patientId,
    rating: feedback.rating,
    review_text: feedback.reviewText,
    created_at: feedback.createdAt,
  });
  if (error) console.error('saveFeedback error:', error);
}

export async function getFeedbackByDoctor(doctorId: string): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('doctor_id', doctorId);
  if (error) { console.error('getFeedbackByDoctor error:', error); return []; }
  return (data || []).map(mapFeedback);
}

export async function getFeedbackByBookingId(bookingId: string): Promise<Feedback | undefined> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();
  if (error) { console.error('getFeedbackByBookingId error:', error); return undefined; }
  return data ? mapFeedback(data) : undefined;
}

export async function getFeedbackByHospital(hospitalId: string): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('hospital_id', hospitalId);
  if (error) { console.error('getFeedbackByHospital error:', error); return []; }
  return (data || []).map(mapFeedback);
}

// ==================== Slot Availability ====================

export async function isSlotAvailable(doctorId: string, date: string, timeSlot: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('date', date)
    .eq('time_slot', timeSlot)
    .neq('status', 'not-appeared')
    .maybeSingle();
  if (error) { console.error('isSlotAvailable error:', error); return false; }
  return !data;
}

export async function getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
  const doctor = await getDoctorById(doctorId);
  if (!doctor) return [];

  const availability = doctor.availability.find(a => a.date === date);
  if (!availability) return [];

  const { data: bookedData } = await supabase
    .from('bookings')
    .select('time_slot')
    .eq('doctor_id', doctorId)
    .eq('date', date)
    .neq('status', 'not-appeared');

  const bookedSlots = (bookedData || []).map(b => b.time_slot);
  return availability.timeSlots.filter(slot => !bookedSlots.includes(slot));
}

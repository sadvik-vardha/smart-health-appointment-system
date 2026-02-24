

# Database Setup with Supabase (Lovable Cloud)

## The Problem
Right now, all data (hospitals, doctors, bookings, patients, feedback) is stored in your browser's localStorage. This means:
- Data is lost when you clear your browser
- Data cannot be shared between different users or devices
- If you share the app link, the other person sees empty data

## The Solution
We'll set up **Lovable Cloud** (powered by Supabase) as a real database so that all data is shared and persistent across all users and devices.

## What Will Change

### Step 1: Enable Lovable Cloud
- Enable the cloud database for your project
- This gives you a real database that stores data on a server, not in the browser

### Step 2: Create Database Tables
We'll create these tables to mirror your current data structure:

| Table | Purpose |
|-------|---------|
| hospitals | Store hospital registrations, approval status |
| doctors | Store doctor profiles linked to hospitals |
| doctor_availability | Store available dates and time slots per doctor |
| patients | Store patient accounts |
| bookings | Store all appointment bookings |
| feedback | Store ratings and reviews |

### Step 3: Set Up Access Rules
Open access policies so all users can read/write data (matching your current localStorage behavior where anyone can access everything):
- All tables will be readable and writable by anyone (since the app handles its own login logic via phone/email + password, not Supabase Auth)

### Step 4: Create a Supabase Data Layer
Create a new file `src/lib/supabase-storage.ts` that replaces all localStorage calls with Supabase database calls. The function names stay the same so all your pages work without major rewrites.

### Step 5: Update All Pages to Use Supabase
Every page that currently reads/writes data will be updated:

| Page | What Changes |
|------|-------------|
| Hospital Register | Saves to database instead of localStorage |
| Hospital Login | Queries database for credentials |
| Hospital Dashboard | Fetches stats from database |
| Add Doctors | Saves/deletes doctors in database |
| Patient Bookings (Hospital) | Reads/updates bookings from database |
| Patient Register | Saves to database |
| Patient Login | Queries database for credentials |
| Book Appointment | Saves booking to database |
| My Bookings | Fetches bookings from database |
| Reschedule | Updates booking in database |
| Admin Dashboard | Reads/approves/rejects hospitals in database |
| Feedback Form | Saves feedback to database |
| Doctor Reviews | Reads feedback from database |

### Step 6: Keep Session in localStorage
Login sessions (who is currently logged in on this device) will still use localStorage -- this is the correct behavior since sessions are device-specific.

---

## Technical Details

### Database Schema (SQL Migration)

```sql
-- Hospitals table
CREATE TABLE hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  password TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors table
CREATE TABLE doctors (
  id TEXT PRIMARY KEY,
  hospital_id TEXT REFERENCES hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  experience INTEGER NOT NULL,
  consultation_fee DECIMAL NOT NULL
);

-- Doctor availability (separate table for date/slots)
CREATE TABLE doctor_availability (
  id TEXT PRIMARY KEY,
  doctor_id TEXT REFERENCES doctors(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time_slots TEXT[] NOT NULL,
  UNIQUE(doctor_id, date)
);

-- Patients table
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  booking_id TEXT UNIQUE NOT NULL,
  hospital_id TEXT REFERENCES hospitals(id),
  doctor_id TEXT REFERENCES doctors(id),
  patient_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_gender TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  problem_description TEXT,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  amount_paid DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending',
  reschedule_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  hospital_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id)
);
```

### RLS Policies
Since the app uses custom auth (not Supabase Auth), we'll allow all operations for the anonymous key:

```sql
-- All tables: allow full access (app handles its own auth)
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON hospitals FOR ALL USING (true) WITH CHECK (true);
-- (same for all other tables)
```

### New Supabase Storage Layer (`src/lib/supabase-storage.ts`)
This file will export async versions of every function currently in `src/lib/storage.ts`:
- `getHospitals()` -> queries `hospitals` table
- `saveHospital()` -> inserts into `hospitals` table
- `getDoctors()` -> queries `doctors` table with joined `doctor_availability`
- `saveDoctor()` -> inserts into `doctors` + `doctor_availability`
- `saveBooking()` -> inserts into `bookings` table
- All other CRUD operations similarly converted

### Component Updates
All components will be updated to:
1. Use `async/await` with the new Supabase functions
2. Use `useState` + `useEffect` patterns for loading data
3. Add loading states where data is being fetched
4. Keep session management in localStorage (unchanged)

### Files Modified
| File | Change |
|------|--------|
| `src/lib/supabase-storage.ts` | **NEW** - All database operations |
| `src/lib/storage.ts` | Keep only session functions (localStorage) |
| `src/pages/hospital/Register.tsx` | Use Supabase for saving hospital |
| `src/pages/hospital/Login.tsx` | Use Supabase for login query |
| `src/pages/hospital/Dashboard.tsx` | Use Supabase for stats |
| `src/pages/hospital/AddDoctors.tsx` | Use Supabase for doctor CRUD |
| `src/pages/hospital/PatientBookings.tsx` | Use Supabase for bookings |
| `src/pages/patient/Register.tsx` | Use Supabase for saving patient |
| `src/pages/patient/Login.tsx` | Use Supabase for login query |
| `src/pages/patient/BookAppointment.tsx` | Use Supabase for booking |
| `src/pages/patient/MyBookings.tsx` | Use Supabase for fetching bookings |
| `src/pages/patient/Reschedule.tsx` | Use Supabase for updating bookings |
| `src/pages/admin/Dashboard.tsx` | Use Supabase for hospital management |
| `src/components/FeedbackForm.tsx` | Use Supabase for saving feedback |
| `src/components/DoctorReviews.tsx` | Use Supabase for reading feedback |


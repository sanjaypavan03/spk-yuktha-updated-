
import { AnalyzeUploadedReportOutput } from "@/ai/flows/analyze-uploaded-report";

export type Medicine = {
    id: string | number; // Can be string (MongoDB ObjectId) or number (for backward compatibility)
    name: string;
    dosage: string;
    time: string;
    taken: boolean | null;
};

export const mockMedicines: Medicine[] = [
    { id: 1, name: 'Metformin', dosage: '500mg', time: '8:00 AM', taken: true },
    { id: 2, name: 'Lisinopril', dosage: '10mg', time: '8:00 AM', taken: true },
    { id: 3, name: 'Atorvastatin', dosage: '20mg', time: '8:00 PM', taken: null },
    { id: 4, name: 'Amlodipine', dosage: '5mg', time: '8:00 PM', taken: null },
    { id: 5, name: 'Vitamin D3', dosage: '1000 IU', time: '9:00 AM', taken: true },
    { id: 6, name: 'Omega-3', dosage: '1200mg', time: '9:00 AM', taken: false },
    { id: 7, name: 'Losartan', dosage: '50mg', time: '9:00 PM', taken: null },
];

export type Prescription = {
    id: string;
    doctor: string;
    date: string;
    medications: { name: string; dosage: string }[];
    fileUrl: string;
}

export const mockPrescriptions: Prescription[] = [
    {
        id: 'presc-001',
        doctor: 'Dr. Evelyn Reed',
        date: '2024-07-20',
        medications: [
            { name: 'Amoxicillin', dosage: '500mg' },
            { name: 'Ibuprofen', dosage: '200mg' }
        ],
        fileUrl: '#'
    },
    {
        id: 'presc-002',
        doctor: 'Dr. Ben Carter',
        date: '2024-06-15',
        medications: [
            { name: 'Metformin', dosage: '1000mg' },
        ],
        fileUrl: '#'
    }
];

export type FamilyMember = {
    id: string;
    name: string;
    relation: string;
    avatarUrl: string;
};

export const mockFamilyMembers: FamilyMember[] = [
    { id: 'fam-001', name: 'Emily Doe', relation: 'Daughter', avatarUrl: 'https://picsum.photos/seed/fam1/100/100' },
    { id: 'fam-002', name: 'George Doe', relation: 'Father', avatarUrl: 'https://picsum.photos/seed/fam2/100/100' },
];

export type Patient = {
    id: string;
    name: string;
    lastVisit: string;
    avatarUrl: string;
}

export const mockPatients: Patient[] = [
    { id: 'pat-001', name: 'John Doe', lastVisit: '2024-07-21', avatarUrl: 'https://picsum.photos/seed/pat1/100/100' },
    { id: 'pat-002', name: 'Alice Johnson', lastVisit: '2024-07-18', avatarUrl: 'https://picsum.photos/seed/pat2/100/100' },
    { id: 'pat-003', name: 'Robert Williams', lastVisit: '2024-07-15', avatarUrl: 'https://picsum.photos/seed/pat3/100/100' },
];

export type EmergencyInfo = {
    fullName: string;
    birthYear: string;
    age: string;
    dob: string;
    weight: string;
    bodyCondition: string;
    badHabits: string;
    hasPastSurgery: boolean;
    surgery1Name: string;
    surgery1Date: string;
    surgery2Name: string;
    surgery2Date: string;
    surgery3Name: string;
    surgery3Date: string;
    bloodGroup: string;
    bloodGroupOther: string;
    allergies: string;
    allergiesOther: string;
    medications: string;
    medicationsOther: string;
    emergencyContact: string; // Stored as string "Name - Phone"
    chronicConditions: string;
    medicalNotes: string;
}

export const mockEmergencyInfo: EmergencyInfo = {
    fullName: 'John Doe',
    birthYear: '1990',
    age: '34',
    dob: '1990-05-15',
    weight: '75kg',
    bodyCondition: 'Healthy',
    badHabits: 'None',
    hasPastSurgery: false,
    surgery1Name: '',
    surgery1Date: '',
    surgery2Name: '',
    surgery2Date: '',
    surgery3Name: '',
    surgery3Date: '',
    bloodGroup: 'O+',
    bloodGroupOther: '',
    allergies: 'Peanuts, Penicillin',
    allergiesOther: '',
    medications: 'Metformin 500mg (daily), Lisinopril 10mg (daily)',
    medicationsOther: '',
    emergencyContact: 'John Doe - 123-456-7890',
    chronicConditions: 'None',
    medicalNotes: 'No special medical notes.'
}

export type Report = {
    id: string;
    title: string;
    type: string;
    date: Date;
    createdAt?: Date;
    clinic?: string;
    file: File;
    fileDataUri?: string;
    memberId?: string;
    analysis?: AnalyzeUploadedReportOutput;
};

export const mockReports: Report[] = [];

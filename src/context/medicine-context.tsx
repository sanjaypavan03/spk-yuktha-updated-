"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Medicine } from '@/lib/data';

interface MedicineContextType {
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  loading: boolean;
  refreshMedicines: () => Promise<void>;
}

const MedicineContext = createContext<MedicineContextType | undefined>(undefined);

export const MedicineProvider = ({ children }: { children: ReactNode }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/medicines');
      
      if (response.ok) {
        const data = await response.json();
        // Transform backend medicine format to frontend format
        const transformedMedicines: Medicine[] = data.data.map((med: any) => ({
          id: med._id.toString(), // Convert ObjectId to string
          name: med.name,
          dosage: med.dosage,
          time: med.time,
          taken: med.taken !== undefined ? med.taken : null,
        }));
        setMedicines(transformedMedicines);
      } else if (response.status === 401) {
        // User not authenticated, clear medicines
        setMedicines([]);
      } else {
        console.error('Failed to fetch medicines:', response.statusText);
        setMedicines([]);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const refreshMedicines = async () => {
    await fetchMedicines();
  };

  return (
    <MedicineContext.Provider value={{ medicines, setMedicines, loading, refreshMedicines }}>
      {children}
    </MedicineContext.Provider>
  );
};

export const useMedicine = () => {
  const context = useContext(MedicineContext);
  if (context === undefined) {
    throw new Error('useMedicine must be used within a MedicineProvider');
  }
  return context;
};

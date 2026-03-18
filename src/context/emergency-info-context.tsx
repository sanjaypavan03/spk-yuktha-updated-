
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { EmergencyInfo } from '@/lib/data';
import { storeEmergencyToken } from '@/lib/emergency-token';
import { useAuth } from './auth-context';

interface EmergencyInfoContextType {
  emergencyInfo: EmergencyInfo;
  setEmergencyInfo: React.Dispatch<React.SetStateAction<EmergencyInfo>>;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  emergencyToken: string | null;
  generateAndStoreToken: () => Promise<string>;
  refreshEmergencyInfo: () => Promise<void>;
}

const EmergencyInfoContext = createContext<EmergencyInfoContextType | undefined>(undefined);

const getDefaultInfo = (): EmergencyInfo => ({
  fullName: '',
  birthYear: '',
  age: '',
  dob: '',
  weight: '',
  bodyCondition: '',
  badHabits: '',
  hasPastSurgery: false,
  surgery1Name: '',
  surgery1Date: '',
  surgery2Name: '',
  surgery2Date: '',
  surgery3Name: '',
  surgery3Date: '',
  bloodGroup: '',
  bloodGroupOther: '',
  allergies: '',
  allergiesOther: '',
  medications: '',
  medicationsOther: '',
  emergencyContact: '',
  chronicConditions: '',
  medicalNotes: '',
  // New Fields
  knownAllergies: false,
  allergiesDetails: '',
  currentMedications: '',
  emergencyContact1Name: '',
  hasPacemakerOrImplant: false,
  height: '',
  smokingStatus: '',
  alcoholUse: '',
  physicalActivityLevel: '',
  pastSurgeries: [],
  emergencyContact2Name: '',
  familyMedicalHistory: '',
  insuranceProvider: '',
  additionalNotes: ''
});

export const EmergencyInfoProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyInfo>(getDefaultInfo());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emergencyToken, setEmergencyToken] = useState<string | null>(null);

  const refreshEmergencyInfo = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/medical-info');
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          const rawData = data.data;
          const sanitized: any = getDefaultInfo();

          // FORCE SANITIZATION: Ensure every field is the correct type
          Object.keys(sanitized).forEach(key => {
            const val = rawData[key];
            if (['hasPastSurgery', 'knownAllergies', 'hasPacemakerOrImplant'].includes(key)) {
              sanitized[key] = !!val;
            } else if (key === 'pastSurgeries') {
              sanitized[key] = Array.isArray(val) ? val : [];
            } else {
              // If it's an array for a string field, join it. If it's anything else, make it a string.
              if (Array.isArray(val)) {
                sanitized[key] = val.join(', ');
              } else {
                sanitized[key] = val !== undefined && val !== null ? String(val) : '';
              }
            }
          });

          setEmergencyInfo(sanitized);
          if (typeof window !== 'undefined') {
            localStorage.setItem('yuktha-emergency-info', JSON.stringify(sanitized));
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh emergency info:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const tokenRes = await fetch('/api/emergency-token');
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          if (tokenData.data?.token) {
            setEmergencyToken(tokenData.data.token);
            storeEmergencyToken(tokenData.data.token);
          }
        }
        await refreshEmergencyInfo();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (typeof window !== 'undefined' && user) {
      loadData();
    }
  }, [user]);

  const generateAndStoreToken = async (): Promise<string> => {
    try {
      const response = await fetch('/api/emergency-token', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.token) {
          const newToken = data.data.token;
          setEmergencyToken(newToken);
          storeEmergencyToken(newToken);
          return newToken;
        }
      }
      throw new Error('Failed to generate token');
    } catch (error) {
      throw error;
    }
  };

  return (
    <EmergencyInfoContext.Provider value={{
      emergencyInfo,
      setEmergencyInfo,
      isModalOpen,
      setIsModalOpen,
      emergencyToken,
      generateAndStoreToken,
      refreshEmergencyInfo
    }}>
      {children}
    </EmergencyInfoContext.Provider>
  );
};

export const useEmergencyInfo = () => {
  const context = useContext(EmergencyInfoContext);
  if (context === undefined) {
    throw new Error('useEmergencyInfo must be used within an EmergencyInfoProvider');
  }
  return context;
};

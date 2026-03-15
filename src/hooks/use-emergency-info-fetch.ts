/**
 * Hook to fetch emergency information by token
 * Used in the public emergency info page
 */

import { useState, useEffect } from 'react';
import { EmergencyInfo } from '@/lib/data';

export interface EmergencyInfoWithUser extends EmergencyInfo {
  userName: string;
}

export interface UseEmergencyInfoFetchResult {
  data: EmergencyInfoWithUser | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch emergency information by token
 * @param token - The emergency token
 * @returns Object with data, loading, and error states
 */
export function useEmergencyInfoFetch(
  token: string | undefined
): UseEmergencyInfoFetchResult {
  const [data, setData] = useState<EmergencyInfoWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing emergency token');
      setLoading(false);
      return;
    }

    const fetchEmergencyInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/emergency/${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Invalid or expired emergency QR code');
          } else if (response.status === 410) {
            setError('This emergency QR code has been deactivated');
          } else {
            setError('Failed to retrieve emergency information');
          }
          setData(null);
          return;
        }

        const emergencyData = await response.json();
        setData(emergencyData);
      } catch (err) {
        console.error('Error fetching emergency info:', err);
        setError('Failed to retrieve emergency information. Please try again.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencyInfo();
  }, [token]);

  return { data, loading, error };
}

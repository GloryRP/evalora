/**
 * Institution Context
 * Provides institution configuration globally
 * Fetches from backend on app load
 */
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const InstitutionContext = createContext();

const defaultInstitution = {
  institutionName: 'Your Institution Name',
  abbreviation: 'YIN',
  address: 'Your Address',
  city: 'Your City',
  state: 'Your State',
  pincode: '000000',
  phone: '+91-XXXXXXXXXX',
  email: 'info@yourinstitution.edu',
  website: 'www.yourinstitution.edu',
  logoUrl: null,
  affiliatedUniversity: 'Your University',
  academicYear: '2025-26',
  examCellEmail: 'examcell@yourinstitution.edu',
};

export const InstitutionProvider = ({ children }) => {
  const [institution, setInstitution] = useState(defaultInstitution);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInstitutionConfig = async () => {
      try {
        setLoading(true);
        const response = await api.get('/institution/config');
        if (response.data?.success && response.data?.data) {
          setInstitution({
            ...defaultInstitution,
            ...response.data.data,
          });
        }
      } catch (err) {
        console.warn('⚠️  Failed to fetch institution config, using defaults:', err.message);
        setError(err.message);
        // Keep using default institution on error
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutionConfig();
  }, []);

  return (
    <InstitutionContext.Provider value={{ institution, loading, error }}>
      {children}
    </InstitutionContext.Provider>
  );
};

export const useInstitution = () => {
  const context = useContext(InstitutionContext);
  if (!context) {
    throw new Error('useInstitution must be used within InstitutionProvider');
  }
  return context.institution;
};

export const useInstitutionContext = () => {
  const context = useContext(InstitutionContext);
  if (!context) {
    throw new Error('useInstitutionContext must be used within InstitutionProvider');
  }
  return context;
};

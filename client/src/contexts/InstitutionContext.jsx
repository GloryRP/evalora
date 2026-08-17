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
  currentAcademicYear: '2025-26',
  currentSemester: 5,
  academicYears: [],
};

export const InstitutionProvider = ({ children }) => {
  const [institution, setInstitution] = useState(defaultInstitution);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInstitutionConfig = async () => {
      try {
        setLoading(true);
        
        // Fetch both institution config and current academic year
        const [configResponse, currentResponse] = await Promise.all([
          api.get('/institution/config'),
          api.get('/institution/current'),
        ]);
        
        const configData = configResponse.data?.data || {};
        const currentData = currentResponse.data?.data || {};
        
        setInstitution({
          ...defaultInstitution,
          ...configData,
          currentAcademicYear: currentData.currentAcademicYear || configData.currentAcademicYear || '2025-26',
          currentSemester: currentData.currentSemester || configData.currentSemester || 5,
          academicYears: configData.academicYears || [],
        });
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

  const refreshAcademicYear = async () => {
    try {
      const response = await api.get('/institution/current');
      if (response.data?.success && response.data?.data) {
        setInstitution(prev => ({
          ...prev,
          currentAcademicYear: response.data.data.currentAcademicYear,
          currentSemester: response.data.data.currentSemester,
        }));
      }
    } catch (err) {
      console.error('Failed to refresh academic year:', err);
    }
  };

  return (
    <InstitutionContext.Provider value={{ institution, loading, error, refreshAcademicYear }}>
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

export const useAcademicYear = () => {
  const context = useContext(InstitutionContext);
  if (!context) {
    throw new Error('useAcademicYear must be used within InstitutionProvider');
  }
  return {
    currentAcademicYear: context.institution.currentAcademicYear || '2025-26',
    currentSemester: context.institution.currentSemester || 5,
    academicYears: context.institution.academicYears || [],
    refreshAcademicYear: context.refreshAcademicYear,
  };
};

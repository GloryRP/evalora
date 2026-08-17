/**
 * BulkImportModal - Reusable drag-and-drop CSV/Excel import modal
 * Supports Students, Faculty, and Departments
 */
import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';

// ─── Config per entity type ─────────────────────────────────────────────────
const CONFIG = {
  students: {
    label: 'Students',
    endpoint: '/admin/students/bulk',
    columns: ['usn', 'name', 'department', 'semester', 'email', 'phone', 'batch'],
    required: ['usn', 'name', 'department', 'semester'],
    templateRows: [
      ['1PE21CS001', 'Rahul Sharma', 'CSE', 5, 'rahul@college.edu', '9876543210', '2021-2025'],
      ['1PE21CS002', 'Priya Nair', 'CSE', 5, 'priya@college.edu', '9123456789', '2021-2025'],
    ],
    idField: 'usn',
  },
  faculty: {
    label: 'Faculty',
    endpoint: '/admin/faculty/bulk',
    columns: ['employeeId', 'name', 'department', 'designation', 'email', 'phone'],
    required: ['employeeId', 'name', 'department', 'designation'],
    templateRows: [
      ['EMP1001', 'Dr. Anand Kumar', 'CSE', 'Professor', 'anand@college.edu', '9876543210'],
      ['EMP1002', 'Ms. Deepa Raj', 'ECE', 'Assistant Professor', 'deepa@college.edu', '9123456789'],
    ],
    idField: 'employeeId',
  },
  departments: {
    label: 'Departments',
    endpoint: '/admin/departments/bulk',
    columns: ['departmentCode', 'departmentName'],
    required: ['departmentCode', 'departmentName'],
    templateRows: [
      ['CSE', 'Computer Science and Engineering'],
      ['ECE', 'Electronics and Communication Engineering'],
      ['ME', 'Mechanical Engineering'],
    ],
    idField: 'departmentCode',
  },
  subjects: {
    label: 'Subjects',
    endpoint: '/admin/subjects/bulk',
    columns: ['subjectCode', 'subjectName', 'department', 'semester', 'credits'],
    required: ['subjectCode', 'subjectName', 'department', 'semester', 'credits'],
    templateRows: [
      ['CS601', 'Machine Learning', 'CSE', 6, 4],
      ['CS602', 'Cloud Computing', 'CSE', 6, 3],
      ['EC501', 'Digital Signal Processing', 'ECE', 5, 4],
    ],
    idField: 'subjectCode',
  },
};

// ─── Steps ───────────────────────────────────────────────────────────────────
const STEPS = { UPLOAD: 'upload', PREVIEW: 'preview', RESULT: 'result' };

const BulkImportModal = ({ type, onClose, onSuccess }) => {
  const config = CONFIG[type];
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  // ── Template Download ──────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [config.columns, ...config.templateRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Style header row width
    ws['!cols'] = config.columns.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, config.label);
    XLSX.writeFile(wb, `${config.label}_template.xlsx`);
  };

  // ── File Parsing ───────────────────────────────────────────────────────────
  const parseFile = useCallback((file) => {
    if (!file) return;
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error('Only .xlsx, .xls, or .csv files are supported');
      return;
    }
    setFileName(file.name);
    setFileSize(file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (jsonData.length === 0) {
          toast.error('The file is empty or has no data rows');
          return;
        }
        // Normalize header keys (trim whitespace)
        const normalized = jsonData.map((row) => {
          const clean = {};
          Object.keys(row).forEach((k) => { clean[k.trim()] = String(row[k]).trim(); });
          return clean;
        });
        setParsedRows(normalized);
        setStep(STEPS.PREVIEW);
      } catch {
        toast.error('Failed to parse file. Please use the provided template.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    parseFile(file);
  };

  // ── Confirm & Upload ───────────────────────────────────────────────────────
  const handleConfirmUpload = async () => {
    setIsUploading(true);
    try {
      const response = await apiClient.post(config.endpoint, { records: parsedRows });
      setResult(response.data.data);
      setStep(STEPS.RESULT);
      if (response.data.data.created > 0) onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {/* ── FIX 2: Header with navy background ── */}
        <div style={{ backgroundColor: 'var(--color-navy)', color: 'white', padding: '20px 24px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileSpreadsheet size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>Import {config.label}</h2>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Upload a CSV file to add multiple records at once</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '12px', flexShrink: 0 }} onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.25)'} onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}>
            <X size={18} />
          </button>
        </div>

        {/* ── FIX 3: Step Indicators ── */}
        <div style={{ backgroundColor: '#F8F9FA', padding: '0', borderBottom: '1px solid #EEEEEE', display: 'flex' }}>
          {[STEPS.UPLOAD, STEPS.PREVIEW, STEPS.RESULT].map((s, i) => {
            const labels = { upload: 'Upload', preview: 'Preview', result: 'Result' };
            const active = step === s;
            const done = (step === STEPS.PREVIEW && i === 0) || (step === STEPS.RESULT && i < 2);
            const bgColor = active ? '#F0F4FF' : done ? '#F0FDF4' : '#F8F9FA';
            const circleColor = active ? 'var(--color-navy)' : done ? '#065F46' : '#E5E7EB';
            const circleTextColor = active || done ? 'white' : '#9CA3AF';
            const labelColor = active ? 'var(--color-navy)' : done ? '#065F46' : '#9CA3AF';
            const fontWeight = active ? 600 : 500;
            return (
              <div key={s} style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', borderRight: i < 2 ? '1px solid #EEEEEE' : 'none', backgroundColor: bgColor, position: 'relative' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: circleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: circleTextColor, flexShrink: 0 }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ color: labelColor, fontWeight }}>{labels[s]}</span>
              </div>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column' }}>

          {/* STEP 1: UPLOAD */}
          {step === STEPS.UPLOAD && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* FIX 5: Download Template Section */}
              <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ fontSize: '16px', color: '#1E40AF', flexShrink: 0, marginTop: '2px' }}>ℹ</div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E40AF', marginBottom: '2px' }}>Download the CSV Template</p>
                    <p style={{ fontSize: '0.78rem', color: '#3B82F6' }}>Fill in your data following the format shown, then upload below.</p>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseOver={(e) => e.target.style.backgroundColor = 'var(--color-navy-light)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'var(--color-navy)'}
                >
                  <Download size={14} /> Template
                </button>
              </div>

              {/* FIX 6: Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? '2px dashed var(--color-gold)' : '2px dashed #D0D0D0',
                  borderRadius: '8px',
                  padding: '32px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragging ? '#FFFDF5' : '#FAFAFA',
                  transition: 'all 200ms ease',
                  marginBottom: '16px'
                }}
              >
                {fileName ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ color: '#065F46', fontSize: '20px', flexShrink: 0 }}>📄</div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>{fileName}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{fileSize}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFileName(''); setFileSize(''); setParsedRows([]); }}
                      style={{ fontSize: '0.75rem', color: 'var(--color-navy)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '36px', marginBottom: '12px', color: '#CCCCCC' }}>📁</div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '4px' }}>
                      {isDragging ? 'Release to upload' : 'Drag & drop your file here'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0px' }}>
                      or <span style={{ color: 'var(--color-gold)', fontWeight: 600, cursor: 'pointer' }}>click to browse</span>
                    </p>
                    <p style={{ fontSize: '0.72rem', color: '#AAAAAA', marginTop: '8px' }}>Supports .csv files only (max 5MB)</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => parseFile(e.target.files[0])} style={{ display: 'none' }} />
              </div>

              {/* FIX 7: Required Columns Display as Table */}
              <div style={{ paddingTop: '8px' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>Required Columns</p>
                <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse', marginBottom: '8px' }}>
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: '#F8F9FA', padding: '8px 12px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', borderBottom: '1px solid #EEEEEE' }}>Column</th>
                      <th style={{ backgroundColor: '#F8F9FA', padding: '8px 12px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', borderBottom: '1px solid #EEEEEE' }}>Required</th>
                      <th style={{ backgroundColor: '#F8F9FA', padding: '8px 12px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', borderBottom: '1px solid #EEEEEE' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.columns.map((col, idx) => {
                      const isRequired = config.required.includes(col);
                      const descriptions = {
                        usn: 'Unique student number e.g. 4PM23CS001',
                        name: 'Full name',
                        department: 'Must match dept in system',
                        semester: 'Number 1-8',
                        email: 'Institutional email address',
                        phone: '10-digit mobile number',
                        batch: 'e.g. 2023-2027',
                        employeeId: 'Unique employee identifier',
                        designation: 'Faculty designation',
                        departmentCode: 'Department code',
                        departmentName: 'Full department name',
                        subjectCode: 'Unique subject identifier',
                        subjectName: 'Full subject name',
                        credits: 'Credit hours (1-5)',
                      };
                      return (
                        <tr key={col} style={{ borderBottom: '1px solid #F5F5F5' }}>
                          <td style={{ padding: '8px 12px', color: 'var(--color-text)', fontWeight: 500 }}>{col}</td>
                          <td style={{ padding: '8px 12px' }}>
                            {isRequired ? (
                              <span style={{ backgroundColor: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 600 }}>✓ Required</span>
                            ) : (
                              <span style={{ backgroundColor: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 600 }}>Optional</span>
                            )}
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{descriptions[col] || ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                  Default password will be auto-set to {type === 'faculty' ? 'EmployeeID@123' : 'USN@123'} (e.g. {type === 'faculty' ? 'FAC101@123' : '4PM23CS001@123'}). {type === 'faculty' ? 'Faculty' : 'Students'} must change on first login.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === STEPS.PREVIEW && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>Preview: <span style={{ color: 'var(--color-navy)' }}>{fileName}</span></p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{parsedRows.length} records found. Review before uploading.</p>
                </div>
                <button onClick={() => { setStep(STEPS.UPLOAD); setParsedRows([]); setFileName(''); setFileSize(''); }} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }} onMouseOver={(e) => e.target.style.color = 'var(--color-text)'} onMouseOut={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
                  Change file
                </button>
              </div>

              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #E5E7EB', maxHeight: '340px', overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-navy)', color: 'white' }}>
                    <tr>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600 }}>#</th>
                      {config.columns.map((col) => (
                        <th key={col} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => {
                      const missing = config.required.filter((f) => !row[f]);
                      const hasError = missing.length > 0;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F5F5F5', backgroundColor: hasError ? '#FEE2E2' : idx % 2 === 0 ? 'white' : '#F9FAFB' }}>
                          <td style={{ padding: '10px 12px', color: '#9CA3AF', fontSize: '0.75rem' }}>{idx + 1}</td>
                          {config.columns.map((col) => (
                            <td key={col} style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: !row[col] && config.required.includes(col) ? '#EF4444' : 'var(--color-text)', fontWeight: !row[col] && config.required.includes(col) ? 600 : 400 }}>
                              {row[col] || <span style={{ color: '#D0D0D0', fontStyle: 'italic' }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {parsedRows.some((row) => config.required.some((f) => !row[f])) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '0.875rem' }}>
                  <span style={{ marginTop: '2px', flexShrink: 0 }}>⚠️</span>
                  <span>Rows highlighted in red are missing required fields and will be skipped during import.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: RESULT */}
          {step === STEPS.RESULT && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', borderRadius: '8px', backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px', color: '#065F46' }}>✓</div>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: '#065F46' }}>{result.created}</p>
                  <p style={{ fontSize: '0.875rem', color: '#047857', fontWeight: 500, marginTop: '4px' }}>Records Created</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', borderRadius: '8px', backgroundColor: '#FFFBEB', border: '1px solid #FCD34D' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px', color: '#B45309' }}>⚠️</div>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: '#B45309' }}>{result.skipped}</p>
                  <p style={{ fontSize: '0.875rem', color: '#92400E', fontWeight: 500, marginTop: '4px' }}>Skipped / Errors</p>
                </div>
              </div>

              {/* Error list */}
              {result.errors?.length > 0 && (
                <div style={{ borderRadius: '8px', border: '1px solid #FECACA', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', backgroundColor: '#FEE2E2', borderBottom: '1px solid #FECACA' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#991B1B' }}>Skipped Records</p>
                  </div>
                  <div style={{ overflowX: 'auto', maxHeight: '192px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#FEE2E2' }}>
                        <tr>
                          <th style={{ padding: '8px 16px', textAlign: 'left', color: '#991B1B', fontWeight: 600 }}>ID</th>
                          <th style={{ padding: '8px 16px', textAlign: 'left', color: '#991B1B', fontWeight: 600 }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((e, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #FECACA' }}>
                            <td style={{ padding: '8px 16px', fontFamily: 'monospace', color: 'var(--color-text)' }}>{e[config.idField] || e.usn || e.employeeId || e.departmentCode || '—'}</td>
                            <td style={{ padding: '8px 16px', color: 'var(--color-text-secondary)' }}>{e.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FIX 8: Modal Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: '0 0 12px 12px' }}>
          {step === STEPS.UPLOAD && (
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, backgroundColor: 'white', color: 'var(--color-text)', border: '1.5px solid #E0E0E0', cursor: 'pointer' }} onMouseOver={(e) => e.target.style.backgroundColor = '#F3F4F6'} onMouseOut={(e) => e.target.style.backgroundColor = 'white'}>
              Cancel
            </button>
          )}
          {step === STEPS.PREVIEW && (
            <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
              <button onClick={() => { setStep(STEPS.UPLOAD); setParsedRows([]); setFileName(''); setFileSize(''); }} style={{ padding: '9px 20px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, backgroundColor: 'white', color: 'var(--color-text)', border: '1.5px solid #E0E0E0', cursor: 'pointer' }} onMouseOver={(e) => e.target.style.backgroundColor = '#F3F4F6'} onMouseOut={(e) => e.target.style.backgroundColor = 'white'}>
                Back
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={isUploading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, backgroundColor: isUploading ? 'rgba(30, 58, 95, 0.6)' : 'var(--color-navy)', color: 'white', border: 'none', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1 }}
              >
                {isUploading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</> : <>📤 Upload {parsedRows.length} Records</>}
              </button>
            </div>
          )}
          {step === STEPS.RESULT && (
            <button
              onClick={onClose}
              style={{ marginLeft: 'auto', padding: '9px 20px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', cursor: 'pointer' }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'var(--color-navy-light)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'var(--color-navy)'}
            >
              Done
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.93) translateY(12px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BulkImportModal;

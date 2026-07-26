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
    columns: ['usn', 'name', 'department', 'semester', 'email', 'phone', 'password', 'batch'],
    required: ['usn', 'name', 'department', 'semester', 'password'],
    templateRows: [
      ['1PE21CS001', 'Rahul Sharma', 'CSE', 5, 'rahul@college.edu', '9876543210', 'pass123', '2021-2025'],
      ['1PE21CS002', 'Priya Nair', 'CSE', 5, 'priya@college.edu', '9123456789', 'pass123', '2021-2025'],
    ],
    idField: 'usn',
  },
  faculty: {
    label: 'Faculty',
    endpoint: '/admin/faculty/bulk',
    columns: ['employeeId', 'name', 'department', 'designation', 'email', 'phone', 'password'],
    required: ['employeeId', 'name', 'department', 'designation', 'password'],
    templateRows: [
      ['EMP1001', 'Dr. Anand Kumar', 'CSE', 'Professor', 'anand@college.edu', '9876543210', 'fac123'],
      ['EMP1002', 'Ms. Deepa Raj', 'ECE', 'Assistant Professor', 'deepa@college.edu', '9123456789', 'fac123'],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" style={{ animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Import {config.label}</h2>
              <p className="text-xs text-blue-200">Upload Excel or CSV file to add in bulk</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* ── Progress Steps ── */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100">
          {[STEPS.UPLOAD, STEPS.PREVIEW, STEPS.RESULT].map((s, i) => {
            const labels = { upload: 'Upload', preview: 'Preview', result: 'Result' };
            const active = step === s;
            const done = (step === STEPS.PREVIEW && i === 0) || (step === STEPS.RESULT && i < 2);
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <ChevronRight size={14} className="text-gray-300" />}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? 'bg-[#1E3A5F] text-white' : done ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                  {done ? <CheckCircle2 size={12} /> : <span className="w-4 text-center">{i + 1}</span>}
                  {labels[s]}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 1: UPLOAD */}
          {step === STEPS.UPLOAD && (
            <div className="space-y-5">
              {/* Template download */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-[#C9A227]/60 bg-amber-50/40">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">📄 Download Template First</p>
                  <p className="text-xs text-[#5C5C5C] mt-0.5">Fill in the template with your data, then upload it below</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-[#C9A227] border border-[#C9A227] hover:bg-[#C9A227] hover:text-white transition"
                >
                  <Download size={16} /> Template
                </button>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 h-52 rounded-xl border-2 border-dashed cursor-pointer transition-all ${isDragging ? 'border-[#1E3A5F] bg-blue-50' : 'border-gray-300 hover:border-[#C9A227] hover:bg-amber-50/30'}`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Upload size={28} className={isDragging ? 'text-[#1E3A5F]' : 'text-gray-400'} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{isDragging ? 'Release to upload' : 'Drag & drop your file here'}</p>
                  <p className="text-xs text-[#5C5C5C] mt-1">or <span className="text-[#C9A227] font-semibold">click to browse</span></p>
                  <p className="text-xs text-gray-400 mt-2">Supports .xlsx, .xls, .csv</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => parseFile(e.target.files[0])} className="hidden" />
              </div>

              {/* Required columns */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider mb-2">Required Columns</p>
                <div className="flex flex-wrap gap-2">
                  {config.columns.map((col) => (
                    <span key={col} className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${config.required.includes(col) ? 'bg-[#1E3A5F]/10 text-[#1E3A5F]' : 'bg-gray-200 text-gray-600'}`}>
                      {col}{config.required.includes(col) ? ' *' : ''}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">* Required fields</p>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === STEPS.PREVIEW && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1A1A1A]">Preview: <span className="text-[#1E3A5F]">{fileName}</span></p>
                  <p className="text-sm text-[#5C5C5C] mt-0.5">{parsedRows.length} records found. Review before uploading.</p>
                </div>
                <button onClick={() => { setStep(STEPS.UPLOAD); setParsedRows([]); setFileName(''); }} className="text-sm text-[#5C5C5C] hover:text-[#1A1A1A] underline">
                  Change file
                </button>
              </div>

              <div className="overflow-auto rounded-xl border border-gray-200" style={{ maxHeight: '340px' }}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#1E3A5F] text-white">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">#</th>
                      {config.columns.map((col) => (
                        <th key={col} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => {
                      const missing = config.required.filter((f) => !row[f]);
                      const hasError = missing.length > 0;
                      return (
                        <tr key={idx} className={`border-b border-gray-100 ${hasError ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                          {config.columns.map((col) => (
                            <td key={col} className={`px-3 py-2 whitespace-nowrap ${!row[col] && config.required.includes(col) ? 'text-red-500 font-semibold' : 'text-[#1A1A1A]'}`}>
                              {col === 'password' ? '••••••' : (row[col] || <span className="text-gray-300 italic">—</span>)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {parsedRows.some((row) => config.required.some((f) => !row[f])) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  Rows highlighted in red are missing required fields and will be skipped during import.
                </div>
              )}
            </div>
          )}

          {/* STEP 3: RESULT */}
          {step === STEPS.RESULT && result && (
            <div className="space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-green-50 border border-green-200">
                  <CheckCircle2 size={32} className="text-green-500 mb-2" />
                  <p className="text-3xl font-bold text-green-700">{result.created}</p>
                  <p className="text-sm text-green-600 font-medium mt-1">Records Created</p>
                </div>
                <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-amber-50 border border-amber-200">
                  <XCircle size={32} className="text-amber-500 mb-2" />
                  <p className="text-3xl font-bold text-amber-700">{result.skipped}</p>
                  <p className="text-sm text-amber-600 font-medium mt-1">Skipped / Errors</p>
                </div>
              </div>

              {/* Error list */}
              {result.errors?.length > 0 && (
                <div className="rounded-xl border border-red-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-red-50 border-b border-red-200">
                    <p className="text-sm font-semibold text-red-700">Skipped Records</p>
                  </div>
                  <div className="overflow-auto max-h-48">
                    <table className="w-full text-xs">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-red-600 font-semibold">ID</th>
                          <th className="px-4 py-2 text-left text-red-600 font-semibold">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((e, i) => (
                          <tr key={i} className="border-t border-red-100">
                            <td className="px-4 py-2 font-mono text-[#1A1A1A]">{e[config.idField] || e.usn || e.employeeId || e.departmentCode || '—'}</td>
                            <td className="px-4 py-2 text-[#5C5C5C]">{e.reason}</td>
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

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          {step === STEPS.UPLOAD && (
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[#5C5C5C] hover:bg-gray-200 transition">
              Cancel
            </button>
          )}
          {step === STEPS.PREVIEW && (
            <>
              <button onClick={() => { setStep(STEPS.UPLOAD); setParsedRows([]); }} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[#5C5C5C] hover:bg-gray-200 transition">
                Back
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%)' }}
              >
                {isUploading ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Upload size={16} /> Upload {parsedRows.length} Records</>}
              </button>
            </>
          )}
          {step === STEPS.RESULT && (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition"
              style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%)' }}
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
      `}</style>
    </div>
  );
};

export default BulkImportModal;

/**
 * ExportModal - Reusable modal to select fields/columns before exporting to Excel
 */
import { useState, useEffect } from 'react';
import { X, Download, CheckSquare, Square } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const ExportModal = ({
  isOpen,
  onClose,
  fields = [],
  data = [],
  fileName = 'Export',
  sheetName = 'Data'
}) => {
  const [selectedFields, setSelectedFields] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Default select all fields
      setSelectedFields(fields.map(f => f.key));
    }
  }, [isOpen, fields]);

  if (!isOpen) return null;

  const handleToggle = (key) => {
    if (selectedFields.includes(key)) {
      setSelectedFields(selectedFields.filter(k => k !== key));
    } else {
      setSelectedFields([...selectedFields, key]);
    }
  };

  const handleSelectAll = () => {
    setSelectedFields(fields.map(f => f.key));
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const handleExport = () => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one column to export');
      return;
    }

    try {
      // Filter rows based on selected fields
      const rows = data.map(item => {
        const row = {};
        fields.forEach(field => {
          if (selectedFields.includes(field.key)) {
            // Special mapping helper (e.g. nested objects like HOD name)
            if (field.valueMap) {
              row[field.label] = field.valueMap(item);
            } else {
              row[field.label] = item[field.key] !== undefined ? item[field.key] : '—';
            }
          }
        });
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      
      // Auto-fit column widths
      ws['!cols'] = selectedFields.map(key => {
        const field = fields.find(f => f.key === key);
        return { wch: Math.max(15, field?.label?.length || 10) };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      const fullFileName = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fullFileName);
      
      toast.success(`Exported ${rows.length} records successfully!`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b border-gray-100 text-white"
          style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%)' }}
        >
          <div>
            <h3 className="text-lg font-bold">Export Columns</h3>
            <p className="text-xs text-blue-200 mt-0.5">Select columns to include in the Excel file</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Action buttons */}
          <div className="flex items-center justify-between text-xs font-semibold text-[#1E3A5F] border-b border-gray-100 pb-3">
            <span>{selectedFields.length} of {fields.length} selected</span>
            <div className="flex gap-3">
              <button onClick={handleSelectAll} className="hover:underline">Select All</button>
              <button onClick={handleDeselectAll} className="hover:underline">Deselect All</button>
            </div>
          </div>

          {/* List of checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {fields.map(field => {
              const isSelected = selectedFields.includes(field.key);
              return (
                <button
                  key={field.key}
                  onClick={() => handleToggle(field.key)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-[#1E3A5F] bg-blue-50/40 text-[#1E3A5F] font-semibold'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare size={16} className="text-[#1E3A5F]" />
                  ) : (
                    <Square size={16} className="text-gray-300" />
                  )}
                  <span className="text-sm">{field.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-[#5C5C5C] hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%)' }}
          >
            <Download size={15} />
            Export Selected
          </button>
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

export default ExportModal;

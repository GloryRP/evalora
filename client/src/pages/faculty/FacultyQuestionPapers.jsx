/**
 * Faculty Question Papers Page — Enhanced with Templates & File Uploads
 * Allows faculty members to:
 * 1. View and print/download the preconfigured question paper scheme template.
 * 2. Submit the question paper either by typing it online or uploading a completed PDF/Word document.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { FileText, Send, CheckCircle, HelpCircle, AlertCircle, Printer, Download, Upload, Clipboard } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Badge from '../../components/ui/Badge';

const FacultyQuestionPapers = () => {
  const queryClient = useQueryClient();
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('online'); // 'online' or 'upload'
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Fetch question papers for this faculty's department
  const { data: papers, isLoading } = useQuery({
    queryKey: ['facultyQuestionPapers'],
    queryFn: async () => {
      const response = await api.get('/faculty/question-papers');
      return response.data.data;
    }
  });

  const handleSelectPaper = (paper) => {
    setSelectedPaper(paper);
    if (paper.slots && paper.slots.length > 0) {
      setQuestions(paper.slots.map(s => ({
        questionNumber: s.questionNumber,
        text: s.text || '',
        maxMarks: s.maxMarks,
        or: s.or ? { questionNumber: s.or.questionNumber, text: s.or.text || '', maxMarks: s.or.maxMarks } : null
      })));
    } else {
      setQuestions(paper.questions.map(q => ({
        questionNumber: q.questionNumber,
        text: q.text || '',
        maxMarks: q.maxMarks,
        or: null
      })));
    }
    setFile(null);
  };

  const handleQuestionTextChange = (index, val) => {
    const updated = [...questions];
    updated[index].text = val;
    setQuestions(updated);
  };

  const handleOrQuestionTextChange = (index, val) => {
    const updated = [...questions];
    if (updated[index].or) {
      updated[index].or.text = val;
    }
    setQuestions(updated);
  };

  const submitMutation = useMutation({
    mutationFn: (data) => api.put(`/faculty/question-papers/${selectedPaper._id}/submit`, { slots: data, questions: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['facultyQuestionPapers']);
      toast.success('Question paper submitted successfully for review!');
      setSelectedPaper(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit question paper');
    }
  });

  const handleSubmitOnline = (e) => {
    e.preventDefault();
    for (const q of questions) {
      if (!q.text.trim()) {
        toast.error(`Please provide description/text for ${q.questionNumber}`);
        return;
      }
      if (q.or && !q.or.text.trim()) {
        toast.error(`Please provide description/text for the OR alternative ${q.or.questionNumber}`);
        return;
      }
    }
    submitMutation.mutate(questions);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a question paper file to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.put(`/faculty/question-papers/${selectedPaper._id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Question paper file uploaded and submitted successfully!');
        queryClient.invalidateQueries(['facultyQuestionPapers']);
        setSelectedPaper(null);
        setFile(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload question paper file');
    } finally {
      setUploading(false);
    }
  };

  const handlePrintTemplate = () => {
    const printContent = document.getElementById('qp-printable-template').innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore React state cleanly
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'approved': return 'emerald';
      case 'submitted': return 'gold';
      default: return 'navy';
    }
  };

  if (isLoading) {
    return <div className="p-6 lg:p-8 max-w-6xl mx-auto"><LoadingSkeleton count={4} /></div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-1">
          Exam Question Papers
        </h1>
        <p className="text-[#5C5C5C] text-sm">
          Download templates preconfigured by the Exam Cell, and submit back your completed question papers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left list of scheduled patterns */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit space-y-4">
          <h3 className="text-md font-bold text-[#1A1A1A] border-b border-gray-100 pb-3 flex items-center gap-2">
            <Clipboard size={18} className="text-[#C9A227]" /> Scheduled Schemes
          </h3>

          {papers?.length === 0 ? (
            <p className="text-xs text-[#5C5C5C] text-center py-6">No question paper configurations scheduled for your department.</p>
          ) : (
            <div className="space-y-3">
              {papers?.map((paper) => (
                <div key={paper._id} onClick={() => handleSelectPaper(paper)}
                  className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                    selectedPaper?._id === paper._id ? 'border-[#1E3A5F] bg-blue-50/30' : 'border-gray-100 hover:border-gray-300'
                  }`}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-mono font-bold text-[#5B21B6] bg-purple-50 px-1.5 py-0.5 rounded">{paper.examId?.subjectId?.subjectCode}</span>
                    <Badge variant={getStatusBadgeVariant(paper.status)}>{paper.status}</Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-[#1A1A1A] mt-2 line-clamp-1">{paper.examId?.subjectId?.subjectName}</h4>
                  <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                    {paper.examId?.examType} • Max Marks: {paper.maxMarks}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right editor/submission console */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-md font-bold text-[#1A1A1A] border-b border-gray-100 pb-3 flex items-center gap-2 mb-4">
            <FileText size={18} className="text-[#C9A227]" /> Question Paper Console
          </h3>

          {!selectedPaper ? (
            <div className="py-24 text-center text-[#5C5C5C]">
              <HelpCircle size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium">Select a scheduled question paper on the left to write/upload your scheme.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Paper Details Summary */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">{selectedPaper.examId?.subjectId?.subjectName}</h4>
                  <p className="text-xs font-semibold text-gray-500 mt-1">{selectedPaper.examId?.subjectId?.subjectCode} • Max Marks: {selectedPaper.maxMarks}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowTemplateModal(true)} variant="ghost" className="flex items-center gap-1.5 border border-gray-300 text-xs font-semibold">
                    <Printer size={14} /> View/Print Template
                  </Button>
                  <Badge variant={getStatusBadgeVariant(selectedPaper.status)}>Status: {selectedPaper.status}</Badge>
                </div>
              </div>

              {/* Status notifications */}
              {selectedPaper.status === 'approved' ? (
                <div className="bg-emerald-50 text-emerald-700 px-4 py-3.5 rounded-xl border border-emerald-100 flex items-center gap-2.5 text-xs font-semibold">
                  <CheckCircle size={18} />
                  This question paper has been reviewed and approved by the Exam Cell. No further uploads or edits are allowed.
                </div>
              ) : selectedPaper.status === 'submitted' ? (
                <div className="bg-amber-50 text-amber-700 px-4 py-3.5 rounded-xl border border-amber-100 flex items-center gap-2.5 text-xs font-semibold flex-col items-start w-full">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle size={18} />
                    This question paper is submitted and pending review by the Exam Cell.
                  </div>
                  {selectedPaper.fileName && (
                    <div className="mt-2 text-xs font-bold text-amber-800 bg-white border border-amber-200/50 rounded-lg p-2 flex items-center gap-2 self-stretch">
                      <FileText size={14} />
                      <span>Uploaded File: {selectedPaper.fileName}</span>
                      <a href={`http://localhost:5000${selectedPaper.fileUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold ml-auto flex items-center gap-1">
                        <Download size={12} /> Download File
                      </a>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Option Tabs for Draft submissions */}
              {selectedPaper.status === 'draft' && (
                <div className="space-y-4">
                  <div className="flex border-b border-gray-200">
                    <button onClick={() => setActiveSubTab('online')}
                      className={`px-4 py-2 text-xs font-bold border-b-2 -mb-[2px] transition ${activeSubTab === 'online' ? 'border-[#1E3A5F] text-[#1E3A5F]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                      Write Questions Online
                    </button>
                    <button onClick={() => setActiveSubTab('upload')}
                      className={`px-4 py-2 text-xs font-bold border-b-2 -mb-[2px] transition ${activeSubTab === 'upload' ? 'border-[#1E3A5F] text-[#1E3A5F]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                      Upload Finished File (PDF/Docx)
                    </button>
                  </div>

                  {/* Online Write form */}
                  {activeSubTab === 'online' && (
                    <form onSubmit={handleSubmitOnline} className="space-y-4">
                      <div className="space-y-4">
                        {questions.map((q, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            {/* Main Question */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center border-b border-gray-200 pb-1.5 mb-1">
                                <span className="text-xs font-bold text-[#1E3A5F] font-mono">Question {q.questionNumber}</span>
                                <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{q.maxMarks} Marks</span>
                              </div>
                              <textarea
                                value={q.text}
                                onChange={(e) => handleQuestionTextChange(idx, e.target.value)}
                                rows={3}
                                placeholder={`Enter the question text / description for ${q.questionNumber}...`}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm bg-white"
                              />
                            </div>

                            {/* Alternative OR Question */}
                            {q.or && (
                              <div className="space-y-2 pt-2 border-t border-dashed border-gray-200">
                                <div className="flex justify-between items-center pb-1.5">
                                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 w-fit">
                                    <span>OR</span> Question {q.or.questionNumber}
                                  </span>
                                  <span className="text-xs font-bold text-gray-400">{q.or.maxMarks} Marks</span>
                                </div>
                                <textarea
                                  value={q.or.text}
                                  onChange={(e) => handleOrQuestionTextChange(idx, e.target.value)}
                                  rows={3}
                                  placeholder={`Enter the alternative question text / description for ${q.or.questionNumber}...`}
                                  className="w-full p-3 border border-amber-200 bg-amber-50/20 rounded-lg focus:ring-2 focus:ring-[#C9A227] outline-none text-sm"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-4 border-t border-gray-100">
                        <Button type="submit" disabled={submitMutation.isPending}>
                          {submitMutation.isPending ? 'Submitting...' : 'Submit Online Scheme'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Document Upload form */}
                  {activeSubTab === 'upload' && (
                    <form onSubmit={handleFileUpload} className="space-y-4 p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-center">
                      <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                      <h4 className="text-sm font-semibold text-gray-700">Upload Completed Question Paper</h4>
                      <p className="text-xs text-[#5C5C5C] mb-4">Make your question paper based on the template layout, then upload here (PDF/Word/Docx only).</p>
                      
                      <div className="max-w-xs mx-auto">
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc"
                          onChange={(e) => setFile(e.target.files[0])}
                          className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1E3A5F]/10 file:text-[#1E3A5F] hover:file:bg-[#1E3A5F]/20 cursor-pointer"
                        />
                      </div>

                      <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                        <Button type="submit" disabled={uploading}>
                          {uploading ? 'Uploading...' : 'Submit Question Paper File'}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Template Modal for View/Download (Printable VTU Layout) */}
      {showTemplateModal && selectedPaper && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[85vh]">
            
            {/* Modal Actions Header */}
            <div className="bg-[#1E3A5F] px-6 py-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-[#C9A227]" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Question Paper Template Preview</h2>
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePrintTemplate} className="bg-[#C9A227] hover:bg-[#B08D20] text-[#1E3A5F] font-bold text-xs flex items-center gap-1">
                  <Printer size={13} /> Print/Save Template
                </Button>
                <Button onClick={() => setShowTemplateModal(false)} variant="ghost" className="text-white hover:bg-white/10 text-xs">
                  Close
                </Button>
              </div>
            </div>

            {/* Printable Area Wrapper */}
            <div className="p-8 overflow-y-auto flex-1 bg-white" id="qp-printable-template">
              
              {/* Institution Header */}
              <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                <h2 className="text-lg font-bold font-display text-gray-800 uppercase tracking-wide">PES Institute of Technology & Management</h2>
                <p className="text-[10px] font-semibold text-gray-500 tracking-wide uppercase">NH-206, SAGAR ROAD, SHIVAMOGGA - 577204</p>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mt-2.5">Centralized Internal Assessment Test</h3>
                <p className="text-xs font-semibold text-gray-600 mt-1">Question Paper Scheme Template</p>
              </div>

              {/* Course details table */}
              <table className="w-full border-collapse border border-gray-400 text-xs mb-6">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-3 py-2 font-bold bg-gray-50 w-24">Subject:</td>
                    <td className="border border-gray-400 px-3 py-2">{selectedPaper.examId?.subjectId?.subjectName || '—'}</td>
                    <td className="border border-gray-400 px-3 py-2 font-bold bg-gray-50 w-28">Subject Code:</td>
                    <td className="border border-gray-400 px-3 py-2 font-mono font-bold">{selectedPaper.examId?.subjectId?.subjectCode || '—'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-3 py-2 font-bold bg-gray-50">Semester:</td>
                    <td className="border border-gray-400 px-3 py-2">{selectedPaper.examId?.subjectId?.semester || '—'}</td>
                    <td className="border border-gray-400 px-3 py-2 font-bold bg-gray-50">Max Marks:</td>
                    <td className="border border-gray-400 px-3 py-2 font-bold">{selectedPaper.maxMarks || 50} Marks</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-3 py-2 font-bold bg-gray-50">Exam Category:</td>
                    <td className="border border-gray-400 px-3 py-2 capitalize">{selectedPaper.examId?.examType || 'CIE'}</td>
                    <td className="border border-gray-400 px-3 py-2 font-bold bg-gray-50">Duration:</td>
                    <td className="border border-gray-400 px-3 py-2">90 Minutes</td>
                  </tr>
                </tbody>
              </table>

              {/* Candidate Instructions */}
              <div className="mb-6">
                <h4 className="font-bold text-xs text-gray-800 mb-1">Instructions to Candidates:</h4>
                <ul className="list-disc pl-5 text-[11px] text-gray-600 space-y-0.5">
                  <li>All sections are compulsory. Marks are indicated against each question.</li>
                  <li>Use of non-programmable scientific calculators is permitted.</li>
                  <li>Draw neat sketches, graphs, or block diagrams wherever necessary.</li>
                </ul>
              </div>

              {/* Question scheme details */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-gray-800 border-b border-gray-200 pb-1 mb-2">Question Breakdown Scheme:</h4>
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <thead>
                    <tr className="bg-gray-100 font-bold text-gray-700">
                      <th className="border border-gray-400 px-3 py-2 text-center w-16">Q. No.</th>
                      <th className="border border-gray-400 px-3 py-2 text-left">Question Text Description</th>
                      <th className="border border-gray-400 px-3 py-2 text-center w-24">Max Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedPaper.slots && selectedPaper.slots.length > 0 ? selectedPaper.slots : selectedPaper.questions).map((q, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="h-16">
                          <td className="border border-gray-400 px-3 py-2 text-center font-bold font-mono">{q.questionNumber}</td>
                          <td className="border border-gray-400 px-3 py-2 text-gray-700 text-[11px]">
                            {q.text ? q.text : <span className="text-gray-400 italic">[ Write question contents here... ]</span>}
                          </td>
                          <td className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-600">{q.maxMarks} M</td>
                        </tr>
                        {q.or && (
                          <>
                            <tr>
                              <td colSpan="3" className="border border-gray-400 px-3 py-1 bg-amber-50/50 text-center font-bold text-[9px] tracking-widest text-amber-700 uppercase">
                                OR
                              </td>
                            </tr>
                            <tr className="h-16 bg-amber-50/5">
                              <td className="border border-gray-400 px-3 py-2 text-center font-bold font-mono text-amber-700">{q.or.questionNumber}</td>
                              <td className="border border-gray-400 px-3 py-2 text-gray-700 text-[11px]">
                                {q.or.text ? q.or.text : <span className="text-gray-400 italic">[ Write alternative question contents here... ]</span>}
                              </td>
                              <td className="border border-gray-400 px-3 py-2 text-center font-bold text-amber-700">{q.or.maxMarks} M</td>
                            </tr>
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signature rows */}
              <div className="mt-16 pt-6 border-t border-dashed border-gray-300 flex justify-between text-center text-xs">
                <div>
                  <p className="font-semibold text-gray-800">________________________</p>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Course Coordinator</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">________________________</p>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Module Lead / HOD</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyQuestionPapers;

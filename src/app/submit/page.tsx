"use client";

import React, { useState, useEffect, Suspense } from "react";
import "./submit.css";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X, Upload } from "lucide-react";
import * as XLSX from 'xlsx';

function SubmitPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(!!editId);
  const [activeTab, setActiveTab] = useState<"best-practice" | "problem" | "supporting-slide">("best-practice");
  const [pendingSubmissionType, setPendingSubmissionType] = useState<"BestPractice" | "RepetitiveProblem" | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileImportTarget, setFileImportTarget] = useState<"calculation" | "impact" | "action" | "custom" | null>(null);

  const [title, setTitle] = useState("");
  
  // Cycle fields
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  
  // Best Practice fields
  const [objective, setObjective] = useState("");
  const [problemAddressed, setProblemAddressed] = useState("");
  const [methodology, setMethodology] = useState("");
  const [impactSavings, setImpactSavings] = useState("");
  const [calculationTable, setCalculationTable] = useState<any[]>([
    ["Metric", "Before", "After", "Gain"],
    ["", "", "", ""]
  ]);
  
  // Problem fields
  const [equipmentDetails, setEquipmentDetails] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [whyWhyAnalysis, setWhyWhyAnalysis] = useState([""]);
  const [impactCalculation, setImpactCalculation] = useState<any[]>(() => [["Parameter (e.g. Tripping Freq)", "Value", "Calculation"], ["", "", ""]]);
  const [actionTakenTable, setActionTakenTable] = useState<any[]>(() => [["Action Taken / Planned", "Target (e.g. Shutdown)", "Status"], ["", "", ""]]);
  
  // Supporting Slide fields
  const [supportingSlideType, setSupportingSlideType] = useState<"BestPractice" | "RepetitiveProblem">("BestPractice");
  const [customTable, setCustomTable] = useState<string[][]>([
    ["Header 1", "Header 2", "Header 3"],
    ["Data 1", "Data 2", "Data 3"]
  ]);

  // Images
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [supportingImage, setSupportingImage] = useState<File | null>(null);
  
  // Custom Images for Supporting Slide
  const [suppImg1, setSuppImg1] = useState<File | null>(null);
  const [suppImg2, setSuppImg2] = useState<File | null>(null);
  const [suppImg3, setSuppImg3] = useState<File | null>(null);

  useEffect(() => {
    // Prevent hydration mismatch by rendering default states safely
    fetch('/api/cycles')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const activeCycles = data.data.filter((c: any) => c.isActive);
          setCycles(activeCycles);
          if (activeCycles.length > 0) {
            setSelectedCycleId(activeCycles[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (editId) {
      fetch(`/api/submissions/${editId}`)
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data) {
             const data = res.data;
             setTitle(data.title || "");
             
             if (data.type === "RepetitiveProblem") {
               setActiveTab("problem");
               setEquipmentDetails(data.equipmentDetails || "");
               setProblemStatement(data.problemStatement || "");
               try { const parsed = JSON.parse(data.whyWhyAnalysis); if(Array.isArray(parsed)) setWhyWhyAnalysis(parsed); } catch(e){}
               try { const parsed = JSON.parse(data.impactCalculation); if(Array.isArray(parsed)) setImpactCalculation(parsed); } catch(e){}
               try { const parsed = JSON.parse(data.actionTakenTable); if(Array.isArray(parsed)) setActionTakenTable(parsed); } catch(e){}
             } else if (data.type === "SupportingSlide") {
               setActiveTab("supporting-slide");
               setSupportingSlideType(data.supportingSlideType || "BestPractice");
               try { const parsed = JSON.parse(data.customTable); if(Array.isArray(parsed)) setCustomTable(parsed); } catch(e){}
             } else {
               setActiveTab("best-practice");
               setObjective(data.objective || "");
               setProblemAddressed(data.problemAddressed || "");
               setMethodology(data.methodology || "");
               setImpactSavings(data.impactSavings ? data.impactSavings.toString() : "");
               try { const parsed = JSON.parse(data.calculationTable); if(Array.isArray(parsed)) setCalculationTable(parsed); } catch(e){}
             }
          }
        })
        .catch(err => console.error(err));
    }
  }, [editId]);

  const handleWhyChange = (index: number, val: string) => {
    const newWhys = [...whyWhyAnalysis];
    newWhys[index] = val;
    setWhyWhyAnalysis(newWhys);
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      return data.success ? data.url : null;
    } catch(e) {
      return null;
    }
  };

  const addCustomRow = () => {
    if (customTable.length === 0) {
      setCustomTable([[""]]);
      return;
    }
    const cols = customTable[0].length;
    setCustomTable([...customTable, Array(cols).fill("")]);
  };

  const addCustomCol = () => {
    if (customTable.length === 0) {
      setCustomTable([[""]]);
      return;
    }
    setCustomTable(customTable.map(row => [...row, ""]));
  };

  const removeCustomRow = (idx: number) => {
    setCustomTable(customTable.filter((_, i) => i !== idx));
  };

  const removeCustomCol = (idx: number) => {
    setCustomTable(customTable.map(row => row.filter((_, i) => i !== idx)));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fileImportTarget) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result as string;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];

        if (!data || data.length === 0) {
          alert("File is empty or invalid format.");
          return;
        }

        if (fileImportTarget === "calculation") {
          const stringData = data.filter(row => row.length > 0).map(row => 
            row.map(cell => cell?.toString() || "")
          );
          if (stringData.length > 0) {
            const maxCols = Math.max(...stringData.map(r => r.length));
            const paddedData = stringData.map(r => {
              const newRow = [...r];
              while (newRow.length < maxCols) newRow.push("");
              return newRow;
            });
            setCalculationTable(paddedData);
          }
        } else if (fileImportTarget === "impact") {
          const stringData = data.filter((row: any[]) => row.length > 0).map((row: any[]) => 
            row.map(cell => cell?.toString() || "")
          );
          if (stringData.length > 0) {
            const maxCols = Math.max(...stringData.map((r: any[]) => r.length));
            const paddedData = stringData.map((r: any[]) => {
              const newRow = [...r];
              while (newRow.length < maxCols) newRow.push("");
              return newRow;
            });
            setImpactCalculation(paddedData);
          }
        } else if (fileImportTarget === "action") {
          const stringData = data.filter((row: any[]) => row.length > 0).map((row: any[]) => 
            row.map(cell => cell?.toString() || "")
          );
          if (stringData.length > 0) {
            const maxCols = Math.max(...stringData.map((r: any[]) => r.length));
            const paddedData = stringData.map((r: any[]) => {
              const newRow = [...r];
              while (newRow.length < maxCols) newRow.push("");
              return newRow;
            });
            setActionTakenTable(paddedData);
          }
        } else if (fileImportTarget === "custom") {
          const stringData = data.filter(row => row.length > 0).map(row => 
            row.map(cell => cell?.toString() || "")
          );
          if (stringData.length > 0) {
            const maxCols = Math.max(...stringData.map(r => r.length));
            const paddedData = stringData.map(r => {
              const newRow = [...r];
              while (newRow.length < maxCols) newRow.push("");
              return newRow;
            });
            setCustomTable(paddedData);
          }
        }
      } catch (err) {
        alert("Error parsing file. Please ensure it is a valid CSV or XLSX.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
    setFileImportTarget(null);
  };

  const submitSingle = async (payload: any, submitStatus: string) => {
    const url = editId ? `/api/submissions/${editId}` : "/api/submissions";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed");
    }
    return res;
  };

  const handleSubmit = async (e: React.FormEvent, submitStatus: "Draft" | "Submitted") => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!editId && activeTab === "supporting-slide" && pendingSubmissionType) {
        const parentPayload: any = {
          type: pendingSubmissionType,
          title,
          description: pendingSubmissionType === "BestPractice" ? methodology : problemStatement,
          status: submitStatus,
          objective, problemAddressed, methodology, impactSavings: parseFloat(impactSavings) || 0, calculationTable: JSON.stringify(calculationTable),
          equipmentDetails, problemStatement, whyWhyAnalysis: JSON.stringify(whyWhyAnalysis), impactCalculation: JSON.stringify(impactCalculation), actionTakenTable: JSON.stringify(actionTakenTable),
          supportingSlideType: pendingSubmissionType, customTable: "[]", supportingImages: [],
          cycleId: selectedCycleId || null
        };
        if (beforeImage) parentPayload.beforeImageUrl = await uploadImage(beforeImage) || "";
        if (afterImage) parentPayload.afterImageUrl = await uploadImage(afterImage) || "";
        if (supportingImage) parentPayload.attachmentUrl = await uploadImage(supportingImage) || "";
        
        await submitSingle(parentPayload, submitStatus);

        const ssPayload: any = {
          type: "SupportingSlide",
          title: `Supporting Doc: ${title}`,
          description: "Supporting slide",
          status: submitStatus,
          objective, problemAddressed, methodology, impactSavings: 0, calculationTable: "[]",
          equipmentDetails, problemStatement, whyWhyAnalysis: "[]", impactCalculation: "[]", actionTakenTable: "[]",
          supportingSlideType: pendingSubmissionType,
          customTable: JSON.stringify(customTable),
          supportingImages: [],
          cycleId: selectedCycleId || null
        };
        let i1 = ""; let i2 = ""; let i3 = "";
        if (suppImg1) i1 = await uploadImage(suppImg1) || "";
        if (suppImg2) i2 = await uploadImage(suppImg2) || "";
        if (suppImg3) i3 = await uploadImage(suppImg3) || "";
        ssPayload.supportingImages = [i1, i2, i3].filter(Boolean);

        await submitSingle(ssPayload, submitStatus);

      } else {
        const payload: any = {
          type: activeTab === "best-practice" ? "BestPractice" : (activeTab === "problem" ? "RepetitiveProblem" : "SupportingSlide"),
          title,
          description: activeTab === "best-practice" ? methodology : (activeTab === "problem" ? problemStatement : "Supporting slide"),
          status: submitStatus,
          objective, problemAddressed, methodology, impactSavings: parseFloat(impactSavings) || 0, calculationTable: JSON.stringify(calculationTable),
          equipmentDetails, problemStatement, whyWhyAnalysis: JSON.stringify(whyWhyAnalysis), impactCalculation: JSON.stringify(impactCalculation), actionTakenTable: JSON.stringify(actionTakenTable),
          supportingSlideType, customTable: JSON.stringify(customTable), supportingImages: [],
          cycleId: selectedCycleId || null
        };

        if (activeTab === "supporting-slide") {
          let i1 = ""; let i2 = ""; let i3 = "";
          if (suppImg1) i1 = await uploadImage(suppImg1) || "";
          if (suppImg2) i2 = await uploadImage(suppImg2) || "";
          if (suppImg3) i3 = await uploadImage(suppImg3) || "";
          payload.supportingImages = [i1, i2, i3].filter(Boolean);
        } else {
          if (beforeImage) payload.beforeImageUrl = await uploadImage(beforeImage) || "";
          if (afterImage) payload.afterImageUrl = await uploadImage(afterImage) || "";
          if (supportingImage) payload.attachmentUrl = await uploadImage(supportingImage) || "";
        }
        
        await submitSingle(payload, submitStatus);
      }

      alert(editId ? `Successfully updated as ${submitStatus}!` : `Successfully saved as ${submitStatus}!`);
      router.push("/dashboard");
    } catch (err: any) {
      alert("Error saving data: " + err.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="submit-container">
      <div className="submit-header">
        <h1>{editId ? "Edit Submission" : "Monthly Workshop Submission"}</h1>
        <p>{editId ? "Update your previously submitted details" : "Submit your department's monthly data for the presentation"}</p>
        
        {!editId && cycles.length > 0 && selectedCycleId && (
          <div style={{ marginTop: '1.5rem', background: 'rgba(10, 61, 98, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--jspl-accent)', display: 'inline-block' }}>
            {(() => {
              const activeCycle = cycles.find(c => c.id === selectedCycleId);
              if (!activeCycle) return null;
              
              const diffTime = Math.max(0, new Date(activeCycle.endDate).getTime() - new Date().getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              return (
                <div style={{ fontWeight: 'bold', color: 'var(--jspl-blue)' }}>
                  {diffDays > 0 ? `⏳ ${diffDays} days left for submission in the ${activeCycle.name} cycle!` : `⚠️ The ${activeCycle.name} cycle window closes today!`}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <input type="file" id="tableImportInput" style={{ display: 'none' }} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileUpload} />

      {isPreviewMode ? (
        <div className="preview-container glass" style={{ padding: '2rem', borderRadius: '12px' }}>
          <h2 style={{ color: 'var(--jspl-blue)', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Submission Preview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Title</p>
              <p style={{ fontWeight: 'bold' }}>{title}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Department</p>
              <p style={{ fontWeight: 'bold', color: 'var(--jspl-blue)' }}>Automatically Linked</p>
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }} onClick={() => setIsPreviewMode(false)}>
              Unlock for Editing
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <label style={{ flex: 1, minWidth: '200px', border: activeTab === 'best-practice' ? '2px solid var(--jspl-blue)' : '1px solid var(--glass-border)', borderRadius: '8px', padding: '1rem', cursor: 'pointer', backgroundColor: activeTab === 'best-practice' ? 'rgba(74,144,226,0.1)' : 'var(--bg-main)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}>
              <input type="radio" name="submissionType" checked={activeTab === 'best-practice'} onChange={() => setActiveTab('best-practice')} style={{ width: '24px', height: '24px', accentColor: 'var(--jspl-blue)' }} />
              <div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--jspl-blue)', display: 'block' }}>Best Practice</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Standard template</span>
              </div>
            </label>
            <label style={{ flex: 1, minWidth: '200px', border: activeTab === 'problem' ? '2px solid var(--jspl-blue)' : '1px solid var(--glass-border)', borderRadius: '8px', padding: '1rem', cursor: 'pointer', backgroundColor: activeTab === 'problem' ? 'rgba(74,144,226,0.1)' : 'var(--bg-main)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}>
              <input type="radio" name="submissionType" checked={activeTab === 'problem'} onChange={() => setActiveTab('problem')} style={{ width: '24px', height: '24px', accentColor: 'var(--jspl-blue)' }} />
              <div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--jspl-blue)', display: 'block' }}>Repetitive Problem</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>5-Why Analysis</span>
              </div>
            </label>
            <label style={{ flex: 1, minWidth: '200px', border: activeTab === 'supporting-slide' ? '2px solid var(--jspl-blue)' : '1px solid var(--glass-border)', borderRadius: '8px', padding: '1rem', cursor: 'pointer', backgroundColor: activeTab === 'supporting-slide' ? 'rgba(74,144,226,0.1)' : 'var(--bg-main)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}>
              <input type="radio" name="submissionType" checked={activeTab === 'supporting-slide'} onChange={() => setActiveTab('supporting-slide')} style={{ width: '24px', height: '24px', accentColor: 'var(--jspl-blue)' }} />
              <div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--jspl-blue)', display: 'block' }}>Supporting Slide</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Custom table & pictures</span>
              </div>
            </label>
          </div>

          <form onSubmit={(e) => handleSubmit(e, "Submitted")} className="submit-form glass">

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label>Submission Title</label>
          <input type="text" className="input-field" placeholder="e.g., Blade Thickness Optimization" value={title} onChange={(e)=>setTitle(e.target.value)} required />
        </div>

        {!editId && cycles.length > 0 && (
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="section-label">Select Cycle</label>
            <select className="input-field" value={selectedCycleId} onChange={(e)=>setSelectedCycleId(e.target.value)} required>
              {cycles.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === "best-practice" ? (
          <>
            <div className="form-group">
              <label>Objective / Purpose</label>
              <textarea className="input-field" rows={2} value={objective} onChange={(e)=>setObjective(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Problem Addressed</label>
              <textarea className="input-field" rows={2} value={problemAddressed} onChange={(e)=>setProblemAddressed(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Methodology / Innovation</label>
              <textarea className="input-field" rows={3} value={methodology} onChange={(e)=>setMethodology(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Impact / Savings (Rs. Lakhs)</label>
              <input type="number" className="input-field" value={impactSavings} onChange={(e)=>setImpactSavings(e.target.value)} required />
            </div>
            
            <label className="section-label">Calculation Table (Metrics)</label>
            <div style={{ overflowX: 'auto', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                <tbody>
                  {calculationTable.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {Array.isArray(row) ? row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ position: 'relative', border: '1px solid var(--glass-border)', padding: '0' }}>
                          <input 
                            type="text" 
                            className="input-field"
                            value={cell} 
                            onChange={e => {
                              const newTable = [...calculationTable];
                              newTable[rIdx] = [...newTable[rIdx]];
                              newTable[rIdx][cIdx] = e.target.value;
                              setCalculationTable(newTable);
                            }} 
                            style={{ width: '100%', border: 'none', background: 'transparent', borderRadius: '0' }}
                          />
                          {rIdx === 0 && calculationTable[0].length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => setCalculationTable(calculationTable.map(r => Array.isArray(r) ? r.filter((_, i) => i !== cIdx) : r))} 
                              style={{ display: 'block', margin: '4px auto', background: '#ffebee', color: '#d32f2f', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
                            >
                              - Col
                            </button>
                          )}
                        </td>
                      )) : (
                        <td colSpan={4} style={{ padding: '0.5rem', color: 'red' }}>Legacy format detected. Please re-import as spreadsheet.</td>
                      )}
                      {calculationTable.length > 1 && (
                        <td style={{ width: '40px', textAlign: 'center' }}>
                          <button type="button" className="btn" style={{ padding: '0.2rem 0.5rem', background: '#ffebee', color: '#d32f2f' }} onClick={() => setCalculationTable(calculationTable.filter((_, i) => i !== rIdx))}><X size={14}/></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => {
                  if (calculationTable.length === 0) setCalculationTable([[""]]);
                  else setCalculationTable([...calculationTable, Array(calculationTable[0].length).fill("")]);
                }}><Plus size={14}/> Add Row</button>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => {
                  if (calculationTable.length === 0) setCalculationTable([[""]]);
                  else setCalculationTable(calculationTable.map(row => Array.isArray(row) ? [...row, ""] : row));
                }}><Plus size={14}/> Add Column</button>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => { setFileImportTarget("calculation"); document.getElementById('tableImportInput')?.click(); }}>
                  <Upload size={14} /> Import File
                </button>
              </div>
            </div>

            <label className="section-label" style={{ marginTop: '1rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--jspl-blue)' }}>Photos & Evidence</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Before Image (Optional)</label>
                <input type="file" className="input-field" accept="image/*" onChange={(e) => setBeforeImage(e.target.files?.[0] || null)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>After Image (Optional)</label>
                <input type="file" className="input-field" accept="image/*" onChange={(e) => setAfterImage(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>Supporting Image (Optional)</label>
              <input type="file" className="input-field" accept="image/*" onChange={(e) => setSupportingImage(e.target.files?.[0] || null)} />
            </div>
          </>
        ) : activeTab === "problem" ? (
          <>
            <div className="form-group">
              <label>Equipment Details</label>
              <input type="text" className="input-field" value={equipmentDetails} onChange={(e)=>setEquipmentDetails(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Problem Statement</label>
              <textarea className="input-field" rows={3} value={problemStatement} onChange={(e)=>setProblemStatement(e.target.value)} required />
            </div>

            <label className="section-label">Impact Calculation</label>
            <div style={{ overflowX: 'auto', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                <tbody>
                  {impactCalculation.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {Array.isArray(row) ? row.map((cell: string, cIdx: number) => (
                        <td key={cIdx} style={{ position: 'relative', border: '1px solid var(--glass-border)', padding: '0' }}>
                          <input
                            type="text"
                            className="input-field"
                            value={cell}
                            onChange={e => {
                              const newTable = [...impactCalculation];
                              newTable[rIdx] = [...newTable[rIdx]];
                              newTable[rIdx][cIdx] = e.target.value;
                              setImpactCalculation(newTable);
                            }}
                            style={{ width: '100%', border: 'none', background: 'transparent', borderRadius: '0' }}
                          />
                          {rIdx === 0 && impactCalculation[0].length > 1 && (
                            <button
                              type="button"
                              onClick={() => setImpactCalculation(impactCalculation.map((r: any) => Array.isArray(r) ? r.filter((_: any, i: number) => i !== cIdx) : r))}
                              style={{ display: 'block', margin: '4px auto', background: '#ffebee', color: '#d32f2f', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
                            >
                              - Col
                            </button>
                          )}
                        </td>
                      )) : (
                        <td colSpan={4} style={{ padding: '0.5rem', color: 'red' }}>Legacy format detected. Please re-import as spreadsheet.</td>
                      )}
                      {impactCalculation.length > 1 && (
                        <td style={{ width: '40px', textAlign: 'center' }}>
                          <button type="button" className="btn" style={{ padding: '0.2rem 0.5rem', background: '#ffebee', color: '#d32f2f' }} onClick={() => setImpactCalculation(impactCalculation.filter((_: any, i: number) => i !== rIdx))}><X size={14}/></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => {
                  if (impactCalculation.length === 0) setImpactCalculation([[""]]);
                  else setImpactCalculation([...impactCalculation, Array(impactCalculation[0].length).fill("")]);
                }}><Plus size={14}/> Add Row</button>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => {
                  if (impactCalculation.length === 0) setImpactCalculation([[""]]);
                  else setImpactCalculation(impactCalculation.map((row: any) => Array.isArray(row) ? [...row, ""] : row));
                }}><Plus size={14}/> Add Column</button>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => { setFileImportTarget("impact"); document.getElementById('tableImportInput')?.click(); }}>
                  <Upload size={14} /> Import File
                </button>
              </div>
            </div>
            
            <label className="section-label">Why-Why Analysis</label>
            {whyWhyAnalysis.map((why, idx) => (
              <div className="form-group" key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input type="text" className="input-field" style={{ flex: 1 }} placeholder={`Why ${idx + 1}?`} value={why} onChange={(e) => handleWhyChange(idx, e.target.value)} />
                {idx > 0 && <button type="button" className="btn" style={{ padding: '0.2rem 0.5rem', background: '#ffebee', color: '#d32f2f' }} onClick={() => setWhyWhyAnalysis(whyWhyAnalysis.filter((_, i) => i !== idx))}>X</button>}
              </div>
            ))}
            {whyWhyAnalysis.length < 8 && (
              <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginBottom: '1rem' }} onClick={() => setWhyWhyAnalysis([...whyWhyAnalysis, ""])}>+ Add Why</button>
            )}

            <label className="section-label">Action Taken Table</label>
            <div style={{ overflowX: 'auto', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                <tbody>
                  {actionTakenTable.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {Array.isArray(row) ? row.map((cell: string, cIdx: number) => (
                        <td key={cIdx} style={{ position: 'relative', border: '1px solid var(--glass-border)', padding: '0' }}>
                          <input
                            type="text"
                            className="input-field"
                            value={cell}
                            onChange={e => {
                              const newTable = [...actionTakenTable];
                              newTable[rIdx] = [...newTable[rIdx]];
                              newTable[rIdx][cIdx] = e.target.value;
                              setActionTakenTable(newTable);
                            }}
                            style={{ width: '100%', border: 'none', background: 'transparent', borderRadius: '0' }}
                          />
                          {rIdx === 0 && actionTakenTable[0].length > 1 && (
                            <button
                              type="button"
                              onClick={() => setActionTakenTable(actionTakenTable.map((r: any) => Array.isArray(r) ? r.filter((_: any, i: number) => i !== cIdx) : r))}
                              style={{ display: 'block', margin: '4px auto', background: '#ffebee', color: '#d32f2f', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
                            >
                              - Col
                            </button>
                          )}
                        </td>
                      )) : (
                        <td colSpan={4} style={{ padding: '0.5rem', color: 'red' }}>Legacy format detected. Please re-import as spreadsheet.</td>
                      )}
                      {actionTakenTable.length > 1 && (
                        <td style={{ width: '40px', textAlign: 'center' }}>
                          <button type="button" className="btn" style={{ padding: '0.2rem 0.5rem', background: '#ffebee', color: '#d32f2f' }} onClick={() => setActionTakenTable(actionTakenTable.filter((_: any, i: number) => i !== rIdx))}><X size={14}/></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => {
                  if (actionTakenTable.length === 0) setActionTakenTable([[""]]);
                  else setActionTakenTable([...actionTakenTable, Array(actionTakenTable[0].length).fill("")]);
                }}><Plus size={14}/> Add Row</button>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => {
                  if (actionTakenTable.length === 0) setActionTakenTable([[""]]);
                  else setActionTakenTable(actionTakenTable.map((row: any) => Array.isArray(row) ? [...row, ""] : row));
                }}><Plus size={14}/> Add Column</button>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => { setFileImportTarget("action"); document.getElementById('tableImportInput')?.click(); }}>
                  <Upload size={14} /> Import File
                </button>
              </div>
            </div>

            <label className="section-label" style={{ marginTop: '1rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--jspl-blue)' }}>Supporting Evidence</label>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>Upload Image (Optional)</label>
              <input type="file" className="input-field" accept="image/*" onChange={(e) => setSupportingImage(e.target.files?.[0] || null)} />
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Select Category</label>
              <select className="input-field" value={supportingSlideType} onChange={(e) => setSupportingSlideType(e.target.value as any)}>
                <option value="BestPractice">Best Practice</option>
                <option value="RepetitiveProblem">Repetitive Problem</option>
              </select>
            </div>
            
            <label className="section-label">Custom Table</label>
            <div style={{ overflowX: 'auto', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                <tbody>
                  {customTable.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ position: 'relative', border: '1px solid var(--glass-border)', padding: '0' }}>
                          <input 
                            type="text" 
                            className="input-field"
                            value={cell} 
                            onChange={e => {
                              const newTable = [...customTable];
                              newTable[rIdx][cIdx] = e.target.value;
                              setCustomTable(newTable);
                            }} 
                            style={{ width: '100%', border: 'none', background: 'transparent', borderRadius: '0' }}
                          />
                          {rIdx === 0 && customTable[0].length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeCustomCol(cIdx)} 
                              style={{ display: 'block', margin: '4px auto', background: '#ffebee', color: '#d32f2f', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
                            >
                              - Col
                            </button>
                          )}
                        </td>
                      ))}
                      {customTable.length > 1 && (
                        <td style={{ width: '40px', textAlign: 'center' }}>
                          <button type="button" className="btn" style={{ padding: '0.2rem 0.5rem', background: '#ffebee', color: '#d32f2f' }} onClick={() => removeCustomRow(rIdx)}><X size={14}/></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={addCustomRow}><Plus size={14}/> Add Row</button>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={addCustomCol}><Plus size={14}/> Add Column</button>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => { setFileImportTarget("custom"); document.getElementById('tableImportInput')?.click(); }}>
                  <Upload size={14} /> Import File
                </button>
              </div>
            </div>

            <label className="section-label" style={{ marginTop: '1rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--jspl-blue)' }}>Upload Pictures (Up to 3)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label>Picture 1</label>
                <input type="file" className="input-field" accept="image/*" onChange={(e) => setSuppImg1(e.target.files?.[0] || null)} />
              </div>
              <div className="form-group">
                <label>Picture 2</label>
                <input type="file" className="input-field" accept="image/*" onChange={(e) => setSuppImg2(e.target.files?.[0] || null)} />
              </div>
              <div className="form-group">
                <label>Picture 3</label>
                <input type="file" className="input-field" accept="image/*" onChange={(e) => setSuppImg3(e.target.files?.[0] || null)} />
              </div>
            </div>
          </>
        )}
        <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          {(activeTab === "best-practice" || activeTab === "problem") && !editId ? (
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
              setPendingSubmissionType(activeTab === "best-practice" ? "BestPractice" : "RepetitiveProblem");
              setSupportingSlideType(activeTab === "best-practice" ? "BestPractice" : "RepetitiveProblem");
              setActiveTab("supporting-slide");
            }}>
              Next: Add Supporting Slide (Mandatory)
            </button>
          ) : (
            <>
              <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--jspl-blue)', color: 'var(--jspl-blue)' }} onClick={(e) => handleSubmit(e, "Draft")} disabled={loading}>
                {loading ? "Saving..." : "Save as Draft"}
              </button>
              
              <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={(e) => handleSubmit(e, "Submitted")} disabled={loading}>
                {loading ? (editId ? "Updating..." : "Submitting...") : (editId ? "Update Submission" : "Final Submit")}
              </button>
            </>
          )}
        </div>
      </form>
      </>
      )}
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading form...</div>}>
      <SubmitPageContent />
    </Suspense>
  );
}

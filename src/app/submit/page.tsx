"use client";

import React, { useState, useEffect, Suspense } from "react";
import "./submit.css";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";

function SubmitPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(!!editId);
  const [activeTab, setActiveTab] = useState<"best-practice" | "problem" | "supporting-slide">("best-practice");
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  
  // Best Practice fields
  const [objective, setObjective] = useState("");
  const [problemAddressed, setProblemAddressed] = useState("");
  const [methodology, setMethodology] = useState("");
  const [impactSavings, setImpactSavings] = useState("");
  const [calculationTable, setCalculationTable] = useState([{ metric: "", before: "", after: "", gain: "" }]);
  
  // Problem fields
  const [equipmentDetails, setEquipmentDetails] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [whyWhyAnalysis, setWhyWhyAnalysis] = useState(["", "", "", "", ""]);
  const [impactCalculation, setImpactCalculation] = useState([{ parameter: "", value: "", calculation: "" }]);
  const [actionTakenTable, setActionTakenTable] = useState([{ action: "", target: "", status: "" }]);
  
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
               try { if (data.whyWhyAnalysis) setWhyWhyAnalysis(JSON.parse(data.whyWhyAnalysis)); } catch(e){}
               try { if (data.impactCalculation) setImpactCalculation(JSON.parse(data.impactCalculation)); } catch(e){}
               try { if (data.actionTakenTable) setActionTakenTable(JSON.parse(data.actionTakenTable)); } catch(e){}
             } else if (data.type === "SupportingSlide") {
               setActiveTab("supporting-slide");
               setSupportingSlideType(data.supportingSlideType || "BestPractice");
               try { if (data.customTable) setCustomTable(JSON.parse(data.customTable)); } catch(e){}
             } else {
               setActiveTab("best-practice");
               setObjective(data.objective || "");
               setProblemAddressed(data.problemAddressed || "");
               setMethodology(data.methodology || "");
               setImpactSavings(data.impactSavings ? data.impactSavings.toString() : "");
               try { if (data.calculationTable) setCalculationTable(JSON.parse(data.calculationTable)); } catch(e){}
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

  const handleSubmit = async (e: React.FormEvent, submitStatus: "Draft" | "Submitted") => {
    e.preventDefault();
    setLoading(true);

    const payload: any = {
      type: activeTab === "best-practice" ? "BestPractice" : (activeTab === "problem" ? "RepetitiveProblem" : "SupportingSlide"),
      title,
      description: activeTab === "best-practice" ? methodology : (activeTab === "problem" ? problemStatement : "Supporting slide"),
      status: submitStatus,
      
      // Best Practice
      objective,
      problemAddressed,
      methodology,
      impactSavings: parseFloat(impactSavings) || 0,
      calculationTable: JSON.stringify(calculationTable),
      
      // Problem
      equipmentDetails,
      problemStatement,
      whyWhyAnalysis: JSON.stringify(whyWhyAnalysis),
      impactCalculation: JSON.stringify(impactCalculation),
      actionTakenTable: JSON.stringify(actionTakenTable),
      
      // Supporting Slide
      supportingSlideType,
      customTable: JSON.stringify(customTable),
      supportingImages: []
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

    try {
      const url = editId ? `/api/submissions/${editId}` : "/api/submissions";
      const method = editId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        alert(editId ? `Successfully updated as ${submitStatus}!` : `Successfully saved as ${submitStatus}!`);
        router.push("/dashboard");
      } else {
        const errData = await res.json();
        alert("Error saving data: " + errData.error);
      }
    } catch(err) {
      alert("Network Error");
    }
    setLoading(false);
  };

  return (
    <div className="submit-container">
      <div className="submit-header">
        <h1>{editId ? "Edit Submission" : "Monthly Workshop Submission"}</h1>
        <p>{editId ? "Update your previously submitted details" : "Submit your department's monthly data for the presentation"}</p>
      </div>

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

          <form className="submit-form glass">

        <div className="form-group">
          <label>Submission Title</label>
          <input type="text" className="input-field" placeholder="e.g., Blade Thickness Optimization" value={title} onChange={(e)=>setTitle(e.target.value)} required />
        </div>

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
            {calculationTable.map((row, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input type="text" className="input-field" placeholder="Metric (e.g. Downtime)" value={row.metric} onChange={(e) => { const nt = [...calculationTable]; nt[idx].metric = e.target.value; setCalculationTable(nt); }} />
                <input type="text" className="input-field" placeholder="Before" value={row.before} onChange={(e) => { const nt = [...calculationTable]; nt[idx].before = e.target.value; setCalculationTable(nt); }} />
                <input type="text" className="input-field" placeholder="After" value={row.after} onChange={(e) => { const nt = [...calculationTable]; nt[idx].after = e.target.value; setCalculationTable(nt); }} />
                <input type="text" className="input-field" placeholder="Gain" value={row.gain} onChange={(e) => { const nt = [...calculationTable]; nt[idx].gain = e.target.value; setCalculationTable(nt); }} />
                {idx > 0 && <button type="button" className="btn" style={{ padding: '0.2rem 0.5rem', background: '#ffebee', color: '#d32f2f' }} onClick={() => setCalculationTable(calculationTable.filter((_, i) => i !== idx))}>X</button>}
              </div>
            ))}
            <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginBottom: '1rem' }} onClick={() => setCalculationTable([...calculationTable, {metric: "", before: "", after: "", gain: ""}])}>+ Add Metric Row</button>

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
            {impactCalculation.map((row, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input type="text" className="input-field" placeholder="Parameter (e.g. Tripping Freq)" value={row.parameter} onChange={(e) => { const ni = [...impactCalculation]; ni[idx].parameter = e.target.value; setImpactCalculation(ni); }} />
                <input type="text" className="input-field" placeholder="Value" value={row.value} onChange={(e) => { const ni = [...impactCalculation]; ni[idx].value = e.target.value; setImpactCalculation(ni); }} />
                <input type="text" className="input-field" placeholder="Calculation" value={row.calculation} onChange={(e) => { const ni = [...impactCalculation]; ni[idx].calculation = e.target.value; setImpactCalculation(ni); }} />
                {idx > 0 && <button type="button" className="btn" style={{ padding: '0.2rem 0.5rem', background: '#ffebee', color: '#d32f2f' }} onClick={() => setImpactCalculation(impactCalculation.filter((_, i) => i !== idx))}>X</button>}
              </div>
            ))}
            <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginBottom: '1rem' }} onClick={() => setImpactCalculation([...impactCalculation, {parameter: "", value: "", calculation: ""}])}>+ Add Impact Row</button>
            
            <label className="section-label">5-Why Analysis</label>
            {whyWhyAnalysis.map((why, idx) => (
              <div className="form-group" key={idx}>
                <input type="text" className="input-field" placeholder={`Why ${idx + 1}?`} value={why} onChange={(e) => handleWhyChange(idx, e.target.value)} />
              </div>
            ))}

            <label className="section-label">Action Taken Table</label>
            {actionTakenTable.map((row, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input type="text" className="input-field" style={{ flex: 2 }} placeholder="Action Taken / Planned" value={row.action} onChange={(e) => { const na = [...actionTakenTable]; na[idx].action = e.target.value; setActionTakenTable(na); }} />
                <input type="text" className="input-field" style={{ flex: 1 }} placeholder="Target (e.g. Shutdown)" value={row.target} onChange={(e) => { const na = [...actionTakenTable]; na[idx].target = e.target.value; setActionTakenTable(na); }} />
                <select className="input-field" style={{ flex: 1 }} value={row.status} onChange={(e) => { const na = [...actionTakenTable]; na[idx].status = e.target.value; setActionTakenTable(na); }}>
                   <option value="">Status...</option>
                   <option value="Completed">Completed</option>
                   <option value="In Progress">In Progress</option>
                   <option value="Regular">Regular</option>
                </select>
                {idx > 0 && <button type="button" className="btn" style={{ padding: '0.2rem 0.5rem', background: '#ffebee', color: '#d32f2f' }} onClick={() => setActionTakenTable(actionTakenTable.filter((_, i) => i !== idx))}>X</button>}
              </div>
            ))}
            <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginBottom: '1rem' }} onClick={() => setActionTakenTable([...actionTakenTable, {action: "", target: "", status: ""}])}>+ Add Action Row</button>

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
                              style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', background: '#ffebee', color: '#d32f2f', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
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
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={addCustomRow}><Plus size={14}/> Add Row</button>
                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={addCustomCol}><Plus size={14}/> Add Column</button>
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
          <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--jspl-blue)', color: 'var(--jspl-blue)' }} onClick={(e) => handleSubmit(e, "Draft")} disabled={loading}>
            {loading ? "Saving..." : "Save as Draft"}
          </button>
          
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={(e) => handleSubmit(e, "Submitted")} disabled={loading}>
            {loading ? (editId ? "Updating..." : "Submitting...") : (editId ? "Update Submission" : "Final Submit")}
          </button>
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

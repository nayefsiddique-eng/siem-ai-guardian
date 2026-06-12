import { useState } from "react";
import { useSiem } from "../../hooks/useSiem";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const StatCard = ({ label, value, sub, color, icon }) => (
  <div style={{
    background: "#111318", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px",
    borderTop: "2px solid " + color,
  }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: "11px", fontWeight: 600, color: "#5a6480", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: "18px" }}>{icon}</span>
    </div>
    <div style={{ fontSize: "32px", fontWeight: 700, color: "#f0f2f7", lineHeight: 1, fontFamily: "var(--font-mono)" }}>{value}</div>
    <div style={{ fontSize: "11px", color: "#5a6480" }}>{sub}</div>
  </div>
);

const Badge = ({ label, color, bg, border }) => (
  <span style={{
    fontSize: "10px", fontWeight: 600, fontFamily: "var(--font-mono)",
    letterSpacing: "0.08em", padding: "3px 8px", borderRadius: "5px",
    color, background: bg, border: "1px solid " + border,
  }}>{label}</span>
);

const SEV = {
  critical: { color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.25)" },
  high:     { color: "#fb923c", bg: "rgba(251,146,60,0.1)",   border: "rgba(251,146,60,0.25)"  },
  medium:   { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.25)"  },
  low:      { color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.25)"  },
};

function exportCSV(alerts) {
  const headers = ["ID","Severity","Type","Status","Source IP","Dest IP","Tactic","Confidence","Time"];
  const rows = alerts.map(a => [
    a.id, a.severity, a.event_type, a.status,
    a.source_ip||"", a.dest_ip||"", a.mitre_tactic||"",
    a.confidence != null ? a.confidence+"%" : "", a.created_at||"",
  ]);
  const csv = [headers,...rows].map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  Object.assign(document.createElement("a"),{href:url,download:"sentinelops-"+Date.now()+".csv"}).click();
  URL.revokeObjectURL(url);
}

function exportJSON(alerts) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(alerts,null,2)],{type:"application/json"}));
  Object.assign(document.createElement("a"),{href:url,download:"sentinelops-"+Date.now()+".json"}).click();
  URL.revokeObjectURL(url);
}

async function downloadPDF() {
  const token = localStorage.getItem("siem_token");
  const res = await fetch(BASE+"/api/reports/pdf", {
    headers: { Authorization: "Bearer "+token },
  });
  if (!res.ok) { alert("PDF generation failed — check backend is running."); return; }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"),{href:url,download:"sentinelops-report-"+Date.now()+".pdf"}).click();
  URL.revokeObjectURL(url);
}

export default function ReportsView() {
  const { alerts = [], fetchAlerts, freeformQuery } = useSiem();
  const [aiReport, setAiReport]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loaded, setLoaded]       = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    await fetchAlerts();
    setLoaded(true);
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await downloadPDF(); showToast("PDF downloaded successfully"); }
    catch { showToast("PDF download failed","error"); }
    finally { setPdfLoading(false); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiReport(""); setActiveTab("ai report");
    const total    = alerts.length;
    const open     = alerts.filter(a=>a.status==="open").length;
    const critical = alerts.filter(a=>a.severity==="critical").length;
    const resolved = alerts.filter(a=>a.status==="resolved").length;
    const fp       = alerts.filter(a=>a.status==="false_positive").length;
    const sevCounts = ["critical","high","medium","low"].map(s=>s+": "+alerts.filter(a=>a.severity===s).length).join(", ");
    const tactics  = [...new Set(alerts.map(a=>a.mitre_tactic).filter(Boolean))].slice(0,5).join(", ")||"N/A";
    const res = await freeformQuery(
      "Generate a concise executive-level incident report.\n" +
      "Total alerts: "+total+", Open: "+open+", Critical: "+critical+", Resolved: "+resolved+", False Positives: "+fp+".\n" +
      "Severity breakdown: "+sevCounts+".\n" +
      "MITRE tactics: "+tactics+".\n" +
      "Structure: 1) Executive Summary 2) Key Findings 3) Risk Assessment 4) Recommended Actions."
    );
    setAiReport(res || "No response from AI.");
    setAiLoading(false);
  };

  if (!loaded) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:"16px" }}>
      <div style={{
        width:"56px", height:"56px", borderRadius:"14px",
        background:"linear-gradient(135deg,rgba(129,140,248,0.2),rgba(34,211,238,0.1))",
        border:"1px solid rgba(129,140,248,0.3)",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px",
      }}></div>
      <div style={{ fontSize:"16px", fontWeight:700, color:"#f0f2f7" }}>Reports & Intelligence</div>
      <div style={{ fontSize:"13px", color:"#5a6480", textAlign:"center", maxWidth:"320px", lineHeight:1.6 }}>
        Load alert data to generate threat summaries, download PDF reports, and run AI incident analysis.
      </div>
      <button onClick={load} style={{
        marginTop:"8px", padding:"12px 28px", borderRadius:"9px", cursor:"pointer",
        background:"rgba(129,140,248,0.14)", border:"1px solid rgba(129,140,248,0.35)",
        color:"#818cf8", fontSize:"13px", fontWeight:600, letterSpacing:"0.04em",
      }}>
        Load Report Data
      </button>
    </div>
  );

  const total    = alerts.length;
  const open     = alerts.filter(a=>a.status==="open").length;
  const critical = alerts.filter(a=>a.severity==="critical").length;
  const resolved = alerts.filter(a=>a.status==="resolved").length;
  const fp       = alerts.filter(a=>a.status==="false_positive").length;
  const sevCounts = ["critical","high","medium","low"].map(s=>({ label:s, count:alerts.filter(a=>a.severity===s).length }));
  const maxCount  = Math.max(...sevCounts.map(s=>s.count), 1);
  const TABS = ["summary","alerts","ai report"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px", position:"relative" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", bottom:"24px", right:"24px", zIndex:999,
          padding:"12px 20px", borderRadius:"10px",
          background: toast.type==="error" ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)",
          border: "1px solid " + (toast.type==="error" ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"),
          color: toast.type==="error" ? "#f87171" : "#34d399",
          fontSize:"13px", fontWeight:600,
          boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {toast.type==="error" ? "? " : "? "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px",
        background:"#111318", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"16px 20px",
      }}>
        <div>
          <div style={{ fontSize:"15px", fontWeight:700, color:"#f0f2f7" }}>Threat Intelligence Report</div>
          <div style={{ fontSize:"12px", color:"#5a6480", marginTop:"3px" }}>
            {new Date().toUTCString()} · {total} alerts loaded
          </div>
        </div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          {[
            { label:"? Export CSV",  action:()=>{ exportCSV(alerts); showToast("CSV exported"); },  color:"#22d3ee", border:"rgba(34,211,238,0.3)",  bg:"rgba(34,211,238,0.08)"  },
            { label:"? Export JSON", action:()=>{ exportJSON(alerts); showToast("JSON exported"); }, color:"#a78bfa", border:"rgba(167,139,250,0.3)", bg:"rgba(167,139,250,0.08)" },
            { label: pdfLoading ? "GENERATING..." : "? Download PDF",
              action: handlePDF,
              color:"#fb923c", border:"rgba(251,146,60,0.3)", bg:"rgba(251,146,60,0.08)" },
            { label:"? AI Report",   action:runAI,                                                  color:"#818cf8", border:"rgba(129,140,248,0.35)", bg:"rgba(129,140,248,0.12)" },
          ].map(b => (
            <button key={b.label} onClick={b.action} disabled={pdfLoading && b.label.includes("PDF")} style={{
              padding:"9px 16px", borderRadius:"8px", cursor:"pointer",
              background:b.bg, border:"1px solid "+b.border,
              color:b.color, fontSize:"12px", fontWeight:600,
              fontFamily:"var(--font-mono)", letterSpacing:"0.06em", transition:"all 0.15s",
              opacity: pdfLoading && b.label.includes("PDF") ? 0.6 : 1,
            }}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"12px" }}>
        <StatCard label="Total Alerts" value={total}    sub="all time"         color="#818cf8" icon=""/>
        <StatCard label="Open"         value={open}     sub="pending triage"   color="#fbbf24" icon=""/>
        <StatCard label="Critical"     value={critical} sub="immediate action" color="#f87171" icon=""/>
        <StatCard label="Resolved"     value={resolved} sub="closed"           color="#34d399" icon="?"/>
        <StatCard label="False Pos."   value={fp}       sub="noise filtered"   color="#a78bfa" icon=""/>
      </div>

      {/* Tabs */}
      <div style={{
        display:"flex", gap:"4px",
        background:"#111318", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"10px", padding:"6px",
      }}>
        {TABS.map(tab => (
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{
            flex:1, padding:"9px", borderRadius:"7px", cursor:"pointer",
            border: activeTab===tab ? "1px solid rgba(129,140,248,0.3)" : "1px solid transparent",
            background: activeTab===tab ? "rgba(129,140,248,0.12)" : "transparent",
            color: activeTab===tab ? "#818cf8" : "#5a6480",
            fontSize:"12px", fontWeight:600, fontFamily:"var(--font-mono)",
            letterSpacing:"0.06em", textTransform:"uppercase",
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* -- SUMMARY TAB -- */}
      {activeTab==="summary" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

          {/* Severity bars */}
          <div style={{ background:"#111318", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"20px" }}>
            <div style={{ fontSize:"12px", fontWeight:600, color:"#5a6480", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"18px" }}>
              Severity Distribution
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              {sevCounts.map(({label,count}) => {
                const m = SEV[label]||SEV.low;
                return (
                  <div key={label}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                      <Badge label={label.toUpperCase()} {...m}/>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:"13px", fontWeight:600, color:m.color }}>{count}</span>
                    </div>
                    <div style={{ height:"6px", borderRadius:"4px", background:"rgba(255,255,255,0.05)", overflow:"hidden" }}>
                      <div style={{
                        height:"100%", borderRadius:"4px", background:m.color,
                        width:(maxCount>0?(count/maxCount)*100:0)+"%",
                        boxShadow:"0 0 8px "+m.color+"88", transition:"width 0.6s ease",
                      }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MITRE tactics */}
          <div style={{ background:"#111318", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"20px" }}>
            <div style={{ fontSize:"12px", fontWeight:600, color:"#5a6480", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"14px" }}>
              MITRE ATT&CK Tactics
            </div>
            {(() => {
              const counts = alerts.reduce((acc,a) => { if(a.mitre_tactic) acc[a.mitre_tactic]=(acc[a.mitre_tactic]||0)+1; return acc; },{});
              const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
              return entries.length===0
                ? <div style={{ fontSize:"13px", color:"#3d4660", fontStyle:"italic" }}>No tactic data yet — inject logs to populate.</div>
                : <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                    {entries.map(([t,n]) => (
                      <div key={t} style={{
                        display:"flex", alignItems:"center", gap:"8px",
                        background:"rgba(129,140,248,0.08)", border:"1px solid rgba(129,140,248,0.2)",
                        borderRadius:"8px", padding:"7px 12px",
                      }}>
                        <span style={{ fontSize:"12px", color:"#a8b3cc", fontWeight:500 }}>{t}</span>
                        <span style={{ fontSize:"11px", fontFamily:"var(--font-mono)", color:"#818cf8", fontWeight:700 }}>{n}</span>
                      </div>
                    ))}
                  </div>;
            })()}
          </div>

          {/* Status grid */}
          <div style={{ background:"#111318", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"20px" }}>
            <div style={{ fontSize:"12px", fontWeight:600, color:"#5a6480", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"14px" }}>
              Alert Status Breakdown
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:"10px" }}>
              {[
                { label:"Open",          count:open,     color:"#fbbf24" },
                { label:"Investigating", count:alerts.filter(a=>a.status==="investigating").length, color:"#818cf8" },
                { label:"Resolved",      count:resolved, color:"#34d399" },
                { label:"False Positive",count:fp,       color:"#a78bfa" },
              ].map(({label,count,color}) => (
                <div key={label} style={{
                  background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
                  borderRadius:"9px", padding:"14px", textAlign:"center",
                }}>
                  <div style={{ fontSize:"24px", fontWeight:700, color, fontFamily:"var(--font-mono)", lineHeight:1 }}>{count}</div>
                  <div style={{ fontSize:"11px", color:"#5a6480", marginTop:"6px" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -- ALERTS TABLE TAB -- */}
      {activeTab==="alerts" && (
        <div style={{ background:"#111318", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", overflow:"hidden" }}>
          <div style={{
            display:"grid", gridTemplateColumns:"90px 100px 110px 110px 1fr 80px",
            gap:"12px", padding:"11px 18px",
            background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.07)",
          }}>
            {["Severity","Status","Source IP","Dest IP","Type / Tactic","Confidence"].map(h => (
              <span key={h} style={{ fontSize:"10px", fontWeight:600, color:"#3d4660", letterSpacing:"0.12em", textTransform:"uppercase" }}>{h}</span>
            ))}
          </div>
          <div style={{ maxHeight:"420px", overflowY:"auto" }}>
            {alerts.length===0
              ? <div style={{ padding:"40px", textAlign:"center", fontSize:"13px", color:"#3d4660" }}>No alerts loaded</div>
              : alerts.map((a,i) => {
                  const m = SEV[a.severity]||SEV.low;
                  return (
                    <div key={a.id||i} style={{
                      display:"grid", gridTemplateColumns:"90px 100px 110px 110px 1fr 80px",
                      gap:"12px", padding:"12px 18px", borderBottom:"1px solid rgba(255,255,255,0.05)",
                      transition:"background 0.12s",
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    >
                      <Badge label={(a.severity||"low").toUpperCase()} {...m}/>
                      <span style={{ fontSize:"11px", color:"#a8b3cc", fontFamily:"var(--font-mono)" }}>{a.status||"-"}</span>
                      <span style={{ fontSize:"11px", color:"#a8b3cc", fontFamily:"var(--font-mono)" }}>{a.source_ip||"-"}</span>
                      <span style={{ fontSize:"11px", color:"#a8b3cc", fontFamily:"var(--font-mono)" }}>{a.dest_ip||"-"}</span>
                      <span style={{ fontSize:"11px", color:"#a8b3cc", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {[a.event_type,a.mitre_tactic].filter(Boolean).join(" · ")||"-"}
                      </span>
                      <span style={{ fontSize:"11px", color:"#818cf8", fontFamily:"var(--font-mono)" }}>
                        {a.confidence!=null ? a.confidence+"%" : "-"}
                      </span>
                    </div>
                  );
                })
            }
          </div>
          <div style={{
            padding:"10px 18px", borderTop:"1px solid rgba(255,255,255,0.07)",
            display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <span style={{ fontSize:"11px", color:"#3d4660", fontFamily:"var(--font-mono)" }}>{alerts.length} records</span>
            <button onClick={()=>{ exportCSV(alerts); showToast("CSV exported"); }} style={{
              padding:"6px 14px", borderRadius:"6px", cursor:"pointer",
              background:"rgba(34,211,238,0.08)", border:"1px solid rgba(34,211,238,0.25)",
              color:"#22d3ee", fontSize:"11px", fontWeight:600, fontFamily:"var(--font-mono)",
            }}>? CSV</button>
          </div>
        </div>
      )}

      {/* -- AI REPORT TAB -- */}
      {activeTab==="ai report" && (
        <div style={{
          background:"#111318", border:"1px solid rgba(129,140,248,0.2)",
          borderRadius:"12px", padding:"24px", display:"flex", flexDirection:"column", gap:"16px",
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"10px" }}>
            <div>
              <div style={{ fontSize:"14px", fontWeight:700, color:"#f0f2f7" }}>AI-Generated Incident Report</div>
              <div style={{ fontSize:"11px", color:"#5a6480", marginTop:"3px" }}>Powered by SentinelOps · Gemini AI Engine</div>
            </div>
            <button onClick={runAI} disabled={aiLoading} style={{
              padding:"9px 20px", borderRadius:"8px",
              cursor: aiLoading ? "not-allowed" : "pointer",
              background: aiLoading ? "rgba(255,255,255,0.04)" : "rgba(129,140,248,0.14)",
              border:"1px solid rgba(129,140,248,0.35)",
              color: aiLoading ? "#3d4660" : "#818cf8",
              fontSize:"12px", fontWeight:600, fontFamily:"var(--font-mono)", letterSpacing:"0.06em",
            }}>
              {aiLoading ? "GENERATING..." : "? REGENERATE"}
            </button>
          </div>

          {aiLoading && (
            <div style={{
              display:"flex", alignItems:"center", gap:"14px", padding:"28px", borderRadius:"10px",
              background:"rgba(129,140,248,0.06)", border:"1px solid rgba(129,140,248,0.15)",
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation:"spin 1.2s linear infinite", flexShrink:0 }}>
                <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
                <circle cx="9" cy="9" r="7" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="22 20" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize:"13px", color:"#818cf8", fontFamily:"var(--font-mono)", letterSpacing:"0.08em" }}>
                GEMINI AI PROCESSING · ANALYZING {total} ALERTS...
              </span>
            </div>
          )}

          {aiReport && !aiLoading && (
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"10px", padding:"20px" }}>
              <pre style={{
                fontSize:"13px", color:"#a8b3cc", lineHeight:1.8,
                whiteSpace:"pre-wrap", wordBreak:"break-word",
                fontFamily:"var(--font-ui,system-ui)", margin:0,
              }}>{aiReport}</pre>
            </div>
          )}

          {!aiReport && !aiLoading && (
            <div style={{
              padding:"48px", textAlign:"center", borderRadius:"10px",
              background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ fontSize:"32px", marginBottom:"12px" }}></div>
              <div style={{ fontSize:"14px", fontWeight:600, color:"#a8b3cc", marginBottom:"6px" }}>No report generated yet</div>
              <div style={{ fontSize:"12px", color:"#3d4660" }}>Click "? AI Report" in the header bar above</div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}





import { useEffect } from "react";
import { useSiem } from "../../hooks/useSiem";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";

const SEV = [
  { key: "critical", label: "CRITICAL", color: "#f87171" },
  { key: "high",     label: "HIGH",     color: "#fb923c" },
  { key: "medium",   label: "MEDIUM",   color: "#fbbf24" },
  { key: "low",      label: "LOW",      color: "#34d399" },
];

const SEV_COLOR = {
  critical: "#f87171", high: "#fb923c", medium: "#fbbf24", low: "#34d399",
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#111318", borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.07)", padding: "20px",
      flex: 1, minWidth: 0, borderTop: "2px solid " + accent,
    }}>
      <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "#5a6480", marginBottom: "10px" }}>{label}</div>
      <div style={{ fontSize: "32px", fontWeight: 700, color: "#f0f2f7", lineHeight: 1, fontFamily: "var(--font-mono)" }}>{value || "-"}</div>
      <div style={{ fontSize: "11px", color: "#5a6480", marginTop: "6px" }}>{sub}</div>
    </div>
  );
}

function SeverityBar({ label, color, value, max }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color, letterSpacing: "0.1em", width: "60px", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: "4px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", borderRadius: "4px", background: color, transition: "width 0.6s ease", opacity: value === 0 ? 0.25 : 1 }}/>
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: value > 0 ? color : "#5a6480", width: "24px", textAlign: "right" }}>{value}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#181c24", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "8px", padding: "10px 14px",
    }}>
      {label && <div style={{ fontSize: "11px", color: "#5a6480", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>{label}</div>}
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: "12px", color: p.color || "#a8b3cc", fontFamily: "var(--font-mono)" }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

function SeverityPieChart({ dist }) {
  const data = SEV.map(s => ({ name: s.label, value: dist[s.key], color: s.color })).filter(d => d.value > 0);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ background: "#111318", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", padding: "20px" }}>
      <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "#5a6480", marginBottom: "16px" }}>
        SEVERITY BREAKDOWN
      </div>
      {total === 0 ? (
        <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#3d4660", fontFamily: "var(--font-mono)" }}>
          No alert data yet
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
                paddingAngle={3} dataKey="value" strokeWidth={0}>
                {data.map((d, i) => <Cell key={i} fill={d.color} style={{ filter: "drop-shadow(0 0 4px " + d.color + "88)" }}/>)}
              </Pie>
              <Tooltip content={<CustomTooltip />}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            {data.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color, display: "inline-block", boxShadow: "0 0 4px " + d.color }}/>
                  <span style={{ fontSize: "11px", color: "#a8b3cc", fontFamily: "var(--font-mono)" }}>{d.name}</span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: d.color, fontFamily: "var(--font-mono)" }}>
                  {d.value} <span style={{ fontSize: "10px", color: "#5a6480", fontWeight: 400 }}>({Math.round(d.value/total*100)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertTrendChart({ alerts }) {
  const now = Date.now();
  const data = Array.from({ length: 24 }, (_, i) => {
    const start = now - (24 - i) * 60 * 60 * 1000;
    const end   = start + 60 * 60 * 1000;
    const label = new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const bucket = alerts.filter(a => {
      const t = new Date(a.created_at).getTime();
      return t >= start && t < end;
    });
    return {
      time:     label,
      critical: bucket.filter(a => a.severity === "critical").length,
      high:     bucket.filter(a => a.severity === "high").length,
      medium:   bucket.filter(a => a.severity === "medium").length,
      low:      bucket.filter(a => a.severity === "low").length,
      total:    bucket.length,
    };
  });

  return (
    <div style={{ background: "#111318", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "#5a6480" }}>
          ALERT TREND | LAST 24 HOURS
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {SEV.map(s => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color, display: "inline-block" }}/>
              <span style={{ fontSize: "9px", color: "#5a6480", fontFamily: "var(--font-mono)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <defs>
            {SEV.map(s => (
              <linearGradient key={s.key} id={"grad_"+s.key} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={s.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={s.color} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
          <XAxis dataKey="time" tick={{ fill: "#3d4660", fontSize: 9, fontFamily: "var(--font-mono)" }}
            tickLine={false} axisLine={false} interval={5}/>
          <YAxis tick={{ fill: "#3d4660", fontSize: 9, fontFamily: "var(--font-mono)" }}
            tickLine={false} axisLine={false} allowDecimals={false}/>
          <Tooltip content={<CustomTooltip />}/>
          {SEV.map(s => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label}
              stroke={s.color} strokeWidth={1.5} fill={"url(#grad_"+s.key+")"}
              dot={false} activeDot={{ r: 3, fill: s.color }}/>
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function AttackTypesChart({ alerts }) {
  const counts = alerts.reduce((acc, a) => {
    const t = (a.alert_type || a.event_type || "unknown").replace(/_/g," ");
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  return (
    <div style={{ background: "#111318", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", padding: "20px" }}>
      <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "#5a6480", marginBottom: "16px" }}>
        TOP ATTACK TYPES
      </div>
      {data.length === 0 ? (
        <div style={{ height: "140px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#3d4660", fontFamily: "var(--font-mono)" }}>
          No attack data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={true} vertical={false}/>
            <XAxis dataKey="name" tick={{ fill: "#5a6480", fontSize: 9, fontFamily: "var(--font-mono)" }}
              tickLine={false} axisLine={false}/>
            <YAxis tick={{ fill: "#3d4660", fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false}/>
            <Tooltip content={<CustomTooltip />}/>
            <Bar dataKey="count" name="Alerts" radius={[4,4,0,0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={["#818cf8","#22d3ee","#f87171","#fb923c","#fbbf24","#34d399"][i % 6]}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function TopSourceIPs({ alerts }) {
  const ipMap = {};
  alerts.forEach(a => {
    if (!a.source_ip) return;
    if (!ipMap[a.source_ip]) ipMap[a.source_ip] = { total: 0, critical: 0, high: 0 };
    ipMap[a.source_ip].total++;
    if (a.severity === "critical") ipMap[a.source_ip].critical++;
    if (a.severity === "high")     ipMap[a.source_ip].high++;
  });
  const sorted = Object.entries(ipMap).sort((a,b) => b[1].total - a[1].total).slice(0,8);
  const maxCount = sorted[0]?.[1].total || 1;

  return (
    <div style={{ background: "#111318", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", padding: "20px" }}>
      <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "#5a6480", marginBottom: "18px" }}>
        TOP SOURCE IPs
      </div>
      {sorted.length === 0 ? (
        <div style={{ fontSize: "12px", color: "#3d4660", textAlign:"center", padding: "24px 0", fontFamily: "var(--font-mono)" }}>No alert sources yet</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {sorted.map(([ip, data], i) => (
            <div key={ip} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#5a6480", width: "16px", textAlign: "right", flexShrink: 0 }}>{i+1}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: data.critical > 0 ? "#f87171" : data.high > 0 ? "#fb923c" : "#a8b3cc", width: "120px", flexShrink: 0, letterSpacing: "0.04em" }}>{ip}</span>
              <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: (data.total/maxCount*100)+"%" , background: data.critical > 0 ? "#f87171" : data.high > 0 ? "#fb923c" : "#818cf8", borderRadius: "2px", transition: "width 0.6s ease" }}/>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#a8b3cc", width: "20px", textAlign: "right", flexShrink: 0 }}>{data.total}</span>
              {data.critical > 0 && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#f87171", padding: "1px 5px", borderRadius: "3px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", flexShrink: 0 }}>CRIT</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OverviewView() {
  const { stats, alerts, fetchStats, fetchAlerts } = useSiem();

  useEffect(() => { fetchStats(); fetchAlerts(); }, []);

  const dist = { critical: 0, high: 0, medium: 0, low: 0 };
  alerts.forEach(a => { if (dist[a.severity] !== undefined) dist[a.severity]++; });
  const maxDist = Math.max(...Object.values(dist), 1);

  const detectionTypes = [...new Set(alerts.map(a => a.alert_type).filter(Boolean))];
  const recentAlerts   = [...alerts].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,8);
  const DETECT_PLACEHOLDER = ["Brute Force","Port Scan","Anomaly","Data Exfil","Lateral Move"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <StatCard label="TOTAL ALERTS"  value={stats?.total_alerts || alerts.length}                                 sub="all time"         accent="#818cf8"/>
        <StatCard label="OPEN ALERTS"   value={stats?.open_alerts || alerts.filter(a=>a.status==="open").length}    sub="pending triage"   accent="#fb923c"/>
        <StatCard label="LOGS INGESTED" value={stats?.total_logs || 0}                                             sub="indexed events"   accent="#22d3ee"/>
        <StatCard label="CRITICAL"      value={dist.critical}                                                         sub="immediate action" accent="#f87171"/>
      </div>

      {/* Row 2: Severity bars + Pie chart + Detection types */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        <div style={{ background: "#111318", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", padding: "20px" }}>
          <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "#5a6480", marginBottom: "16px" }}>SEVERITY DISTRIBUTION</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {SEV.map(s => <SeverityBar key={s.key} label={s.label} color={s.color} value={dist[s.key]} max={maxDist}/>)}
          </div>
        </div>

        <SeverityPieChart dist={dist}/>

        <div style={{ background: "#111318", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", padding: "20px" }}>
          <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "#5a6480", marginBottom: "16px" }}>DETECTION TYPES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {(detectionTypes.length ? detectionTypes : DETECT_PLACEHOLDER).map(t => (
              <span key={t} style={{
                fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.06em",
                padding: "4px 10px", borderRadius: "5px",
                background: detectionTypes.length ? "rgba(129,140,248,0.1)" : "rgba(255,255,255,0.04)",
                border: "1px solid " + (detectionTypes.length ? "rgba(129,140,248,0.25)" : "rgba(255,255,255,0.07)"),
                color: detectionTypes.length ? "#818cf8" : "#5a6480",
                opacity: detectionTypes.length ? 1 : 0.45,
              }}>{t.replace(/_/g," ")}</span>
            ))}
          </div>
          {!detectionTypes.length && <div style={{ fontSize: "11px", color: "#5a6480", marginTop: "12px" }}>No detections yet</div>}
        </div>
      </div>

      {/* Row 3: Alert trend area chart */}
      <AlertTrendChart alerts={alerts}/>

      {/* Row 4: Attack types bar + Top IPs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <AttackTypesChart alerts={alerts}/>
        <TopSourceIPs alerts={alerts}/>
      </div>

      {/* Row 5: Recent alerts table */}
      <div style={{ background: "#111318", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", color: "#5a6480" }}>RECENT ALERTS</span>
          <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#5a6480" }}>{recentAlerts.length} shown</span>
        </div>
        {recentAlerts.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#3d4660" }}>No alerts detected. System monitoring active.</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["SEVERITY","TYPE","STATUS","TIME"].map(h => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "10px", fontFamily: "var(--font-mono)", letterSpacing: "0.12em", color: "#5a6480", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentAlerts.map((a,i) => (
                <tr key={a.id} style={{ borderBottom: i < recentAlerts.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "11px 20px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", color: SEV_COLOR[a.severity] || "#5a6480", fontWeight: 600 }}>
                      {(a.severity||"-").toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "11px 20px", fontSize: "12px", color: "#a8b3cc" }}>
                    {(a.alert_type||a.title||"-").replace(/_/g," ")}
                  </td>
                  <td style={{ padding: "11px 20px" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em",
                      padding: "3px 8px", borderRadius: "4px",
                      background: a.status==="open" ? "rgba(251,146,60,0.1)" : "rgba(52,211,153,0.08)",
                      border: "1px solid " + (a.status==="open" ? "rgba(251,146,60,0.25)" : "rgba(52,211,153,0.2)"),
                      color: a.status==="open" ? "#fb923c" : "#34d399",
                    }}>
                      {(a.status||"-").toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "11px 20px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#5a6480" }}>
                    {a.created_at ? new Date(a.created_at).toLocaleTimeString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

















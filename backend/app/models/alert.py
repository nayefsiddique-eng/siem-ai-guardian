from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Detection info
    alert_type = Column(String(100), index=True)         # brute_force | port_scan | threat_intel | anomaly
    severity = Column(String(20), default="medium")      # low | medium | high | critical
    title = Column(String(255))
    description = Column(Text)

    # Source
    source_ip = Column(String(45), index=True)
    affected_system = Column(String(255), nullable=True)
    username = Column(String(255), nullable=True)

    # MITRE ATT&CK
    mitre_technique_id = Column(String(20), nullable=True)    # e.g. T1110
    mitre_technique_name = Column(String(255), nullable=True) # e.g. Brute Force
    mitre_tactic = Column(String(100), nullable=True)         # e.g. Credential Access

    # AI Analysis
    ai_analysis = Column(Text, nullable=True)
    ai_risk_level = Column(String(20), nullable=True)
    ai_recommendations = Column(JSON, nullable=True)

    # State
    status = Column(String(20), default="open")          # open | investigating | resolved | false_positive
    acknowledged = Column(Boolean, default=False)

    # Raw event IDs that triggered this
    related_log_ids = Column(JSON, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "source_ip": self.source_ip,
            "affected_system": self.affected_system,
            "username": self.username,
            "mitre_technique_id": self.mitre_technique_id,
            "mitre_technique_name": self.mitre_technique_name,
            "mitre_tactic": self.mitre_tactic,
            "threat_summary": self.ai_analysis,
            "risk_level": self.ai_risk_level,
            "recommendations": self.ai_recommendations,
            "status": self.status,
            "acknowledged": self.acknowledged,
            "related_log_ids": self.related_log_ids,
        }




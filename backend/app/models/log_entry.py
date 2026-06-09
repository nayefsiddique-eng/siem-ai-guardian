from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Index
from sqlalchemy.sql import func
from app.core.database import Base


class LogEntry(Base):
    __tablename__ = "log_entries"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    source_ip = Column(String(45), index=True)           # supports IPv6
    destination_ip = Column(String(45), nullable=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True)
    event_type = Column(String(100), index=True)         # e.g. "failed_login", "port_scan"
    severity = Column(String(20), default="low")         # low | medium | high | critical
    hostname = Column(String(255), nullable=True)
    username = Column(String(255), nullable=True)
    log_source = Column(String(50), default="unknown")   # windows | linux | firewall | web
    raw_message = Column(String(2000), nullable=True)
    extra_fields = Column(JSON, nullable=True)            # catch-all for extra structured data
    risk_score = Column(Float, default=0.0)

    __table_args__ = (
        Index("ix_log_source_ip_timestamp", "source_ip", "timestamp"),
        Index("ix_log_event_type_timestamp", "event_type", "timestamp"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "source_ip": self.source_ip,
            "destination_ip": self.destination_ip,
            "source_port": self.source_port,
            "destination_port": self.destination_port,
            "event_type": self.event_type,
            "severity": self.severity,
            "hostname": self.hostname,
            "username": self.username,
            "log_source": self.log_source,
            "raw_message": self.raw_message,
            "extra_fields": self.extra_fields,
            "risk_score": self.risk_score,
        }

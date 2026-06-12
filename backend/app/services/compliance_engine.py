"""
Compliance Mapping Engine
Maps security alerts to regulatory framework controls automatically.
Frameworks: SOC 2, ISO 27001, GDPR, NIST CSF
"""

COMPLIANCE_MAP = {
    "brute_force": {
        "SOC2": [
            {"control_id": "CC6.1", "control_name": "Logical Access Controls", "description": "Protection against unauthorized access through authentication controls."},
            {"control_id": "CC6.7", "control_name": "Transmission of Confidential Information", "description": "Restricts unauthorized access to systems containing confidential information."},
        ],
        "ISO27001": [
            {"control_id": "A.9.4.2", "control_name": "Secure Log-on Procedures", "description": "Secure log-on procedures to prevent unauthorized access."},
            {"control_id": "A.12.4.1", "control_name": "Event Logging", "description": "Event logs recording user activities and security events."},
        ],
        "GDPR": [
            {"control_id": "Article 32", "control_name": "Security of Processing", "description": "Appropriate technical measures to ensure security of personal data."},
        ],
        "NIST_CSF": [
            {"control_id": "PR.AC-7", "control_name": "User Authentication", "description": "Users, devices, and other assets are authenticated commensurate with the risk."},
            {"control_id": "DE.CM-1", "control_name": "Network Monitoring", "description": "The network is monitored to detect potential cybersecurity events."},
        ],
    },
    "port_scan": {
        "SOC2": [
            {"control_id": "CC6.6", "control_name": "Logical Access Security Measures", "description": "Protection of network boundaries against unauthorized access."},
            {"control_id": "CC7.2", "control_name": "System Monitoring", "description": "Monitors system components for anomalies that indicate malicious acts."},
        ],
        "ISO27001": [
            {"control_id": "A.13.1.1", "control_name": "Network Controls", "description": "Networks shall be managed and controlled to protect information in systems."},
            {"control_id": "A.12.4.1", "control_name": "Event Logging", "description": "Event logs recording user activities and security events."},
        ],
        "GDPR": [
            {"control_id": "Article 32", "control_name": "Security of Processing", "description": "Appropriate technical measures including network security."},
        ],
        "NIST_CSF": [
            {"control_id": "DE.CM-1", "control_name": "Network Monitoring", "description": "The network is monitored to detect potential cybersecurity events."},
            {"control_id": "PR.AC-5", "control_name": "Network Integrity", "description": "Network integrity is protected, incorporating network segregation where appropriate."},
        ],
    },
    "privilege_escalation": {
        "SOC2": [
            {"control_id": "CC6.3", "control_name": "Role-Based Access Control", "description": "Role-based access control to limit access to authorized users."},
            {"control_id": "CC6.1", "control_name": "Logical Access Controls", "description": "Logical access security measures to protect against unauthorized access."},
        ],
        "ISO27001": [
            {"control_id": "A.9.2.3", "control_name": "Management of Privileged Access Rights", "description": "Allocation and use of privileged access rights shall be restricted and controlled."},
            {"control_id": "A.12.4.3", "control_name": "Administrator and Operator Logs", "description": "System administrator and operator activities shall be logged and protected."},
        ],
        "GDPR": [
            {"control_id": "Article 25", "control_name": "Data Protection by Design", "description": "Implement appropriate technical measures for data protection."},
            {"control_id": "Article 32", "control_name": "Security of Processing", "description": "Ensure ongoing confidentiality and integrity of processing systems."},
        ],
        "NIST_CSF": [
            {"control_id": "PR.AC-4", "control_name": "Access Permissions", "description": "Access permissions and authorizations are managed, incorporating least privilege."},
            {"control_id": "DE.CM-3", "control_name": "Personnel Activity Monitoring", "description": "Personnel activity is monitored to detect potential cybersecurity events."},
        ],
    },
    "threat_intel_match": {
        "SOC2": [
            {"control_id": "CC7.3", "control_name": "Evaluation of Security Events", "description": "Detected events are evaluated to understand attack targets and methods."},
        ],
        "ISO27001": [
            {"control_id": "A.12.6.1", "control_name": "Management of Technical Vulnerabilities", "description": "Information about technical vulnerabilities shall be obtained in a timely fashion."},
        ],
        "GDPR": [
            {"control_id": "Article 32", "control_name": "Security of Processing", "description": "Process to test and evaluate effectiveness of security measures."},
            {"control_id": "Article 33", "control_name": "Breach Notification", "description": "Notify supervisory authority of personal data breach within 72 hours."},
        ],
        "NIST_CSF": [
            {"control_id": "DE.CM-1", "control_name": "Network Monitoring", "description": "The network is monitored to detect potential cybersecurity events."},
            {"control_id": "RS.AN-1", "control_name": "Notifications Investigated", "description": "Notifications from detection systems are investigated."},
        ],
    },
    "after_hours_login": {
        "SOC2": [
            {"control_id": "CC6.8", "control_name": "Unauthorized Access Prevention", "description": "Prevents unauthorized access to meet the entity objectives."},
            {"control_id": "CC7.2", "control_name": "System Monitoring", "description": "Monitors system components for anomalies that may indicate unauthorized access."},
        ],
        "ISO27001": [
            {"control_id": "A.9.4.2", "control_name": "Secure Log-on Procedures", "description": "Access to systems and applications shall be controlled by secure log-on procedures."},
            {"control_id": "A.6.2.2", "control_name": "Teleworking", "description": "Policy and supporting security measures for teleworking activities."},
        ],
        "GDPR": [
            {"control_id": "Article 32", "control_name": "Security of Processing", "description": "Appropriate measures to ensure ongoing confidentiality of processing systems."},
        ],
        "NIST_CSF": [
            {"control_id": "DE.CM-3", "control_name": "Personnel Activity Monitoring", "description": "Personnel activity is monitored to detect potential cybersecurity events."},
        ],
    },
}

DEFAULT_MAPPING = {
    "SOC2": [{"control_id": "CC7.1", "control_name": "System Monitoring", "description": "Uses detection mechanisms to identify changes to configurations and security threats."}],
    "ISO27001": [{"control_id": "A.12.4.1", "control_name": "Event Logging", "description": "Event logs recording user activities, exceptions, faults and information security events."}],
    "GDPR": [{"control_id": "Article 32", "control_name": "Security of Processing", "description": "Appropriate technical measures to ensure a level of security appropriate to the risk."}],
    "NIST_CSF": [{"control_id": "DE.CM-1", "control_name": "Network Monitoring", "description": "The network is monitored to detect potential cybersecurity events."}],
}


def map_alert_to_compliance(alert_type: str) -> dict:
    """
    Map an alert type to all matching compliance framework controls.
    Returns dict with framework names as keys.
    """
    mapping = COMPLIANCE_MAP.get(alert_type, DEFAULT_MAPPING)
    
    summary = []
    for framework, controls in mapping.items():
        for control in controls:
            summary.append({
                "framework": framework,
                "control_id": control["control_id"],
                "control_name": control["control_name"],
                "description": control["description"],
            })
    
    return {
        "alert_type": alert_type,
        "frameworks_affected": list(mapping.keys()),
        "total_controls_triggered": len(summary),
        "mappings": mapping,
        "flat_summary": summary,
    }


def generate_compliance_report(alerts: list) -> dict:
    """
    Generate a full compliance report from a list of alert dicts.
    Shows which frameworks are most impacted.
    """
    framework_counts = {"SOC2": 0, "ISO27001": 0, "GDPR": 0, "NIST_CSF": 0}
    control_hits = []
    
    for alert in alerts:
        mapping = map_alert_to_compliance(alert.get("alert_type", "unknown"))
        for framework in mapping["frameworks_affected"]:
            framework_counts[framework] = framework_counts.get(framework, 0) + 1
        control_hits.extend(mapping["flat_summary"])
    
    return {
        "total_alerts_analyzed": len(alerts),
        "framework_impact": framework_counts,
        "most_impacted_framework": max(framework_counts, key=framework_counts.get) if alerts else None,
        "unique_controls_triggered": len({f"{h['framework']}-{h['control_id']}" for h in control_hits}),
        "control_details": control_hits,
    }




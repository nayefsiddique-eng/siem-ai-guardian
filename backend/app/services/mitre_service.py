MITRE_MAP = {
    "brute_force":          {"id":"T1110","name":"Brute Force","tactic":"Credential Access","url":"https://attack.mitre.org/techniques/T1110"},
    "port_scan":            {"id":"T1046","name":"Network Service Discovery","tactic":"Discovery","url":"https://attack.mitre.org/techniques/T1046"},
    "privilege_escalation": {"id":"T1068","name":"Exploitation for Privilege Escalation","tactic":"Privilege Escalation","url":"https://attack.mitre.org/techniques/T1068"},
    "threat_intel_match":   {"id":"T1071","name":"Application Layer Protocol","tactic":"Command and Control","url":"https://attack.mitre.org/techniques/T1071"},
    "after_hours_login":    {"id":"T1078","name":"Valid Accounts","tactic":"Defense Evasion","url":"https://attack.mitre.org/techniques/T1078"},
    "lateral_movement":     {"id":"T1021","name":"Remote Services","tactic":"Lateral Movement","url":"https://attack.mitre.org/techniques/T1021"},
    "data_exfiltration":    {"id":"T1041","name":"Exfiltration Over C2 Channel","tactic":"Exfiltration","url":"https://attack.mitre.org/techniques/T1041"},
    "credential_dump":      {"id":"T1003","name":"OS Credential Dumping","tactic":"Credential Access","url":"https://attack.mitre.org/techniques/T1003"},
    "persistence":          {"id":"T1053","name":"Scheduled Task/Job","tactic":"Persistence","url":"https://attack.mitre.org/techniques/T1053"},
    "defense_evasion":      {"id":"T1070","name":"Indicator Removal","tactic":"Defense Evasion","url":"https://attack.mitre.org/techniques/T1070"},
}

def get_mitre(alert_type: str) -> dict:
    return MITRE_MAP.get(alert_type, {
        "id":"T0000","name":"Unknown Technique",
        "tactic":"Unknown","url":"https://attack.mitre.org"
    })

def enrich_alert(alert_type: str, alert_dict: dict) -> dict:
    m = get_mitre(alert_type)
    alert_dict["mitre_technique_id"]   = m["id"]
    alert_dict["mitre_technique_name"] = m["name"]
    alert_dict["mitre_tactic"]         = m["tactic"]
    alert_dict["mitre_url"]            = m["url"]
    return alert_dict




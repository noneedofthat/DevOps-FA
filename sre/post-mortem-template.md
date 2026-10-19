# Blameless Post-Mortem Incident Report

## 1. Incident Overview
- **Incident ID**: INC-2026-XXXX
- **Severity**: Sev-1 (Critical) / Sev-2 (Major) / Sev-3 (Minor)
- **Service Affected**: Hackathon Portal Backend / Kubernetes Cluster
- **Date & Time of Incident**: YYYY-MM-DD HH:MM UTC
- **Incident Commander / Lead**: 
- **Time to Detect (TTD)**: XX minutes
- **Time to Mitigate (TTM)**: XX minutes
- **Total Downtime**: XX minutes
- **Error Budget Consumed**: XX %

---

## 2. Executive Summary
Brief summary of the incident, impact on hackathon participants, and the resolution achieved.

---

## 3. Impact Assessment
- **User Impact**: Number of teams unable to submit or view leaderboard.
- **SLO Impact**: Availability dropped from 99.94% to XX.XX%.
- **Data Integrity**: Were any submissions or upload artifacts corrupted or lost?

---

## 4. Timeline (UTC)
- **HH:MM** - Incident detected via Prometheus Alert / Grafana dashboard.
- **HH:MM** - On-call SRE paged; war room established.
- **HH:MM** - Kubernetes pods identified in `CrashLoopBackOff` state.
- **HH:MM** - Rollback initiated to stable revision via `kubectl rollout undo`.
- **HH:MM** - Cluster recovered; error rates normalized.

---

## 5. Root Cause Analysis (5 Whys)
1. **Why did the portal return HTTP 500 errors?**
   - The backend pods exceeded their allocated memory limit and were OOM-killed.
2. **Why did memory spike?**
   - Concurrent submissions uploaded uncompressed 50MB architecture diagrams.
3. **Why did the server accept 50MB files?**
   - The Ingress proxy-body-size limit did not match the Multer backend constraint.
4. **Why was this not caught in staging?**
   - Load testing did not simulate multi-team parallel upload bursts.
5. **Why was load testing absent?**
   - Performance testing stage was not enforced in the Jenkins CI/CD pipeline.

---

## 6. What Went Well / What Went Poorly
- **Went Well**: Prometheus alert fired within 60 seconds of error budget burn.
- **Went Poorly**: Rollback took 15 minutes due to manual approval delays.

---

## 7. Action Items & Preventative Engineering
| Action Item | Type | Owner | Deadline | Tracking Ticket |
| :--- | :--- | :--- | :--- | :--- |
| Configure Kubernetes HPA with memory scaling | Preventative | DevOps Lead | Day 2 | JIRA-101 |
| Add file size validation step in Jenkins CI | Process | CI/CD Lead | Day 3 | JIRA-102 |
| Enforce strict Multer 10MB reject header | Code Fix | Backend Lead | Day 1 | JIRA-103 |

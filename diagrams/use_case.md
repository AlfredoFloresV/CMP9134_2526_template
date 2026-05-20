flowchart TD
%% Define Actors
C[Commander]
V[Viewer]
A[Auditor]
%% Define Use Cases
Authentication((Authenticate user))
Dashboard((View dashboard))
Telemetry((View telemetry))
ViewMap((View Robot position))
Alerts((View status alerts))
Move((Move Robot))
Reset((Reset Robot))
EmergencyStop((Emergency stop))
AuditLogs((View audit logs))
%% Connect Actors to Use Cases
C --> Dashboard
C --> Telemetry
C --> ViewMap
C --> Alerts
C --> Move
C --> Reset
C --> EmergencyStop
C --> Authentication
V --> Alerts
V --> Dashboard
V --> Telemetry
V --> ViewMap
V --> Authentication
A --> Authentication
A --> AuditLogs

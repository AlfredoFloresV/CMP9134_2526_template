sequenceDiagram

actor A as Auditor
participant UI as Web Dashboard
participant API as Python/Node Backend
participant UA as User Auth
participant DB as Database

A->>UI: View Audit Logs

UI->>API: GET /api/logs, Token

activate API

API->>UA: Token

activate UA

UA-->>API: 200 OK

deactivate UA

API->>DB: Get Audit Logs

activate DB

DB-->>API: 200 OK (Logs)

deactivate DB

API-->>UI: 200 OK (Logs)

UI-->>A: Audit Logs Table

deactivate API
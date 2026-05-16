sequenceDiagram

actor C as Commander
participant UI as Web Dashboard
participant API as Python/Node Backend
participant UA as User Auth
participant SIM as Virtual Robot (Docker)
participant DB as Database

C->>UI: Click 'Reset Robot'

UI->>API: POST /api/reset, Token

activate API

API->>UA: Token

activate UA

UA-->>API: 200 OK

deactivate UA

API->>SIM: POST /api/reset

activate SIM

SIM->>DB: Log Reset

activate DB

DB-->>SIM: Insert OK

deactivate DB

SIM-->>API: 200 OK

deactivate SIM

API-->>UI: 200 OK

UI-->>C: Update dashboard

deactivate API
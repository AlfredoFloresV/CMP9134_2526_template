sequenceDiagram

actor C as Commander
participant UI as Web Dashboard
participant API as Python/Node Backend
participant UA as User Auth
participant SIM as Virtual Robot (Docker)
participant DB as Database

C->>UI: Enter X, Y and click 'Move'

UI->>API: POST /api/command {x: 5, y: 10}, Token

activate API

API->>UA: Token

activate UA

UA-->>API: 200 OK

deactivate UA

API->>SIM: POST /api/move {x: 5, y: 10}

activate SIM

SIM->>DB: Log Mission Action

activate DB

DB-->>SIM: Insert OK

deactivate DB

SIM-->>API: 200 OK

deactivate SIM

API-->>UI: 200 OK

UI-->>C: Update dashboard

deactivate API
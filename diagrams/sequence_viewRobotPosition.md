sequenceDiagram

actor U as User
participant UI as Web Dashboard
participant API as Python/Node Backend
participant UA as User Auth
participant SIM as Virtual Robot (Docker)

U->>UI: Open dashboard

UI->>API: GET /api/status, Token

activate API

API->>UA: Token

activate UA

UA-->>API: 200 OK

deactivate UA

API->>SIM: GET /api/status

activate SIM

SIM-->>API: 200 OK (Robot position)

deactivate SIM

API-->>UI: 200 OK (Coordinates)

UI-->>U: Draw robot on map

deactivate API
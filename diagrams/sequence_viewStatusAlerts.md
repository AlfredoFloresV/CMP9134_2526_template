sequenceDiagram

actor U as User
participant UI as Web Dashboard
participant API as Python/Node Backend
participant UA as User Auth
participant SIM as Virtual Robot (Docker)

U->>UI: Open dashboard

UI->>API: View telemetry

activate API

API->>UA: Token

activate UA

UA-->>API: 200 OK

deactivate UA

API->>SIM: Websocket /ws/telemetry
activate SIM

loop Real-time
    SIM-->>API: Telemetry JSON
    API-->>UI: 200 OK (status data)
    API->>API: Check alert triggers
    UI-->>U: Update dashboard (Popup)
end

deactivate SIM

deactivate API
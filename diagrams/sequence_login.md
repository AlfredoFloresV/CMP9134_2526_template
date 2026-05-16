sequenceDiagram

actor U as User
participant UI as Web Dashboard
participant API as Python/Node Backend
participant UA as User Auth
participant DB as Database

U->>UI: Enter username/password

UI->>API: POST /login

activate API

API->>UA: validateUser(username, password)

activate UA

UA->>DB: Get user credentials

activate DB
DB-->>UA: User data/password hash
deactivate DB

alt Valid credentials
    UA-->>API: 200 OK (JWT Token)
    API-->>UI: 200 OK (JWT Token)
    UI-->>U: Show dashboard
else Invalid credentials
    UA-->>API: 401 Unauthorized
    API-->>UI: 401 Unauthorized
    UI-->>U: Show login error
end

deactivate UA

deactivate API
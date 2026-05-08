Spoofing: Can an attacker fake their identity to access this endpoint? (Do you have JWT authentication?)
Yes (No JWT auth yet).
Mitigation - Implement JWT auth

Tampering: Can the data payload be altered in transit? (Are you using HTTPS?)
No (Port 80).
Mitigation - Port 443 and check ingress annotations

Repudiation: If someone sends a malicious command, can they deny it? (Do you have audit logs saving the user ID and timestamp to a database?)
No (No audit logs yet).
Mitigation - Audit logs

Denial of Service: What happens if a user sends 10,000 requests per second to this endpoint? (Do you have rate-limiting?)
Service crashes (No rate-limit).
Mitigation - ???

Elevation of Privilege: Can a user with a ’Viewer’ token access this ’Commander’ endpoint?
Yes (roles have not been implemented yet).
Mitigation - Roles
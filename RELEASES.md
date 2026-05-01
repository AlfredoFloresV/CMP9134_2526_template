Current Ver. v1.2.3.

Scenario A: You fix a bug where the robot crashed if the battery percentage dropped below zero. The API inputs/outputs stay exactly the same.
v1.2.4.

Scenario B: You add a brand new /api/history endpoint to retrieve past mission logs. All old endpoints work perfectly.
v1.3.4.

Scenario C: You completely redesign the JSON payload required for the /api/move endpoint. If old frontends try to send the old payload, they will receive a 422 Validation Error.
v1.3.5.
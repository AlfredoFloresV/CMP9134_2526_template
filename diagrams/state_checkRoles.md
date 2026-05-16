stateDiagram-v2
[*] --> ReceiveRequest
ReceiveRequest --> CheckRole
state check_role <<choice>>
CheckRole --> check_role
check_role --> RejectCommand : Role is Viewer
check_role --> SendToRobot : Role is Commander
RejectCommand --> [*]
SendToRobot --> CheckAPI
CheckAPI --> check_API
state check_API <<choice>>
check_API --> LogSuccess : API is responsive
check_API --> LogError : API is not responsive
LogSuccess --> [*]
LogError --> [*]
classDiagram

class User {
-String username
-String passwordHash
-String role
+getRole() String
}

class RobotController {
-String apiEndpoint
+getStatus() JSON
+moveRobot(int x, int y) bool
+resetRobot() bool
}

class MissionLog {
-Date timestamp
-String username
-String commandType
+getLog(String user) JSON
+insertLog(Date timestamp, String user, String commandType) void
}

class Robot {
-String robotId
-String status
-int x
-int y
-float batteryLevel
}

class Command {
-String commandType
-int targetX
-int targetY
-Date timestamp
+validateCommand() bool
}

class Telemetry {
-String sensorData
-Date timestamp
+getTelemetry() JSON
}

class Map {
-int width
-int height
+getMap() JSON
}

class Obstacle {
-int x
-int y
}

class Authentication {
+validateUser() bool
+createAccessToken() String
}

User "1" --> "1" Authentication : Authenticates
User "1" --> "1" RobotController : Uses
User "1" --> "*" MissionLog : Logs
RobotController "1" --> "1" Robot : Controls
RobotController "1" --> "*" Command : Sends
RobotController "1" --> "*" MissionLog : Logs
Robot "1" --> "*" Telemetry : Gives
Map "1" --> "*" Obstacle : Contains
Map "1" --> "1" Robot : Contains
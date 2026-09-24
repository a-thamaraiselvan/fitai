# API Checklist

Below is the complete list of all API endpoints updated to meaningful RPC-style PascalCase names with the `/api/v1/` prefix.

## Auth (`/api/v1/Auth`)
- [x] `POST /register` -> `POST /RegisterUser`
- [x] `POST /login` -> `POST /LoginUser`
- [x] `GET /me` -> `GET /GetCurrentUser`
- [x] `PUT /profile` -> `PUT /UpdateUserProfile`
- [x] `POST /upload-profile-picture` -> `POST /UploadProfilePicture`

## Diet (`/api/v1/Diet`)
- [x] `GET /entries/today` -> `GET /GetTodayDietEntries`
- [x] `POST /entries` -> `POST /AddDietEntry`
- [x] `GET /entries` -> `GET /GetDietEntriesByDateRange`
- [x] `DELETE /entries/:id` -> `DELETE /DeleteDietEntry/:id`

## Workout (`/api/v1/Workout`)
- [x] `GET /entries/today` -> `GET /GetTodayWorkoutEntries`
- [x] `POST /exercises` -> `POST /AddWorkoutExercise`
- [x] `POST /sessions` -> `POST /SaveWorkoutSession`
- [x] `GET /entries` -> `GET /GetWorkoutEntriesByDateRange`
- [x] `GET /sessions` -> `GET /GetWorkoutSessions`
- [x] `DELETE /entries/:id` -> `DELETE /DeleteWorkoutEntry/:id`

## Water (`/api/v1/Water`)
- [x] `GET /today` -> `GET /GetTodayWaterIntake`
- [x] `POST /add` -> `POST /AddWaterEntry`
- [x] `GET /weekly` -> `GET /GetWeeklyWaterStats`
- [x] `DELETE /entries/:id` -> `DELETE /DeleteWaterEntry/:id`

## Gym Calendar (`/api/v1/GymCalendar`)
- [x] `GET /month/:year/:month` -> `GET /GetGymDaysByMonth/:year/:month`
- [x] `POST /update` -> `POST /UpdateGymDayStatus`
- [x] `GET /stats` -> `GET /GetGymCalendarStats`

## AI (`/api/v1/Ai`)
- [x] `POST /analyze-meal` -> `POST /AnalyzeMealImage`
- [x] `GET /notifications` -> `GET /GetAiNotifications`
- [x] `PUT /notifications/:id/read` -> `PUT /MarkNotificationAsRead/:id`
- [x] `DELETE /notifications/:id` -> `DELETE /DeleteNotification/:id`

## Admin (`/api/v1/Admin`)
- [x] `GET /users` -> `GET /GetAllUsers`
- [x] `PUT /users/:id/approve` -> `PUT /ApproveUser/:id`
- [x] `PUT /users/:id/reject` -> `PUT /RejectUser/:id`
- [x] `PUT /users/:id/suspend` -> `PUT /SuspendUser/:id`
- [x] `PUT /users/:id/reset-password` -> `PUT /ResetUserPassword/:id`
- [x] `DELETE /users/:id` -> `DELETE /DeleteUser/:id`
- [x] `GET /stats` -> `GET /GetAdminDashboardStats`

## Dashboard (`/api/v1/Dashboard`)
- [x] `GET /stats` -> `GET /GetDashboardStatistics`
- [x] `GET /activity` -> `GET /GetRecentActivity`

## Charts (`/api/v1/Charts`)
- [x] `GET /nutrition` -> `GET /GetNutritionChartData`
- [x] `GET /weekly` -> `GET /GetWeeklyProgressChartData`
- [x] `GET /gym-stats` -> `GET /GetGymStatisticsChartData`

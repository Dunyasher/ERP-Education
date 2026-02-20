# Notification System Implementation Prompt

## System Requirements

Implement a comprehensive user account and notification system for the College Management System with the following specifications:

### 1. User Account Setup

#### Account Types:
- **Admin Account:**
  - Full system access
  - User management
  - Student management
  - Financial management
  - Receives all notifications
  
- **Director/Owner Account:**
  - Oversight access
  - View all data
  - Financial oversight
  - Receives critical notifications (especially deletions)
  
- **Teacher Account:**
  - Limited access
  - View assigned students
  - Mark attendance
  - Can be involved in admission process
  - Receives notifications for their students

#### Account Management:
- Create accounts for each role
- Assign roles and permissions
- Manage user access
- Track user activity

### 2. Notification System

#### Notification Triggers:

**Student Admission Notification:**
- When a teacher or any individual is involved in student admission
- Send notification to:
  - Admin (always)
  - Director/Owner (always)
  - Involved teacher/individual
- Include: Student details, admission info, who was involved

**Student Deletion Notification (CRITICAL):**
- When a student is deleted from the system
- Send **immediate, high-priority** notification to:
  - Admin (CRITICAL - always notified)
  - Director/Owner (CRITICAL - always notified)
  - Assigned teacher (if applicable)
- Include:
  - Deleted student serial number and name
  - Complete student information before deletion
  - Who deleted the record
  - Deletion timestamp
  - Reason (if provided)
  - All associated records

**Student Modification Notification:**
- When significant student information is changed
- Notify admin, director, and assigned teacher
- Include: What changed, old vs. new values, who made change

#### Notification Delivery:
- **In-App Notifications:** Real-time notifications in the application
- **Email Notifications:** Email alerts for all notifications
- **SMS Notifications:** Optional SMS for critical alerts
- **Dashboard Alerts:** Prominent alerts on dashboard

#### Notification Features:
- Real-time delivery (no delay)
- Notification history and log
- Mark as read/unread
- Notification preferences per user
- Priority levels (Low, Medium, High, Critical)
- Filter and search notifications

### 3. Student Deletion Process

#### Deletion Workflow:
1. **Authorization:** Verify user has permission to delete
2. **Confirmation:** Require explicit confirmation with warning
3. **Data Backup:** Archive student record before deletion
4. **Soft Delete:** Mark as deleted (recommended) or hard delete
5. **Immediate Notification:** Send critical alerts to admin and director
6. **Audit Log:** Record deletion with complete details

#### Deletion Restrictions:
- Cannot delete if student has pending fees
- Cannot delete if student has active records
- Archive instead of delete for graduated students

### 4. Technical Implementation

#### Database Tables:
- Users table (Admin, Director, Teacher)
- Notifications table
- Notification preferences table
- Audit log table
- Deleted students archive table

#### API Endpoints:
- User management endpoints
- Notification endpoints (create, read, mark as read)
- Student deletion endpoint (with notification trigger)
- Notification history endpoint

#### Real-Time Features:
- WebSocket or Server-Sent Events for real-time notifications
- Notification count updates
- Instant alert delivery

### 5. User Interface

#### Notification Center:
- List of all notifications
- Unread count badge
- Filter by type, date, priority
- Mark as read/unread
- View notification details

#### User Management:
- Create/edit user accounts
- Assign roles
- Configure permissions
- View user activity

#### Student Deletion Interface:
- Confirmation dialog with warning
- Reason field
- Immediate notification trigger
- Deletion history view

### 6. Security

- Role-based access control
- Secure authentication
- Audit all actions
- Prevent unauthorized deletions
- Encrypt sensitive data

### 7. Success Criteria

✅ User accounts created for Admin, Director, and Teachers
✅ Teachers can be involved in admission process
✅ Immediate notifications sent when students deleted
✅ Admin and Director receive all critical notifications
✅ Student deletion properly authorized and logged
✅ Notifications delivered through multiple channels
✅ Complete notification history maintained

---

**This system ensures prompt communication of all changes and deletions to administrators and owners, maintaining transparency and accountability.**


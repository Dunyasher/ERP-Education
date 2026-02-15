# User Account and Notification System - Requirements

## Overview

This document describes the user account management system and notification features for the College Management System, including account setup for different user roles and automated notifications for important events.

---

## 1. User Account Management

### 1.1 User Roles and Accounts

The system must support the following user account types:

#### 1.1.1 Admin Account
- **Purpose:** System administrator with full access
- **Permissions:**
  - Full system access
  - User management (create, edit, delete users)
  - Student management (create, edit, delete students)
  - Financial management
  - Report generation
  - System configuration
  - Receive all notifications

#### 1.1.2 Director/Owner Account
- **Purpose:** College owner/director with oversight access
- **Permissions:**
  - View all system data
  - Financial oversight
  - Report access
  - Student information access
  - Receive critical notifications (deletions, important changes)
  - Approve major changes (optional)

#### 1.1.3 Teacher Account
- **Purpose:** Teaching staff with limited access
- **Permissions:**
  - View assigned students
  - Mark attendance (students and self)
  - View student academic records
  - Update student grades/performance (if applicable)
  - View own salary information
  - Limited report access
  - Can be involved in admission process
  - Receive notifications related to their students

### 1.2 Account Setup Process

#### Account Creation:
- **Admin Account:**
  - Created during system initialization
  - Primary system administrator
  - Can create other admin accounts
  
- **Director/Owner Account:**
  - Created by admin
  - One or multiple director accounts
  - Requires admin approval
  
- **Teacher Account:**
  - Created by admin
  - Linked to specific department
  - Assigned to courses/categories
  - Can be involved in student admission process

#### Account Information:
- **Required Fields:**
  - Username/Email
  - Password (encrypted)
  - Full Name
  - Role (Admin, Director, Teacher)
  - Department (for teachers)
  - Contact Information
  - Account Status (Active, Inactive, Suspended)
  
- **Optional Fields:**
  - Profile Photo
  - Phone Number
  - Address
  - Additional Notes

### 1.3 Account Management Features

- **Create Accounts:** Admin can create new user accounts
- **Edit Accounts:** Update user information
- **Deactivate Accounts:** Temporarily disable accounts
- **Delete Accounts:** Permanently remove accounts (with restrictions)
- **Password Management:** Reset passwords, enforce password policies
- **Role Assignment:** Assign and change user roles
- **Permission Management:** Configure role-based permissions

---

## 2. Notification System

### 2.1 Notification Types

#### 2.1.1 Student Admission Notifications

**Trigger:** When a student admission is processed and a teacher or any individual is involved

**Notification Details:**
- **Event:** New student admission
- **Recipients:**
  - Admin (always notified)
  - Director/Owner (always notified)
  - Involved Teacher (if teacher participated in admission)
  - Other involved individuals (if applicable)

**Notification Content:**
- Student serial number
- Student name
- Department and course
- Admission date
- Fee details
- Name of teacher/individual involved in admission
- Admission form details
- Timestamp

**Delivery Methods:**
- In-app notification
- Email notification
- SMS notification (optional)
- Dashboard alert

#### 2.1.2 Student Deletion Notifications

**Trigger:** When a student record is deleted from the system

**Notification Details:**
- **Event:** Student deletion
- **Recipients:**
  - Admin (always notified - CRITICAL)
  - Director/Owner (always notified - CRITICAL)
  - Teacher (if student was assigned to a teacher)

**Notification Content:**
- **CRITICAL ALERT:** Student Deletion
- Deleted student serial number
- Deleted student name
- Department and course
- Deletion date and time
- Person who deleted the record (user account)
- Reason for deletion (if provided)
- Student's complete information before deletion (for audit)
- Last modified date
- All associated records (fees, attendance, etc.)

**Delivery Methods:**
- **Priority:** High priority notification
- In-app notification (prominent alert)
- Email notification (urgent)
- SMS notification (if configured)
- Dashboard alert (red/urgent indicator)
- Optional: Push notification (if mobile app exists)

#### 2.1.3 Student Modification Notifications

**Trigger:** When significant student information is modified

**Notification Details:**
- **Event:** Student information change
- **Recipients:**
  - Admin
  - Director/Owner (for major changes)
  - Teacher (if student is assigned)

**Notification Content:**
- Student serial number
- Student name
- What was changed (field names)
- Old value vs. New value
- Who made the change
- Change timestamp

**Delivery Methods:**
- In-app notification
- Email notification (for major changes)
- Dashboard alert

### 2.2 Notification Features

#### 2.2.1 Real-Time Notifications
- Instant notification delivery
- No delay in notification system
- Immediate alerts for critical events

#### 2.2.2 Notification History
- Maintain complete notification log
- View notification history
- Filter notifications by:
  - Date range
  - Notification type
  - User role
  - Student (if applicable)

#### 2.2.3 Notification Preferences
- Users can configure notification preferences:
  - Email notifications (on/off)
  - SMS notifications (on/off)
  - In-app notifications (on/off)
  - Notification frequency
  - Types of notifications to receive

#### 2.2.4 Notification Status
- Mark notifications as read/unread
- Notification count badge
- Clear all notifications
- Archive old notifications

---

## 3. Student Deletion Process

### 3.1 Deletion Workflow

#### Pre-Deletion Steps:
1. **Authorization Check:**
   - Verify user has permission to delete students
   - Require admin or director approval for deletion
   
2. **Confirmation Required:**
   - Show warning message
   - Require explicit confirmation
   - May require reason for deletion
   
3. **Data Backup:**
   - Create backup of student record before deletion
   - Store in archive/deleted records table
   - Preserve all associated data

#### Deletion Process:
1. **Soft Delete (Recommended):**
   - Mark student as "Deleted" instead of removing
   - Move to deleted/archived status
   - Preserve all historical data
   - Can be restored if needed
   
2. **Hard Delete (If Required):**
   - Permanently remove from active database
   - Archive all data first
   - Maintain audit trail

#### Post-Deletion Actions:
1. **Immediate Notification:**
   - Send notification to admin (CRITICAL)
   - Send notification to director/owner (CRITICAL)
   - Send notification to assigned teacher
   
2. **Audit Log:**
   - Record deletion in audit log
   - Include: who, when, why, what data
   
3. **Data Preservation:**
   - Archive student record
   - Preserve financial records
   - Maintain attendance history
   - Keep all documents

### 3.2 Deletion Restrictions

- **Cannot Delete If:**
  - Student has pending fees
  - Student has active attendance records
  - Student has associated financial transactions
  - Student has pending documents
  
- **Special Cases:**
  - Graduated students: Archive instead of delete
  - Transferred students: Mark as transferred, don't delete
  - Inactive students: Mark as inactive, preserve data

---

## 4. Notification Delivery System

### 4.1 In-App Notifications

- **Notification Center:**
  - Dedicated notification panel
  - Unread notification count
  - Notification categories
  - Mark as read functionality
  
- **Dashboard Alerts:**
  - Prominent alerts for critical notifications
  - Color-coded (red for urgent, yellow for important)
  - Click to view details
  - Dismiss option

### 4.2 Email Notifications

- **Email Templates:**
  - Student admission notification email
  - Student deletion alert email (urgent)
  - Student modification notification email
  - Customizable email templates
  
- **Email Features:**
  - HTML formatted emails
  - Include relevant details
  - Action links (view student, view report)
  - Unsubscribe option

### 4.3 SMS Notifications (Optional)

- **SMS Integration:**
  - Third-party SMS service integration
  - Send SMS for critical alerts
  - Configurable for each user
  - Cost management

### 4.4 Push Notifications (Future)

- Mobile app push notifications
- Browser push notifications
- Real-time alerts

---

## 5. User Interface Requirements

### 5.1 User Account Management Interface

- **User List:**
  - Display all users
  - Filter by role
  - Search functionality
  - User status indicators
  
- **User Creation Form:**
  - All required fields
  - Role selection
  - Department assignment (for teachers)
  - Permission configuration
  
- **User Profile:**
  - View user details
  - Edit user information
  - Change password
  - View activity log

### 5.2 Notification Interface

- **Notification Panel:**
  - List of all notifications
  - Unread notification indicator
  - Filter and sort options
  - Mark as read/unread
  - Delete notifications
  
- **Notification Details:**
  - Full notification content
  - Related student information
  - Action buttons (view student, view report)
  - Timestamp and sender

### 5.3 Student Deletion Interface

- **Deletion Confirmation Dialog:**
  - Warning message
  - Student information summary
  - Reason field (optional)
  - Confirmation checkbox
  - Cancel and Delete buttons
  
- **Deletion History:**
  - List of deleted students
  - Deletion details
  - Restore option (if soft delete)
  - Audit trail

---

## 6. Database Structure

### 6.1 User Tables

```
Users Table:
- User ID (Primary Key)
- Username/Email
- Password (encrypted)
- Full Name
- Role (Admin, Director, Teacher)
- Department ID (Foreign Key, for teachers)
- Contact Information
- Account Status
- Created Date
- Last Login

User Roles Table:
- Role ID (Primary Key)
- Role Name
- Permissions (JSON or separate table)

User Permissions Table:
- Permission ID (Primary Key)
- User ID (Foreign Key)
- Permission Type
- Allowed/Denied
```

### 6.2 Notification Tables

```
Notifications Table:
- Notification ID (Primary Key)
- User ID (Foreign Key - recipient)
- Notification Type
- Title
- Message
- Related Student ID (Foreign Key, if applicable)
- Related User ID (Foreign Key - sender/actor)
- Status (Read, Unread)
- Priority (Low, Medium, High, Critical)
- Created Date
- Read Date

Notification Preferences Table:
- Preference ID (Primary Key)
- User ID (Foreign Key)
- Notification Type
- Email Enabled
- SMS Enabled
- In-App Enabled
```

### 6.3 Audit and Deletion Tables

```
Audit Log Table:
- Audit ID (Primary Key)
- User ID (Foreign Key - who performed action)
- Action Type (Create, Update, Delete)
- Entity Type (Student, User, etc.)
- Entity ID
- Old Values (JSON)
- New Values (JSON)
- Timestamp
- IP Address
- Reason (if applicable)

Deleted Students Archive Table:
- Archive ID (Primary Key)
- Original Student Serial Number
- Complete Student Data (JSON)
- Deleted By (User ID)
- Deletion Date
- Reason
- Can Restore (Boolean)
```

---

## 7. Security and Access Control

### 7.1 Authentication

- Secure login system
- Password encryption (bcrypt)
- Session management
- Password reset functionality
- Two-factor authentication (optional)

### 7.2 Authorization

- Role-based access control (RBAC)
- Permission-based access
- Restrict sensitive operations
- Audit all actions
- Prevent unauthorized deletions

### 7.3 Data Protection

- Encrypt sensitive data
- Secure API endpoints
- Prevent SQL injection
- XSS protection
- CSRF protection

---

## 8. Implementation Priority

### Phase 1: User Account System
- Create user account structure
- Admin, Director, Teacher roles
- Basic authentication
- User management interface

### Phase 2: Basic Notifications
- In-app notifications
- Student admission notifications
- Student deletion notifications
- Notification center

### Phase 3: Advanced Notifications
- Email notifications
- SMS notifications (optional)
- Notification preferences
- Notification history

### Phase 4: Enhanced Features
- Soft delete with archive
- Audit logging
- Advanced notification filtering
- Notification analytics

---

## 9. Success Criteria

The system will be successful when:

✅ User accounts can be created for Admin, Director, and Teachers
✅ Teachers can be involved in student admission process
✅ Notifications are sent immediately when students are deleted
✅ Admin and Director receive all critical notifications
✅ Student deletion requires proper authorization
✅ All deletions are logged and auditable
✅ Notifications are delivered through multiple channels
✅ Users can manage notification preferences
✅ Complete notification history is maintained
✅ System is secure and access-controlled

---

## 10. Example Notification Scenarios

### Scenario 1: Student Admission with Teacher Involvement
1. Teacher "John Smith" assists in admitting student "STU-0123"
2. System automatically sends notifications to:
   - Admin: "New student STU-0123 admitted by Teacher John Smith"
   - Director: "New student STU-0123 admitted by Teacher John Smith"
   - Teacher John Smith: "You were involved in admitting student STU-0123"

### Scenario 2: Student Deletion
1. Admin deletes student "STU-0123"
2. System immediately sends CRITICAL notifications to:
   - Admin: "URGENT: Student STU-0123 deleted by Admin User"
   - Director: "URGENT: Student STU-0123 deleted by Admin User"
   - Assigned Teacher: "Student STU-0123 has been deleted"
3. All notifications include complete student information before deletion

### Scenario 3: Student Information Modification
1. Admin updates student "STU-0123" course category
2. System sends notifications to:
   - Admin: "Student STU-0123 information updated"
   - Director: "Student STU-0123 course changed"
   - Assigned Teacher: "Student STU-0123 information updated"

---

**This notification system ensures that all critical events, especially student deletions, are immediately communicated to administrators and owners, maintaining transparency and accountability in the system.**


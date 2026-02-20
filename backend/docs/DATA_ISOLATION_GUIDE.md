# Data Isolation & Role-Based Access Control Guide

## Overview

This system ensures **complete data isolation** between colleges/institutes. Each college operates as an independent entity with its own data, and admins can only access their own college's information.

## Data Isolation Guarantees

### ✅ Complete Separation

1. **Student Data Isolation**
   - Battle College students → Only visible to Battle College admin
   - Excel College students → Only visible to Excel College admin
   - **No data sharing** between colleges

2. **Teacher Data Isolation**
   - Each college's teachers are isolated
   - Teachers can only see students from their own college

3. **Course & Category Isolation**
   - Courses are college-specific
   - Categories are college-specific
   - No cross-college visibility

4. **Financial Data Isolation**
   - Fee structures are per college
   - Invoices are per college
   - Payment records are per college

5. **Attendance Records Isolation**
   - Attendance is tracked per college
   - No cross-college attendance visibility

## Role-Based Access Control

### 🔴 Super Admin Role

**Full Control Over Everything:**
- ✅ Can create new colleges/institutes
- ✅ Can view ALL colleges and their data
- ✅ Can assign admins to colleges
- ✅ Can set admin permissions
- ✅ Can configure payment systems
- ✅ Can access system-wide statistics
- ✅ Can manage all users across all colleges
- ✅ Can update college settings

**Access Level:** System-wide, no restrictions

**Example:**
```javascript
// Super admin can see all colleges
GET /api/settings/colleges
// Returns: [Battle College, Excel College, ABC Institute, ...]

// Super admin can see all students from all colleges
GET /api/students
// Returns: All students (with collegeId filter if needed)
```

### 🟡 Admin Role (College-Specific)

**Limited Control Within Own College:**
- ✅ Can manage students (only their college)
- ✅ Can manage teachers (only their college)
- ✅ Can manage courses (only their college)
- ✅ Can manage fees (only their college)
- ✅ Can manage attendance (only their college)
- ✅ Can view reports (only their college)
- ✅ Can manage users (only their college)
- ❌ Cannot access other colleges' data
- ❌ Cannot create new colleges
- ❌ Cannot modify college settings (unless permission granted)
- ❌ Cannot see system-wide statistics

**Access Level:** Restricted to their `collegeId` only

**Example:**
```javascript
// Battle College admin can only see Battle College students
GET /api/students
// Returns: Only Battle College students (automatically filtered by collegeId)

// Battle College admin CANNOT see Excel College students
// Even if they try to access Excel College student ID, they get 403 Forbidden
```

## Permission System

### Default Admin Permissions

When an admin is assigned to a college, they get these default permissions:

```javascript
{
  manageStudents: true,      // Can create/edit/delete students
  manageTeachers: true,     // Can create/edit/delete teachers
  manageCourses: true,      // Can create/edit/delete courses
  manageFees: true,          // Can manage fee structures and invoices
  manageAttendance: true,   // Can mark and manage attendance
  viewReports: true,        // Can view reports and analytics
  manageSettings: false,    // Cannot modify college settings (super admin only)
  manageUsers: true         // Can create/edit users within their college
}
```

### Custom Permissions

Super admin can customize permissions per admin:

```javascript
PUT /api/colleges/:collegeId/admins/:adminId/permissions
{
  "permissions": {
    "manageStudents": true,
    "manageTeachers": false,  // This admin cannot manage teachers
    "manageCourses": true,
    "manageFees": true,
    "manageAttendance": true,
    "viewReports": true,
    "manageSettings": false,
    "manageUsers": false      // This admin cannot create users
  }
}
```

## Data Isolation Mechanisms

### 1. Database Level

**All models include `collegeId`:**
```javascript
{
  collegeId: ObjectId,  // Required (except super_admin)
  // ... other fields
}
```

**Compound Indexes:**
```javascript
// Email unique per college
{ email: 1, collegeId: 1 } // Unique

// Admission number unique per college
{ admissionNo: 1, collegeId: 1 } // Unique
```

### 2. Middleware Level

**Automatic Filtering:**
```javascript
// All routes use addCollegeFilter middleware
router.get('/students', authenticate, addCollegeFilter, ...)

// Automatically adds collegeId to queries
const query = buildCollegeQuery(req);
// Returns: { collegeId: req.user.collegeId }
```

### 3. Route Level

**Automatic Data Filtering:**
```javascript
// GET /api/students
// Automatically filters by collegeId
const students = await Student.find({ collegeId: req.collegeId });

// POST /api/students
// Automatically sets collegeId from user
req.body.collegeId = req.user.collegeId;
```

### 4. Access Control Level

**Verification Before Operations:**
```javascript
// Before updating student
const student = await Student.findById(id);
if (student.collegeId.toString() !== req.collegeId.toString()) {
  return res.status(403).json({ message: 'Access denied' });
}
```

## Real-World Scenarios

### Scenario 1: Battle College Admin

**Login:**
- Email: `admin@battlecollege.com`
- Password: `Battle123!`
- Role: `admin`
- CollegeId: `battle_college_id`

**What They Can See:**
- ✅ Battle College students only
- ✅ Battle College teachers only
- ✅ Battle College courses only
- ✅ Battle College fees and invoices
- ✅ Battle College attendance records

**What They CANNOT See:**
- ❌ Excel College students
- ❌ Excel College teachers
- ❌ Excel College courses
- ❌ Any data from other colleges

### Scenario 2: Excel College Admin

**Login:**
- Email: `admin@excelcollege.com`
- Password: `Excel123!`
- Role: `admin`
- CollegeId: `excel_college_id`

**What They Can See:**
- ✅ Excel College students only
- ✅ Excel College teachers only
- ✅ Excel College courses only
- ✅ Excel College fees and invoices
- ✅ Excel College attendance records

**What They CANNOT See:**
- ❌ Battle College students
- ❌ Battle College teachers
- ❌ Battle College courses
- ❌ Any data from other colleges

### Scenario 3: Super Admin

**Login:**
- Email: `superadmin@system.com`
- Password: `SuperAdmin123!`
- Role: `super_admin`
- CollegeId: `null` (no college restriction)

**What They Can See:**
- ✅ ALL colleges
- ✅ ALL students (from all colleges)
- ✅ ALL teachers (from all colleges)
- ✅ ALL courses (from all colleges)
- ✅ System-wide statistics
- ✅ Can create new colleges
- ✅ Can assign admins
- ✅ Can configure payment systems

## Security Features

### 1. Automatic Data Filtering

Every query automatically includes `collegeId` filter:
```javascript
// Admin query
Student.find({ collegeId: req.user.collegeId })

// Super admin query (if needed)
Student.find({ collegeId: req.query.collegeId })
```

### 2. Access Verification

Before any operation, system verifies:
- User belongs to the college (for admins)
- Data belongs to the college (for admins)
- Super admin can access all (no restriction)

### 3. Permission Checks

Before operations, system checks:
- Does user have permission for this action?
- Is user's role allowed?
- Is user's college active?

### 4. Token-Based Authentication

JWT tokens include:
- User ID
- Role
- College ID (for admins)
- Permissions

## API Examples

### Admin Access (Battle College)

```javascript
// Get students - only Battle College students
GET /api/students
Headers: { Authorization: "Bearer <battle_admin_token>" }
Response: [Battle College students only]

// Create student - automatically assigned to Battle College
POST /api/students
Headers: { Authorization: "Bearer <battle_admin_token>" }
Body: { ...studentData }
// collegeId automatically set to Battle College

// Try to access Excel College student - DENIED
GET /api/students/<excel_student_id>
Headers: { Authorization: "Bearer <battle_admin_token>" }
Response: 403 Forbidden - "Access denied"
```

### Super Admin Access

```javascript
// Get all colleges
GET /api/settings/colleges
Headers: { Authorization: "Bearer <super_admin_token>" }
Response: [All colleges]

// Get all students (with optional collegeId filter)
GET /api/students?collegeId=<college_id>
Headers: { Authorization: "Bearer <super_admin_token>" }
Response: [Students from specified college or all if no filter]

// Create new college
POST /api/settings/colleges
Headers: { Authorization: "Bearer <super_admin_token>" }
Body: { ...collegeData }
```

## Testing Data Isolation

### Test 1: Admin Cannot See Other College's Data

```javascript
// 1. Login as Battle College admin
POST /api/auth/login
{ "email": "admin@battlecollege.com", "password": "Battle123!" }

// 2. Try to get Excel College student
GET /api/students/<excel_student_id>
// Expected: 403 Forbidden or 404 Not Found
```

### Test 2: Admin Can Only Create Data in Their College

```javascript
// 1. Login as Battle College admin
POST /api/auth/login
{ "email": "admin@battlecollege.com", "password": "Battle123!" }

// 2. Create student
POST /api/students
{ ...studentData }
// Expected: Student created with collegeId = Battle College
// Even if you try to set collegeId to Excel College, it's ignored
```

### Test 3: Super Admin Can Access All

```javascript
// 1. Login as super admin
POST /api/auth/login
{ "email": "superadmin@system.com", "password": "SuperAdmin123!" }

// 2. Get all colleges
GET /api/settings/colleges
// Expected: All colleges returned

// 3. Get students from specific college
GET /api/students?collegeId=<battle_college_id>
// Expected: Only Battle College students
```

## Summary

✅ **Complete Data Isolation**: Each college's data is completely separate
✅ **Role-Based Access**: Super admin has full control, admins have limited control
✅ **Automatic Filtering**: All queries automatically filter by college
✅ **Permission System**: Fine-grained control over admin capabilities
✅ **Security**: Multiple layers of access control and verification
✅ **Scalability**: Easy to add new colleges without affecting existing ones

**Key Principle:** 
- **Super Admin** = Full system control
- **Admin** = Limited control within their own college only
- **No data sharing** between colleges, ever!


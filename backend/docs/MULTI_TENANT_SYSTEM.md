# Multi-Tenant College Management System

## Overview

This system has been implemented as a **multi-tenant architecture** where each college/institute has its own isolated data. Each college operates independently with its own admin, students, teachers, courses, and all other data completely separated from other colleges.

## Key Features

### 1. **College Registration & Login**
- Each college/institute can register with:
  - College name
  - Email (unique)
  - Password
  - Phone number
  - Institute type (school, college, academy, short_course)
  - Contact information
  - Registration details

- **College Login Endpoint**: `POST /api/auth/college/login`
- **College Registration Endpoint**: `POST /api/auth/college/register`

When a college registers, a default admin user is automatically created for that college.

### 2. **Data Isolation**

All data models now include a `collegeId` field that ensures complete data separation:

- **User Model**: Users belong to a specific college
- **Student Model**: Students are isolated per college
- **Teacher Model**: Teachers belong to their college
- **Course Model**: Courses are college-specific
- **Category Model**: Categories are per college
- **Fee Structure & Invoices**: Financial data is isolated
- **Attendance**: Attendance records are college-specific

### 3. **Email Uniqueness**

- Email addresses are now **unique per college**, not globally unique
- The same email can exist in different colleges
- Example: `john@example.com` can exist in both "Battle College" and "Excel College"

### 4. **Authentication Flow**

#### College Login Flow:
1. College logs in with email/password
2. System verifies college credentials
3. Returns college info + admin user token
4. Admin can then manage their college's data

#### User Login Flow:
1. User logs in with email/password
2. System finds user by email + collegeId
3. Verifies user belongs to active college
4. Returns user token with college context

### 5. **Automatic Data Filtering**

All routes automatically filter data by `collegeId`:
- When a user queries students, they only see students from their college
- When creating new records, `collegeId` is automatically set from the logged-in user
- Super admins can access all colleges (with explicit collegeId parameter)

### 6. **Middleware**

#### `addCollegeFilter`
- Automatically adds `collegeId` to request object
- Ensures all queries are filtered by college
- Used in all data retrieval routes

#### `requireCollegeId`
- Ensures `collegeId` is set when creating new records
- Automatically sets from user's college if not provided

#### `buildCollegeQuery`
- Helper function to build MongoDB queries with college filter
- Used throughout routes to ensure data isolation

## API Endpoints

### College Management

```
POST /api/auth/college/register
Body: {
  name: "Battle College",
  email: "admin@battlecollege.com",
  password: "password123",
  phone: "+1234567890",
  instituteType: "college",
  contactInfo: { ... },
  registrationInfo: { ... }
}

POST /api/auth/college/login
Body: {
  email: "admin@battlecollege.com",
  password: "password123"
}
```

### User Management

```
POST /api/auth/register
Body: {
  email: "user@example.com",
  password: "password123",
  role: "teacher",
  collegeId: "college_id_here",
  profile: { ... }
}

POST /api/auth/login
Body: {
  email: "user@example.com",
  password: "password123"
}
```

## Database Schema Changes

### College Model
```javascript
{
  srNo: String (unique),
  name: String,
  email: String (unique),
  password: String (hashed),
  instituteType: Enum,
  contactInfo: Object,
  registrationInfo: Object,
  settings: Object,
  subscription: Object,
  isActive: Boolean,
  lastLogin: Date
}
```

### Updated Models (all include collegeId)
- User: `collegeId: ObjectId (required, indexed)`
- Student: `collegeId: ObjectId (required, indexed)`
- Teacher: `collegeId: ObjectId (required, indexed)`
- Course: `collegeId: ObjectId (required, indexed)`
- Category: `collegeId: ObjectId (required, indexed)`
- FeeStructure: `collegeId: ObjectId (required, indexed)`
- Invoice: `collegeId: ObjectId (required, indexed)`
- Attendance: `collegeId: ObjectId (required, indexed)`

## Security Features

1. **Data Isolation**: Complete separation of data between colleges
2. **Access Control**: Users can only access their college's data
3. **College Validation**: All operations verify college membership
4. **Active Status Check**: Inactive colleges cannot be accessed
5. **Password Hashing**: All passwords are securely hashed

## Usage Example

### Scenario: Battle College and Excel College

1. **Battle College Registration**:
   - Registers with email: `admin@battlecollege.com`
   - Gets collegeId: `college_123`
   - Default admin created: `admin@battlecollege.com_admin`

2. **Excel College Registration**:
   - Registers with email: `admin@excelcollege.com`
   - Gets collegeId: `college_456`
   - Default admin created: `admin@excelcollege.com_admin`

3. **Student Admission**:
   - Battle College admin creates student → student gets `collegeId: college_123`
   - Excel College admin creates student → student gets `collegeId: college_456`
   - Each college only sees their own students

4. **Data Queries**:
   - Battle College admin queries students → only sees Battle College students
   - Excel College admin queries students → only sees Excel College students
   - No data leakage between colleges

## Migration Notes

⚠️ **Important**: Existing data will need to be migrated:
1. Create a default college for existing data
2. Assign all existing records to this default college
3. Update all users with collegeId

## Frontend Integration

The frontend needs to be updated to:
1. Show college registration form
2. Support college login
3. Display college name in UI
4. Ensure all API calls include college context (handled automatically via token)

## Benefits

✅ **Complete Data Isolation**: Each college's data is completely separate
✅ **Scalability**: Easy to add new colleges
✅ **Privacy**: No data sharing between colleges
✅ **Flexibility**: Each college can have its own settings
✅ **Security**: Access control at the database level
✅ **Maintainability**: Clean separation of concerns


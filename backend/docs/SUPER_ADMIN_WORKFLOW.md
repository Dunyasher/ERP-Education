# Super Admin Workflow - Step-by-Step Guide

## Overview

This document describes the complete workflow for managing colleges/institutes through the super admin account.

## Step 1: Create Super Admin Account

### Initial Setup

Run the script to create the first super admin:

```bash
node backend/scripts/createSuperAdmin.js
```

**Default Credentials:**
- Email: `superadmin@system.com` (or set `SUPER_ADMIN_EMAIL` in `.env`)
- Password: `SuperAdmin123!` (or set `SUPER_ADMIN_PASSWORD` in `.env`)

⚠️ **IMPORTANT**: Change the password immediately after first login!

## Step 2: Login as Super Admin

1. Navigate to the login page
2. Enter super admin email and password
3. You'll be redirected to the super admin dashboard

## Step 3: Create New College/Institute

### Via API Endpoint

**POST** `/api/settings/colleges`

**Request Body:**
```json
{
  "name": "Battle College",
  "email": "admin@battlecollege.com",
  "password": "CollegePassword123!",
  "phone": "+1234567890",
  "instituteType": "college",
  "contactInfo": {
    "alternatePhone": "+1234567891",
    "address": {
      "street": "123 Main Street",
      "city": "City Name",
      "state": "State",
      "zipCode": "12345",
      "country": "Country"
    }
  },
  "registrationInfo": {
    "registrationNumber": "REG-12345",
    "registrationDate": "2024-01-01",
    "licenseNumber": "LIC-12345",
    "taxId": "TAX-12345"
  },
  "settings": {
    "logo": "https://example.com/logo.png",
    "theme": {
      "primaryColor": "#1976d2",
      "secondaryColor": "#dc004e"
    },
    "currency": "USD",
    "timezone": "UTC"
  },
  "subscription": {
    "plan": "premium",
    "startDate": "2024-01-01",
    "endDate": "2025-01-01",
    "isActive": true
  }
}
```

**Response:**
```json
{
  "message": "College created successfully",
  "college": {
    "id": "college_id_here",
    "name": "Battle College",
    "email": "admin@battlecollege.com",
    "instituteType": "college",
    "isActive": true
  }
}
```

## Step 4: Assign Admin to College

### Via API Endpoint

**POST** `/api/settings/colleges/:collegeId/assign-admin`

**Request Body:**
```json
{
  "email": "admin@battlecollege.com",
  "password": "AdminPassword123!",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  },
  "permissions": {
    "manageStudents": true,
    "manageTeachers": true,
    "manageCourses": true,
    "manageFees": true,
    "manageAttendance": true,
    "viewReports": true,
    "manageSettings": false,
    "manageUsers": true
  }
}
```

**Default Permissions** (if not specified):
- ✅ manageStudents: true
- ✅ manageTeachers: true
- ✅ manageCourses: true
- ✅ manageFees: true
- ✅ manageAttendance: true
- ✅ viewReports: true
- ❌ manageSettings: false (only super admin)
- ✅ manageUsers: true

**Response:**
```json
{
  "message": "Admin assigned successfully",
  "user": {
    "id": "user_id_here",
    "email": "admin@battlecollege.com",
    "role": "admin",
    "collegeId": "college_id_here",
    "permissions": { ... },
    "profile": { ... }
  }
}
```

## Step 5: Configure Payment System

### Via API Endpoint

**PUT** `/api/settings/colleges/:collegeId/payment-config`

**Request Body:**
```json
{
  "paymentMethods": ["cash", "bank_transfer", "online", "cheque"],
  "currency": "USD",
  "taxRate": 10,
  "feeStructure": {
    "admissionFee": 100,
    "tuitionFee": 500,
    "labFee": 50,
    "libraryFee": 25
  },
  "paymentGateway": {
    "provider": "stripe",
    "apiKey": "sk_test_...",
    "webhookSecret": "whsec_..."
  }
}
```

**Response:**
```json
{
  "message": "Payment configuration updated successfully",
  "paymentConfig": {
    "paymentMethods": ["cash", "bank_transfer", "online", "cheque"],
    "currency": "USD",
    "taxRate": 10,
    "feeStructure": { ... },
    "paymentGateway": { ... }
  }
}
```

## Complete Workflow Summary

1. ✅ **Login as Super Admin**
   - Use super admin credentials
   - Access super admin dashboard

2. ✅ **Create College**
   - Go to Account Settings → Colleges
   - Click "Create New College"
   - Fill in college details
   - Submit form

3. ✅ **Assign Admin**
   - Select the created college
   - Click "Assign Admin"
   - Enter admin email, password, and profile
   - Set permissions
   - Submit

4. ✅ **Configure Payment**
   - Select the college
   - Go to Payment Configuration
   - Set payment methods, currency, tax rate
   - Configure fee structure
   - Set up payment gateway (if needed)
   - Save configuration

5. ✅ **College is Ready**
   - Admin can now log in with their credentials
   - Admin has access only to their college's data
   - Payment system is configured
   - College can start managing students, teachers, courses, etc.

## API Endpoints Reference

### College Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/settings/colleges` | Get all colleges | Super Admin |
| POST | `/api/settings/colleges` | Create new college | Super Admin |
| GET | `/api/colleges/:id` | Get college details | Super Admin |
| PUT | `/api/colleges/:id` | Update college | Super Admin |
| POST | `/api/settings/colleges/:id/assign-admin` | Assign admin | Super Admin |
| GET | `/api/colleges/:id/admins` | Get college admins | Super Admin |
| PUT | `/api/colleges/:id/admins/:adminId/permissions` | Update admin permissions | Super Admin |
| PUT | `/api/settings/colleges/:id/payment-config` | Configure payment | Super Admin |
| GET | `/api/colleges/:id/payment-config` | Get payment config | Super Admin |
| GET | `/api/colleges/:id/stats` | Get college statistics | Super Admin |

## Permissions System

Each admin can have specific permissions:

- **manageStudents**: Create, update, delete students
- **manageTeachers**: Create, update, delete teachers
- **manageCourses**: Create, update, delete courses
- **manageFees**: Manage fee structures and invoices
- **manageAttendance**: Mark and manage attendance
- **viewReports**: Access reports and analytics
- **manageSettings**: Manage college settings (usually false for admins)
- **manageUsers**: Create and manage users within the college

## Security Features

1. **Super Admin Only**: Only super admin can create colleges
2. **Data Isolation**: Each college's data is completely isolated
3. **Permission-Based Access**: Admins have specific permissions
4. **College Validation**: All operations verify college membership
5. **Password Security**: All passwords are hashed

## Frontend Integration

The frontend should provide:

1. **Super Admin Dashboard**
   - List of all colleges
   - Create new college form
   - College management interface

2. **College Settings Page**
   - College details
   - Admin assignment interface
   - Payment configuration form
   - Permission management

3. **Admin Dashboard** (for college admins)
   - College-specific data only
   - Based on assigned permissions

## Example: Creating Battle College

```javascript
// 1. Login as super admin
POST /api/auth/login
{
  "email": "superadmin@system.com",
  "password": "SuperAdmin123!"
}

// 2. Create college
POST /api/settings/colleges
{
  "name": "Battle College",
  "email": "admin@battlecollege.com",
  "password": "Battle123!",
  "phone": "+1234567890",
  "instituteType": "college"
}

// 3. Assign admin (use collegeId from step 2)
POST /api/settings/colleges/{collegeId}/assign-admin
{
  "email": "john.doe@battlecollege.com",
  "password": "Admin123!",
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  }
}

// 4. Configure payment
PUT /api/settings/colleges/{collegeId}/payment-config
{
  "paymentMethods": ["cash", "bank_transfer"],
  "currency": "USD",
  "taxRate": 10
}
```

## Notes

- Each college operates independently
- Admins can only access their college's data
- Super admin can access all colleges
- Payment configuration is per college
- Permissions can be customized per admin


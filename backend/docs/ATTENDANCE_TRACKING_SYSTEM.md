# Per-Student, Per-Subject Attendance Tracking System

## Overview

This system tracks attendance for each student separately for each course/subject, and automatically calculates total attendance across all subjects. Each student can view their individual subject attendance as well as their overall total attendance.

## Key Features

### 1. **Per-Student Course Tracking**
- Each student can be enrolled in multiple courses
- Student model now supports a `courses` array for multiple enrollments
- Each course enrollment has:
  - `courseId`: Reference to the course
  - `enrolledDate`: When the student enrolled
  - `status`: active, completed, or dropped

### 2. **Per-Subject Attendance Records**
- Attendance is tracked separately for each course/subject
- Each attendance record includes:
  - `studentId`: The student
  - `courseId`: The specific course/subject
  - `date`: Date of attendance
  - `status`: present, absent, late, or excused
  - `collegeId`: College isolation (multi-tenant)

### 3. **Automatic Total Calculation**
- System automatically sums attendance across all subjects
- Calculates:
  - Total days across all subjects
  - Total present, absent, late, excused
  - Overall attendance percentage

## API Endpoints

### Get Student Attendance by Subject with Totals

**GET** `/api/attendance/student/:studentId`

**Query Parameters:**
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date

**Response:**
```json
{
  "studentId": "student_id",
  "studentName": "John Doe",
  "studentSrNo": "STU-0001",
  "courses": [
    {
      "courseId": "course_id_1",
      "courseName": "Mathematics",
      "categoryName": "Science",
      "records": [...],
      "present": 45,
      "absent": 5,
      "late": 2,
      "excused": 1,
      "total": 53,
      "percentage": "84.91"
    },
    {
      "courseId": "course_id_2",
      "courseName": "English",
      "categoryName": "Language",
      "records": [...],
      "present": 48,
      "absent": 2,
      "late": 1,
      "excused": 0,
      "total": 51,
      "percentage": "94.12"
    }
  ],
  "totals": {
    "totalDays": 104,
    "present": 93,
    "absent": 7,
    "late": 3,
    "excused": 1,
    "percentage": "89.42"
  },
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

### Mark Attendance

**POST** `/api/attendance`

**Body:**
```json
{
  "studentId": "student_id",
  "courseId": "course_id",
  "date": "2024-01-15",
  "status": "present",
  "remarks": "On time"
}
```

### Mark Bulk Attendance

**POST** `/api/attendance/bulk`

**Body:**
```json
{
  "students": ["student_id_1", "student_id_2"],
  "courseId": "course_id",
  "date": "2024-01-15",
  "status": "present"
}
```

## Frontend Implementation

### Student Attendance Page

**Route:** `/student/attendance`

**Features:**
1. **Overall Summary Cards:**
   - Total Days
   - Present Count
   - Absent Count
   - Overall Percentage

2. **Per-Subject Breakdown:**
   - Each course/subject shown separately
   - Individual attendance percentage
   - Present/Absent/Late/Excused counts
   - Visual progress bar

3. **Date Range Filter:**
   - Filter attendance by date range
   - Apply or clear filters

4. **Recent Records:**
   - Shows recent attendance records
   - Color-coded by status

## Data Structure

### Student Model (Updated)
```javascript
{
  academicInfo: {
    courseId: ObjectId,  // Primary course (backward compatible)
    courses: [           // Multiple courses support
      {
        courseId: ObjectId,
        enrolledDate: Date,
        status: 'active' | 'completed' | 'dropped'
      }
    ]
  }
}
```

### Attendance Model
```javascript
{
  collegeId: ObjectId,    // College isolation
  studentId: ObjectId,    // Student
  courseId: ObjectId,     // Course/Subject
  date: Date,             // Attendance date
  status: 'present' | 'absent' | 'late' | 'excused',
  markedBy: ObjectId,     // Teacher who marked
  remarks: String
}
```

## How It Works

### 1. **Attendance Recording**
- Teacher/admin marks attendance for a specific course
- Each record is stored with `studentId`, `courseId`, and `date`
- Records are isolated by `collegeId` (multi-tenant)

### 2. **Attendance Retrieval**
- System fetches all attendance records for a student
- Groups records by `courseId` (subject)
- Calculates statistics per subject:
  - Present, Absent, Late, Excused counts
  - Total days per subject
  - Percentage per subject

### 3. **Total Calculation**
- Sums all attendance across all subjects
- Calculates overall:
  - Total days (sum of all subject totals)
  - Total present (sum of all subject presents)
  - Total absent (sum of all subject absents)
  - Overall percentage (total present / total days)

## Example Scenario

**Student: John Doe**
- Enrolled in: Mathematics, English, Physics

**Mathematics:**
- Total days: 50
- Present: 45
- Absent: 5
- Percentage: 90%

**English:**
- Total days: 48
- Present: 46
- Absent: 2
- Percentage: 95.83%

**Physics:**
- Total days: 52
- Present: 48
- Absent: 4
- Percentage: 92.31%

**Overall Totals:**
- Total days: 150 (50 + 48 + 52)
- Total present: 139 (45 + 46 + 48)
- Total absent: 11 (5 + 2 + 4)
- Overall percentage: 92.67% (139/150)

## Security & Data Isolation

- All attendance records are filtered by `collegeId`
- Students can only see their own attendance
- Teachers can only mark attendance for their college
- Admins can view all attendance within their college

## Benefits

✅ **Individual Subject Tracking**: Each subject's attendance is tracked separately
✅ **Total Attendance**: Automatic calculation of overall attendance
✅ **Flexible**: Students can be enrolled in multiple courses
✅ **Detailed**: Shows present, absent, late, and excused separately
✅ **Filterable**: Can filter by date range
✅ **Multi-Tenant**: Complete data isolation per college

## Usage

1. **Mark Attendance:**
   - Teacher/admin marks attendance for a course
   - System stores record with student, course, and date

2. **View Student Attendance:**
   - Student navigates to `/student/attendance`
   - System fetches all attendance records
   - Displays per-subject breakdown and totals

3. **Filter by Date:**
   - Student can set start and end dates
   - System recalculates statistics for date range

This system ensures complete tracking of each student's attendance per subject while providing an easy-to-understand overall summary.


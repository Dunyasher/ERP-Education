const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { authenticate, authorize } = require('../middleware/auth');
const { addCollegeFilter, buildCollegeQuery } = require('../middleware/collegeFilter');

// @route   GET /api/attendance
// @desc    Get attendance records (filtered by college)
// @access  Private
router.get('/', authenticate, addCollegeFilter, async (req, res) => {
  try {
    const { studentId, courseId, date, startDate, endDate } = req.query;
    const query = buildCollegeQuery(req);
    
    if (studentId) query.studentId = studentId;
    if (courseId) query.courseId = courseId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const attendance = await Attendance.find(query)
      .populate('studentId', 'srNo personalInfo.fullName')
      .populate('courseId', 'name')
      .populate('markedBy', 'personalInfo.fullName')
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance
// @desc    Mark attendance (with college filtering)
// @access  Private (Admin, Teacher)
router.post('/', authenticate, authorize('admin', 'super_admin', 'teacher'), addCollegeFilter, async (req, res) => {
  try {
    // Get collegeId from user or request
    if (!req.collegeId && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'College access required' });
    }
    
    const collegeId = req.collegeId || req.body.collegeId;
    if (!collegeId && req.user.role !== 'super_admin') {
      return res.status(400).json({ message: 'College ID is required' });
    }
    
    const attendance = await Attendance.create({
      ...req.body,
      collegeId: collegeId,
      markedBy: req.user.id,
      attendanceType: req.body.attendanceType || 'manual' // Default to manual
    });
    
    const populatedAttendance = await Attendance.findById(newAttendance._id)
      .populate('studentId', 'srNo personalInfo.fullName')
      .populate('courseId', 'name');
    
    res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/bulk
// @desc    Mark bulk attendance (with college filtering)
// @access  Private (Admin, Teacher)
router.post('/bulk', authenticate, authorize('admin', 'super_admin', 'teacher'), addCollegeFilter, async (req, res) => {
  try {
    const { students, courseId, date, status } = req.body;
    
    // Get collegeId
    if (!req.collegeId && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'College access required' });
    }
    
    const collegeId = req.collegeId || req.body.collegeId;
    if (!collegeId && req.user.role !== 'super_admin') {
      return res.status(400).json({ message: 'College ID is required' });
    }
    
    const attendanceRecords = students.map(studentId => ({
      studentId,
      courseId: courseId || null,
      collegeId: collegeId,
      date: date || new Date(),
      status: status || 'present',
      attendanceType: 'manual',
      markedBy: req.user.id
    }));
    
    const attendance = await Attendance.insertMany(attendanceRecords);
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Bulk attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance
// @access  Private (Admin, Teacher)
router.put('/:id', authenticate, authorize('admin', 'super_admin', 'teacher'), addCollegeFilter, async (req, res) => {
  try {
    const query = buildCollegeQuery(req, { _id: req.params.id });
    const attendance = await Attendance.findOne(query);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Update attendance
    Object.assign(attendance, req.body);
    await attendance.save();
    
    const updatedAttendance = await Attendance.findById(attendance._id)
      .populate('studentId', 'srNo personalInfo.fullName')
      .populate('courseId', 'name');
    
    res.json(updatedAttendance);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/student/:studentId
// @desc    Get student attendance by subject with totals
// @access  Private
router.get('/student/:studentId', authenticate, addCollegeFilter, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Verify student belongs to user's college
    const studentQuery = buildCollegeQuery(req, { _id: studentId });
    const student = await Student.findOne(studentQuery);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Build attendance query
    const attendanceQuery = buildCollegeQuery(req, { studentId });
    
    if (startDate && endDate) {
      attendanceQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get all attendance records for this student
    const allAttendance = await Attendance.find(attendanceQuery)
      .populate('courseId', 'name categoryId')
      .populate({
        path: 'courseId',
        populate: {
          path: 'categoryId',
          select: 'name'
        }
      })
      .sort({ date: -1 });
    
    // Group attendance by course/subject
    const attendanceByCourse = {};
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;
    let totalDays = 0;
    
    allAttendance.forEach(record => {
      const courseId = record.courseId?._id?.toString() || 'no-course';
      const courseName = record.courseId?.name || 'No Course';
      const categoryName = record.courseId?.categoryId?.name || 'Uncategorized';
      
      if (!attendanceByCourse[courseId]) {
        attendanceByCourse[courseId] = {
          courseId: courseId,
          courseName: courseName,
          categoryName: categoryName,
          records: [],
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
          percentage: 0
        };
      }
      
      attendanceByCourse[courseId].records.push({
        date: record.date,
        status: record.status,
        remarks: record.remarks,
        markedBy: record.markedBy
      });
      
      // Count by status
      if (record.status === 'present') {
        attendanceByCourse[courseId].present++;
        totalPresent++;
      } else if (record.status === 'absent') {
        attendanceByCourse[courseId].absent++;
        totalAbsent++;
      } else if (record.status === 'late') {
        attendanceByCourse[courseId].late++;
        totalLate++;
      } else if (record.status === 'excused') {
        attendanceByCourse[courseId].excused++;
        totalExcused++;
      }
      
      attendanceByCourse[courseId].total++;
      totalDays++;
    });
    
    // Calculate percentages for each course
    Object.values(attendanceByCourse).forEach(course => {
      if (course.total > 0) {
        course.percentage = ((course.present / course.total) * 100).toFixed(2);
      }
    });
    
    // Calculate overall percentage
    const overallPercentage = totalDays > 0 
      ? ((totalPresent / totalDays) * 100).toFixed(2)
      : 0;
    
    res.json({
      studentId: student._id,
      studentName: student.personalInfo?.fullName,
      studentSrNo: student.srNo,
      courses: Object.values(attendanceByCourse),
      totals: {
        totalDays,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        excused: totalExcused,
        percentage: overallPercentage
      },
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/attendance/scan
// @desc    Scan student card and automatically record attendance
// @access  Private (Admin, Teacher)
router.post('/scan', authenticate, authorize('admin', 'super_admin', 'teacher'), addCollegeFilter, async (req, res) => {
  try {
    const { cardId, courseId, lateThreshold } = req.body;
    
    if (!cardId) {
      return res.status(400).json({ message: 'Card ID is required' });
    }
    
    // Get collegeId
    if (!req.collegeId && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'College access required' });
    }
    
    const collegeId = req.collegeId || req.body.collegeId;
    if (!collegeId && req.user.role !== 'super_admin') {
      return res.status(400).json({ message: 'College ID is required' });
    }
    
    // Try to parse QR code data if it's JSON
    let cardIdToUse = cardId;
    try {
      const qrData = JSON.parse(cardId);
      if (qrData.cardId) {
        cardIdToUse = qrData.cardId;
      } else if (qrData.studentId) {
        // If QR contains studentId, find student and get card ID
        const studentFromQR = await Student.findById(qrData.studentId);
        if (studentFromQR && studentFromQR.collegeId.toString() === collegeId.toString()) {
          cardIdToUse = studentFromQR.admissionNo || studentFromQR.srNo || studentFromQR.rollNo || studentFromQR._id.toString();
        }
      }
    } catch (e) {
      // Not JSON, use as is
    }
    
    // Find student by card ID (can be admissionNo, srNo, rollNo, qrCode, or _id)
    const student = await Student.findOne({
      collegeId: collegeId,
      $or: [
        { admissionNo: cardIdToUse },
        { srNo: cardIdToUse },
        { rollNo: cardIdToUse },
        { qrCode: cardIdToUse },
        { _id: cardIdToUse }
      ]
    }).populate('userId', 'email profile.firstName profile.lastName');
    
    if (!student) {
      return res.status(404).json({ 
        message: 'Student not found with this card ID',
        cardId: cardId 
      });
    }
    
    // Check if student is active
    if (student.academicInfo.status !== 'active') {
      return res.status(400).json({ 
        message: 'Student is not active',
        status: student.academicInfo.status 
      });
    }
    
    // Get current date and time
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // Determine if student is late (default: after 9:00 AM)
    const lateThresholdTime = lateThreshold || 9; // 9 AM default
    const isLate = now.getHours() >= lateThresholdTime && now.getMinutes() > 0;
    const status = isLate ? 'late' : 'present';
    
    // Check if attendance already recorded for today
    const existingAttendance = await Attendance.findOne({
      studentId: student._id,
      courseId: courseId || null,
      date: { $gte: todayStart, $lte: todayEnd },
      collegeId: collegeId
    });
    
    // Determine digital method
    let digitalMethod = 'card_scan';
    try {
      const qrData = JSON.parse(cardId);
      if (qrData) {
        digitalMethod = 'qr_code';
      }
    } catch (e) {
      // Not QR code, use card_scan
    }
    
    if (existingAttendance) {
      // Update existing attendance if needed
      if (existingAttendance.status !== status || existingAttendance.attendanceType !== 'digital') {
        existingAttendance.status = status;
        existingAttendance.date = now; // Update time
        existingAttendance.attendanceType = 'digital';
        existingAttendance.digitalMethod = digitalMethod;
        existingAttendance.cardId = cardIdToUse;
        existingAttendance.remarks = `Updated via ${digitalMethod === 'qr_code' ? 'QR code' : 'card'} scan at ${now.toLocaleTimeString()}`;
        await existingAttendance.save();
      }
      
      const updatedAttendance = await Attendance.findById(existingAttendance._id)
        .populate('studentId', 'srNo personalInfo.fullName admissionNo rollNo className section')
        .populate('courseId', 'name');
      
      return res.json({
        message: 'Attendance already recorded, updated if needed',
        attendance: updatedAttendance,
        student: {
          name: student.personalInfo.fullName,
          admissionNo: student.admissionNo,
          srNo: student.srNo,
          rollNo: student.rollNo
        },
        time: now.toLocaleTimeString(),
        status: updatedAttendance.status,
        isUpdate: true
      });
    }
    
    // Create new attendance record (digital type)
    const newAttendance = await Attendance.create({
      studentId: student._id,
      courseId: courseId || null,
      collegeId: collegeId,
      className: student.className || null,
      section: student.section || null,
      date: now,
      status: status,
      attendanceType: 'digital',
      digitalMethod: digitalMethod,
      cardId: cardIdToUse,
      markedBy: req.user.id,
      remarks: `Recorded via ${digitalMethod === 'qr_code' ? 'QR code' : 'card'} scan at ${now.toLocaleTimeString()}`
    });
    
    const populatedAttendance = await Attendance.findById(newAttendance._id)
      .populate('studentId', 'srNo personalInfo.fullName admissionNo rollNo className section')
      .populate('courseId', 'name')
      .populate('markedBy', 'profile.firstName profile.lastName');
    
    res.status(201).json({
      message: `Attendance recorded successfully via ${digitalMethod === 'qr_code' ? 'QR code' : 'card'} scan`,
      attendance: populatedAttendance,
      student: {
        name: student.personalInfo.fullName,
        admissionNo: student.admissionNo,
        srNo: student.srNo,
        rollNo: student.rollNo
      },
      time: now.toLocaleTimeString(),
      date: now.toLocaleDateString(),
      status: status,
      isLate: isLate,
      isUpdate: false
    });
  } catch (error) {
    console.error('Scan attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/attendance/scan/history
// @desc    Get recent scan history
// @access  Private (Admin, Teacher)
router.get('/scan/history', authenticate, authorize('admin', 'super_admin', 'teacher'), addCollegeFilter, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const query = buildCollegeQuery(req);
    
    // Get today's attendance records
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    query.date = { $gte: todayStart, $lte: todayEnd };
    query.remarks = { $regex: /card scan/i }; // Only get card scan records
    
    const history = await Attendance.find(query)
      .populate('studentId', 'srNo personalInfo.fullName admissionNo rollNo')
      .populate('courseId', 'name')
      .populate('markedBy', 'profile.firstName profile.lastName')
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    res.json({
      count: history.length,
      records: history
    });
  } catch (error) {
    console.error('Get scan history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/attendance/reports/summary
// @desc    Get comprehensive attendance summary report
// @access  Private (Admin, Teacher)
router.get('/reports/summary', authenticate, authorize('admin', 'super_admin', 'teacher'), addCollegeFilter, async (req, res) => {
  try {
    const { studentId, courseId, className, section, startDate, endDate, attendanceType } = req.query;
    const query = buildCollegeQuery(req);
    
    if (studentId) query.studentId = studentId;
    if (courseId) query.courseId = courseId;
    if (className) query.className = className;
    if (section) query.section = section;
    if (attendanceType) query.attendanceType = attendanceType;
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const attendance = await Attendance.find(query)
      .populate('studentId', 'srNo personalInfo.fullName admissionNo rollNo className section')
      .populate('courseId', 'name')
      .populate('markedBy', 'profile.firstName profile.lastName')
      .sort({ date: -1 });
    
    // Calculate statistics
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const excused = attendance.filter(a => a.status === 'excused').length;
    const leave = attendance.filter(a => a.status === 'leave').length;
    
    const manual = attendance.filter(a => a.attendanceType === 'manual').length;
    const digital = attendance.filter(a => a.attendanceType === 'digital').length;
    
    // Group by student
    const byStudent = {};
    attendance.forEach(record => {
      const sid = record.studentId._id.toString();
      if (!byStudent[sid]) {
        byStudent[sid] = {
          student: record.studentId,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          leave: 0,
          manual: 0,
          digital: 0,
          percentage: 0
        };
      }
      byStudent[sid].total++;
      byStudent[sid][record.status]++;
      byStudent[sid][record.attendanceType]++;
      byStudent[sid].percentage = ((byStudent[sid].present + byStudent[sid].late) / byStudent[sid].total * 100).toFixed(2);
    });
    
    // Group by date
    const byDate = {};
    attendance.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = {
          date: dateKey,
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        };
      }
      byDate[dateKey].total++;
      byDate[dateKey][record.status]++;
    });
    
    res.json({
      summary: {
        total,
        present,
        absent,
        late,
        excused,
        leave,
        manual,
        digital,
        presentPercentage: total > 0 ? ((present + late) / total * 100).toFixed(2) : 0
      },
      byStudent: Object.values(byStudent),
      byDate: Object.values(byDate),
      records: attendance
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/attendance/student/:studentId/history
// @desc    Get complete attendance history for a student
// @access  Private (Admin, Teacher, Student)
router.get('/student/:studentId/history', authenticate, addCollegeFilter, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, courseId, attendanceType } = req.query;
    
    // Check if user can access this student's data
    if (req.user.role === 'student') {
      // Students can only view their own attendance
      const student = await Student.findOne({ userId: req.user.id });
      if (!student || student._id.toString() !== studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const query = buildCollegeQuery(req);
    query.studentId = studentId;
    
    if (courseId) query.courseId = courseId;
    if (attendanceType) query.attendanceType = attendanceType;
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const attendance = await Attendance.find(query)
      .populate('courseId', 'name')
      .populate('markedBy', 'profile.firstName profile.lastName')
      .sort({ date: -1 });
    
    // Calculate statistics
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const excused = attendance.filter(a => a.status === 'excused').length;
    const leave = attendance.filter(a => a.status === 'leave').length;
    
    const manual = attendance.filter(a => a.attendanceType === 'manual').length;
    const digital = attendance.filter(a => a.attendanceType === 'digital').length;
    
    // Group by course
    const byCourse = {};
    attendance.forEach(record => {
      const cid = record.courseId?._id?.toString() || 'general';
      const cname = record.courseId?.name || 'General';
      if (!byCourse[cid]) {
        byCourse[cid] = {
          courseId: record.courseId?._id,
          courseName: cname,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          leave: 0,
          percentage: 0
        };
      }
      byCourse[cid].total++;
      byCourse[cid][record.status]++;
      byCourse[cid].percentage = ((byCourse[cid].present + byCourse[cid].late) / byCourse[cid].total * 100).toFixed(2);
    });
    
    res.json({
      studentId,
      summary: {
        total,
        present,
        absent,
        late,
        excused,
        leave,
        manual,
        digital,
        presentPercentage: total > 0 ? ((present + late) / total * 100).toFixed(2) : 0
      },
      byCourse: Object.values(byCourse),
      records: attendance
    });
  } catch (error) {
    console.error('Get student attendance history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/attendance/face-scan
// @desc    Record attendance using face recognition
// @access  Private (Admin, Teacher)
router.post('/face-scan', authenticate, authorize('admin', 'super_admin', 'teacher'), addCollegeFilter, async (req, res) => {
  try {
    const { faceId, faceTemplate, courseId, lateThreshold = '09:00', deviceId, confidence } = req.body;
    const collegeId = req.collegeId;

    if (!collegeId) {
      return res.status(403).json({ message: 'College ID is required for face scan attendance.' });
    }

    if (!faceId && !faceTemplate) {
      return res.status(400).json({ message: 'Face ID or face template is required.' });
    }

    // Find student by face ID or match face template
    let student;
    if (faceId) {
      student = await Student.findOne({
        collegeId,
        'biometric.faceId': faceId
      }).populate('userId', 'email profile.firstName profile.lastName');
    } else {
      // In a real implementation, you would match the face template using face recognition algorithms
      // For now, we'll search by faceTemplate field
      student = await Student.findOne({
        collegeId,
        'biometric.faceTemplate': faceTemplate
      }).populate('userId', 'email profile.firstName profile.lastName');
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found with this face data.' });
    }

    // Determine attendance status (present or late)
    const now = new Date();
    const [lateHour, lateMinute] = lateThreshold.split(':').map(Number);
    const lateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), lateHour, lateMinute, 0);

    const status = now > lateTime ? 'late' : 'present';

    // Check if attendance already exists for today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let existingAttendance = await Attendance.findOne({
      studentId: student._id,
      courseId: courseId || null,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingAttendance) {
      // Update existing attendance
      if (existingAttendance.status === 'absent' || existingAttendance.status === 'excused') {
        existingAttendance.status = status;
        existingAttendance.date = now;
        existingAttendance.attendanceType = 'digital';
        existingAttendance.digitalMethod = 'face_scan';
        existingAttendance.biometricData = {
          faceId: faceId || student.biometric?.faceId,
          confidence: confidence || 95,
          deviceId: deviceId || 'default'
        };
        existingAttendance.markedBy = req.user.id;
        await existingAttendance.save();
        return res.json({
          message: `Attendance updated for ${student.personalInfo.fullName} to ${status}.`,
          student: {
            id: student._id,
            name: student.personalInfo.fullName,
            time: now,
            status: status,
            method: 'face_scan'
          }
        });
      } else {
        return res.status(200).json({
          message: `Attendance already recorded for ${student.personalInfo.fullName} as ${existingAttendance.status}.`,
          student: {
            id: student._id,
            name: student.personalInfo.fullName,
            time: existingAttendance.date,
            status: existingAttendance.status
          }
        });
      }
    }

    // Create new attendance record
    const newAttendance = await Attendance.create({
      collegeId,
      studentId: student._id,
      courseId: courseId || null,
      className: student.className || null,
      section: student.section || null,
      date: now,
      status: status,
      attendanceType: 'digital',
      digitalMethod: 'face_scan',
      biometricData: {
        faceId: faceId || student.biometric?.faceId,
        confidence: confidence || 95,
        deviceId: deviceId || 'default'
      },
      markedBy: req.user.id,
      remarks: `Recorded via face scan at ${now.toLocaleTimeString()}`
    });

    res.status(201).json({
      message: `Attendance recorded for ${student.personalInfo.fullName} as ${status}.`,
      student: {
        id: student._id,
        name: student.personalInfo.fullName,
        time: newAttendance.date,
        status: newAttendance.status,
        method: 'face_scan',
        confidence: confidence || 95
      }
    });

  } catch (error) {
    console.error('Face scan attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/attendance/fingerprint-scan
// @desc    Record attendance using fingerprint recognition
// @access  Private (Admin, Teacher)
router.post('/fingerprint-scan', authenticate, authorize('admin', 'super_admin', 'teacher'), addCollegeFilter, async (req, res) => {
  try {
    const { fingerprintId, fingerprintTemplate, courseId, lateThreshold = '09:00', deviceId, confidence } = req.body;
    const collegeId = req.collegeId;

    if (!collegeId) {
      return res.status(403).json({ message: 'College ID is required for fingerprint scan attendance.' });
    }

    if (!fingerprintId && !fingerprintTemplate) {
      return res.status(400).json({ message: 'Fingerprint ID or fingerprint template is required.' });
    }

    // Find student by fingerprint ID or match fingerprint template
    let student;
    if (fingerprintId) {
      student = await Student.findOne({
        collegeId,
        'biometric.fingerprintId': fingerprintId
      }).populate('userId', 'email profile.firstName profile.lastName');
    } else {
      // In a real implementation, you would match the fingerprint template using fingerprint recognition algorithms
      // For now, we'll search by fingerprintTemplate field
      student = await Student.findOne({
        collegeId,
        'biometric.fingerprintTemplate': fingerprintTemplate
      }).populate('userId', 'email profile.firstName profile.lastName');
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found with this fingerprint data.' });
    }

    // Determine attendance status (present or late)
    const now = new Date();
    const [lateHour, lateMinute] = lateThreshold.split(':').map(Number);
    const lateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), lateHour, lateMinute, 0);

    const status = now > lateTime ? 'late' : 'present';

    // Check if attendance already exists for today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let existingAttendance = await Attendance.findOne({
      studentId: student._id,
      courseId: courseId || null,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingAttendance) {
      // Update existing attendance
      if (existingAttendance.status === 'absent' || existingAttendance.status === 'excused') {
        existingAttendance.status = status;
        existingAttendance.date = now;
        existingAttendance.attendanceType = 'digital';
        existingAttendance.digitalMethod = 'fingerprint';
        existingAttendance.biometricData = {
          fingerprintId: fingerprintId || student.biometric?.fingerprintId,
          confidence: confidence || 95,
          deviceId: deviceId || 'default'
        };
        existingAttendance.markedBy = req.user.id;
        await existingAttendance.save();
        return res.json({
          message: `Attendance updated for ${student.personalInfo.fullName} to ${status}.`,
          student: {
            id: student._id,
            name: student.personalInfo.fullName,
            time: now,
            status: status,
            method: 'fingerprint'
          }
        });
      } else {
        return res.status(200).json({
          message: `Attendance already recorded for ${student.personalInfo.fullName} as ${existingAttendance.status}.`,
          student: {
            id: student._id,
            name: student.personalInfo.fullName,
            time: existingAttendance.date,
            status: existingAttendance.status
          }
        });
      }
    }

    // Create new attendance record
    const newAttendance = await Attendance.create({
      collegeId,
      studentId: student._id,
      courseId: courseId || null,
      className: student.className || null,
      section: student.section || null,
      date: now,
      status: status,
      attendanceType: 'digital',
      digitalMethod: 'fingerprint',
      biometricData: {
        fingerprintId: fingerprintId || student.biometric?.fingerprintId,
        confidence: confidence || 95,
        deviceId: deviceId || 'default'
      },
      markedBy: req.user.id,
      remarks: `Recorded via fingerprint scan at ${now.toLocaleTimeString()}`
    });

    res.status(201).json({
      message: `Attendance recorded for ${student.personalInfo.fullName} as ${status}.`,
      student: {
        id: student._id,
        name: student.personalInfo.fullName,
        time: newAttendance.date,
        status: newAttendance.status,
        method: 'fingerprint',
        confidence: confidence || 95
      }
    });

  } catch (error) {
    console.error('Fingerprint scan attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


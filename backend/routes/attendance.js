const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, courseId, date, startDate, endDate } = req.query;
    const query = {};
    
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
// @desc    Mark attendance
// @access  Private (Admin, Teacher)
router.post('/', authenticate, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    const attendance = await Attendance.create({
      ...req.body,
      markedBy: req.user.id
    });
    
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('studentId', 'srNo personalInfo.fullName')
      .populate('courseId', 'name');
    
    res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/bulk
// @desc    Mark bulk attendance
// @access  Private (Admin, Teacher)
router.post('/bulk', authenticate, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    const { students, courseId, date, status } = req.body;
    
    const attendanceRecords = students.map(studentId => ({
      studentId,
      courseId,
      date: date || new Date(),
      status: status || 'present',
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
router.put('/:id', authenticate, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('studentId', 'srNo personalInfo.fullName');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json(attendance);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


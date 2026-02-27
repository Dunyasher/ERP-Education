const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Invoice = require('../models/Fee').Invoice;
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/classes
// @desc    Get all classes with summary statistics
// @access  Private (Admin, Accountant)
router.get('/', authenticate, authorize('admin', 'super_admin', 'accountant'), async (req, res) => {
  try {
    const courses = await Course.find({ status: 'published' })
      .populate('categoryId', 'name instituteType')
      .populate('instructorId', 'personalInfo.fullName')
      .sort({ name: 1 });

    // Get statistics for each course
    const classesWithStats = await Promise.all(
      courses.map(async (course) => {
        // Get all students enrolled in this course
        const students = await Student.find({
          'academicInfo.courseId': course._id,
          'academicInfo.status': 'active'
        }).populate('userId', 'email');

        // Calculate fee statistics
        let totalFee = 0;
        let totalPaid = 0;
        let totalPending = 0;

        students.forEach(student => {
          const studentTotalFee = student.feeInfo?.totalFee || 0;
          const studentPaidFee = student.feeInfo?.paidFee || 0;
          const studentPendingFee = student.feeInfo?.pendingFee || (studentTotalFee - studentPaidFee);

          totalFee += studentTotalFee;
          totalPaid += studentPaidFee;
          totalPending += studentPendingFee;
        });

        return {
          _id: course._id,
          name: course.name,
          srNo: course.srNo,
          category: course.categoryId?.name || 'N/A',
          categoryId: course.categoryId?._id || null,
          instituteType: course.instituteType || 'N/A',
          instructor: course.instructorId?.personalInfo?.fullName || 'Not Assigned',
          schedules: course.schedules || [],
          studentCount: students.length,
          totalFee,
          totalPaid,
          totalPending,
          capacity: course.capacity || 50,
          enrolledStudents: students.length
        };
      })
    );

    res.json(classesWithStats);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/classes/:id
// @desc    Get detailed class information
// @access  Private (Admin)
router.get('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructorId', 'personalInfo.fullName personalInfo.photo contactInfo.phone contactInfo.email')
      .populate('categoryId', 'name instituteType');

    if (!course) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Get all students enrolled in this course
    const students = await Student.find({
      'academicInfo.courseId': req.params.id,
      'academicInfo.status': 'active'
    })
      .populate('userId', 'email')
      .sort({ 'personalInfo.fullName': 1 });

    // Get all invoices for students in this course
    const studentIds = students.map(s => s._id);
    const invoices = await Invoice.find({
      studentId: { $in: studentIds }
    }).sort({ createdAt: -1 });

    // Calculate detailed fee statistics
    let totalFee = 0;
    let totalPaid = 0;
    let totalPending = 0;
    const studentFeeDetails = [];

    students.forEach(student => {
      const studentTotalFee = student.feeInfo?.totalFee || 0;
      const studentPaidFee = student.feeInfo?.paidFee || 0;
      const studentPendingFee = student.feeInfo?.pendingFee || (studentTotalFee - studentPaidFee);

      totalFee += studentTotalFee;
      totalPaid += studentPaidFee;
      totalPending += studentPendingFee;

      // Get student's invoices
      const studentInvoices = invoices.filter(inv => 
        inv.studentId?.toString() === student._id.toString()
      );

      studentFeeDetails.push({
        student: {
          _id: student._id,
          srNo: student.srNo,
          admissionNo: student.admissionNo,
          fullName: student.personalInfo?.fullName,
          email: student.userId?.email,
          phone: student.contactInfo?.phone,
          fatherName: student.parentInfo?.fatherName,
          admissionDate: student.academicInfo?.admissionDate
        },
        feeInfo: {
          totalFee: studentTotalFee,
          paidFee: studentPaidFee,
          pendingFee: studentPendingFee
        },
        invoices: studentInvoices.map(inv => ({
          invoiceNo: inv.invoiceNo,
          totalAmount: inv.totalAmount,
          paidAmount: inv.paidAmount,
          pendingAmount: inv.pendingAmount,
          status: inv.status,
          invoiceDate: inv.invoiceDate
        }))
      });
    });

    // Get teacher fee collection (if teacher is assigned)
    let teacherFeeCollection = 0;
    if (course.instructorId) {
      // Calculate total fees collected by this teacher for this course
      const teacherInvoices = invoices.filter(inv => {
        const student = students.find(s => s._id.toString() === inv.studentId?.toString());
        return student && inv.paidAmount > 0;
      });
      teacherFeeCollection = teacherInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    }

    // Group students by schedule if schedules exist
    const studentsBySchedule = {};
    if (course.schedules && course.schedules.length > 0) {
      course.schedules.forEach((schedule, index) => {
        // For now, distribute students evenly or you can add schedule assignment to student model later
        const studentsPerSchedule = Math.ceil(students.length / course.schedules.length);
        const startIndex = index * studentsPerSchedule;
        const endIndex = Math.min(startIndex + studentsPerSchedule, students.length);
        studentsBySchedule[`${schedule.startTime}-${schedule.endTime}`] = {
          schedule: schedule,
          students: studentFeeDetails.slice(startIndex, endIndex),
          count: endIndex - startIndex
        };
      });
    } else {
      // If no schedules, put all students in default
      studentsBySchedule['All Students'] = {
        schedule: null,
        students: studentFeeDetails,
        count: studentFeeDetails.length
      };
    }

    const classDetails = {
      course: {
        _id: course._id,
        name: course.name,
        srNo: course.srNo,
        description: course.description,
        category: course.categoryId?.name || 'N/A',
        categoryId: course.categoryId ? {
          _id: course.categoryId._id,
          name: course.categoryId.name,
          instituteType: course.categoryId.instituteType
        } : null,
        instituteType: course.instituteType || course.categoryId?.instituteType,
        schedules: course.schedules || [],
        capacity: course.capacity || 50,
        enrolledStudents: students.length,
        duration: course.duration,
        fee: course.fee
      },
      instructor: course.instructorId ? {
        _id: course.instructorId._id,
        name: course.instructorId.personalInfo?.fullName,
        email: course.instructorId.contactInfo?.email,
        phone: course.instructorId.contactInfo?.phone,
        photo: course.instructorId.personalInfo?.photo
      } : null,
      statistics: {
        totalStudents: students.length,
        totalFee,
        totalPaid,
        totalPending,
        collectionRate: totalFee > 0 ? ((totalPaid / totalFee) * 100).toFixed(2) : 0,
        teacherFeeCollection
      },
      studentsBySchedule,
      allStudents: studentFeeDetails
    };

    res.json(classDetails);
  } catch (error) {
    console.error('Get class details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/classes/:id/schedule
// @desc    Add a schedule to a class
// @access  Private (Admin)
router.post('/:id/schedule', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { startTime, endTime, days, room } = req.body;
    
    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start time and end time are required' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Add new schedule
    course.schedules.push({
      startTime,
      endTime,
      days: days || [],
      room: room || '',
      isActive: true
    });

    await course.save();

    const updatedCourse = await Course.findById(req.params.id)
      .populate('instructorId', 'personalInfo.fullName')
      .populate('categoryId', 'name');

    res.json({
      message: 'Schedule added successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Add schedule error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/classes/:id/schedule/:scheduleIndex
// @desc    Update a schedule in a class
// @access  Private (Admin)
router.put('/:id/schedule/:scheduleIndex', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const scheduleIndex = parseInt(req.params.scheduleIndex);
    const { startTime, endTime, days, room, isActive } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (scheduleIndex < 0 || scheduleIndex >= course.schedules.length) {
      return res.status(400).json({ message: 'Invalid schedule index' });
    }

    // Update schedule
    if (startTime) course.schedules[scheduleIndex].startTime = startTime;
    if (endTime) course.schedules[scheduleIndex].endTime = endTime;
    if (days !== undefined) course.schedules[scheduleIndex].days = days;
    if (room !== undefined) course.schedules[scheduleIndex].room = room;
    if (isActive !== undefined) course.schedules[scheduleIndex].isActive = isActive;

    await course.save();

    const updatedCourse = await Course.findById(req.params.id)
      .populate('instructorId', 'personalInfo.fullName')
      .populate('categoryId', 'name');

    res.json({
      message: 'Schedule updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/classes/:id/schedule/:scheduleIndex
// @desc    Delete a schedule from a class
// @access  Private (Admin)
router.delete('/:id/schedule/:scheduleIndex', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const scheduleIndex = parseInt(req.params.scheduleIndex);

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (scheduleIndex < 0 || scheduleIndex >= course.schedules.length) {
      return res.status(400).json({ message: 'Invalid schedule index' });
    }

    // Remove schedule
    course.schedules.splice(scheduleIndex, 1);
    await course.save();

    const updatedCourse = await Course.findById(req.params.id)
      .populate('instructorId', 'personalInfo.fullName')
      .populate('categoryId', 'name');

    res.json({
      message: 'Schedule deleted successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/classes/:id/instructor
// @desc    Assign/update instructor for a class
// @access  Private (Admin)
router.put('/:id/instructor', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { instructorId } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify teacher exists if instructorId is provided
    if (instructorId) {
      const teacher = await Teacher.findById(instructorId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      course.instructorId = instructorId;
    } else {
      course.instructorId = null;
    }

    await course.save();

    const updatedCourse = await Course.findById(req.params.id)
      .populate('instructorId', 'personalInfo.fullName personalInfo.photo contactInfo.phone contactInfo.email')
      .populate('categoryId', 'name');

    res.json({
      message: 'Instructor assigned successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Assign instructor error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


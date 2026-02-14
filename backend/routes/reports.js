const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Category = require('../models/Category');
const { Invoice } = require('../models/Fee');
const Expense = require('../models/Expense');
const Attendance = require('../models/Attendance');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/reports/students
// @desc    Generate student report
// @access  Private (Admin, Accountant)
router.get('/students', authenticate, authorize('admin', 'super_admin', 'accountant'), async (req, res) => {
  try {
    const { instituteType, status, courseId, startDate, endDate } = req.query;
    const query = {};
    
    if (instituteType) query['academicInfo.instituteType'] = instituteType;
    if (status) query['academicInfo.status'] = status;
    if (courseId) query['academicInfo.courseId'] = courseId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const students = await Student.find(query)
      .populate('userId', 'email')
      .populate('academicInfo.courseId', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      total: students.length,
      data: students
    });
  } catch (error) {
    console.error('Student report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/fees
// @desc    Generate fee report
// @access  Private (Admin, Accountant)
router.get('/fees', authenticate, authorize('admin', 'super_admin', 'accountant'), async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const invoices = await Invoice.find(query)
      .populate('studentId', 'srNo personalInfo.fullName')
      .sort({ createdAt: -1 });
    
    const summary = {
      total: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      paidAmount: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
      pendingAmount: invoices.reduce((sum, inv) => sum + inv.pendingAmount, 0),
      data: invoices
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Fee report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/teachers
// @desc    Generate teacher report
// @access  Private (Admin)
router.get('/teachers', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { instituteType, status } = req.query;
    const query = {};
    
    if (instituteType) query['employment.instituteType'] = instituteType;
    if (status) query['employment.status'] = status;
    
    const teachers = await Teacher.find(query)
      .populate('userId', 'email')
      .populate('employment.courses', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      total: teachers.length,
      data: teachers
    });
  } catch (error) {
    console.error('Teacher report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/courses
// @desc    Generate course report
// @access  Private (Admin)
router.get('/courses', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { instituteType, status, categoryId } = req.query;
    const query = {};
    
    if (instituteType) query.instituteType = instituteType;
    if (status) query.status = status;
    if (categoryId) query.categoryId = categoryId;
    
    const courses = await Course.find(query)
      .populate('categoryId', 'name')
      .populate('instructorId', 'personalInfo.fullName')
      .sort({ createdAt: -1 });
    
    res.json({
      total: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Course report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/attendance
// @desc    Generate attendance report
// @access  Private (Admin, Teacher)
router.get('/attendance', authenticate, async (req, res) => {
  try {
    const { studentId, courseId, startDate, endDate } = req.query;
    const query = {};
    
    if (studentId) query.studentId = studentId;
    if (courseId) query.courseId = courseId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const attendance = await Attendance.find(query)
      .populate('studentId', 'srNo personalInfo.fullName')
      .populate('courseId', 'name')
      .sort({ date: -1 });
    
    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };
    
    res.json({
      ...stats,
      data: attendance
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/financial
// @desc    Generate comprehensive financial report (daily/monthly income and expenses)
// @access  Private (Admin)
router.get('/financial', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { date, startDate, endDate, month, year } = req.query;
    
    let queryStart, queryEnd;
    const now = new Date();
    
    // Determine date range
    if (date) {
      // Single date
      const reportDate = new Date(date);
      queryStart = new Date(reportDate);
      queryStart.setHours(0, 0, 0, 0);
      queryEnd = new Date(reportDate);
      queryEnd.setHours(23, 59, 59, 999);
    } else if (startDate && endDate) {
      // Date range
      queryStart = new Date(startDate);
      queryStart.setHours(0, 0, 0, 0);
      queryEnd = new Date(endDate);
      queryEnd.setHours(23, 59, 59, 999);
    } else if (month && year) {
      // Specific month
      queryStart = new Date(year, month - 1, 1);
      queryEnd = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      // Current month by default
      queryStart = new Date(now.getFullYear(), now.getMonth(), 1);
      queryEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    // Calculate daily income (from invoices paid on each day)
    const dailyIncome = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['paid', 'partial'] },
          $or: [
            { paymentDate: { $gte: queryStart, $lte: queryEnd } },
            {
              $and: [
                { paymentDate: { $exists: false } },
                { updatedAt: { $gte: queryStart, $lte: queryEnd } }
              ]
            }
          ]
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $ifNull: ['$paymentDate', '$updatedAt'] }
            }
          },
          total: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Calculate daily expenses
    const dailyExpenses = await Expense.aggregate([
      {
        $match: {
          date: { $gte: queryStart, $lte: queryEnd }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date'
            }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Calculate total monthly income
    const monthlyIncomeResult = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['paid', 'partial'] },
          $or: [
            { paymentDate: { $gte: queryStart, $lte: queryEnd } },
            {
              $and: [
                { paymentDate: { $exists: false } },
                { updatedAt: { $gte: queryStart, $lte: queryEnd } }
              ]
            }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate total monthly expenses
    const monthlyExpensesResult = await Expense.aggregate([
      {
        $match: {
          date: { $gte: queryStart, $lte: queryEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get detailed income transactions
    const incomeTransactions = await Invoice.find({
      status: { $in: ['paid', 'partial'] },
      $or: [
        { paymentDate: { $gte: queryStart, $lte: queryEnd } },
        {
          $and: [
            { paymentDate: { $exists: false } },
            { updatedAt: { $gte: queryStart, $lte: queryEnd } }
          ]
        }
      ]
    })
      .populate('studentId', 'srNo personalInfo.fullName')
      .sort({ paymentDate: -1, updatedAt: -1 })
      .limit(100);
    
    // Get detailed expense transactions
    const expenseTransactions = await Expense.find({
      date: { $gte: queryStart, $lte: queryEnd }
    })
      .populate('createdBy', 'email profile.firstName profile.lastName')
      .sort({ date: -1 })
      .limit(100);
    
    const monthlyIncome = monthlyIncomeResult[0]?.total || 0;
    const monthlyExpenses = monthlyExpensesResult[0]?.total || 0;
    
    res.json({
      period: {
        start: queryStart,
        end: queryEnd
      },
      summary: {
        totalIncome: monthlyIncome,
        totalExpenses: monthlyExpenses,
        netBalance: monthlyIncome - monthlyExpenses,
        incomeCount: monthlyIncomeResult[0]?.count || 0,
        expenseCount: monthlyExpensesResult[0]?.count || 0
      },
      dailyIncome,
      dailyExpenses,
      transactions: {
        income: incomeTransactions,
        expenses: expenseTransactions
      }
    });
  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/admissions
// @desc    Generate admission report
// @access  Private (Admin)
router.get('/admissions', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { startDate, endDate, month, year, department, courseId } = req.query;
    
    let query = {};
    let queryStart, queryEnd;
    const now = new Date();
    
    // Determine date range
    if (startDate && endDate) {
      queryStart = new Date(startDate);
      queryStart.setHours(0, 0, 0, 0);
      queryEnd = new Date(endDate);
      queryEnd.setHours(23, 59, 59, 999);
    } else if (month && year) {
      queryStart = new Date(year, month - 1, 1);
      queryEnd = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      // Current month by default
      queryStart = new Date(now.getFullYear(), now.getMonth(), 1);
      queryEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    // Build query
    query.$or = [
      { 'academicInfo.admissionDate': { $gte: queryStart, $lte: queryEnd } },
      {
        $and: [
          { 'academicInfo.admissionDate': { $exists: false } },
          { createdAt: { $gte: queryStart, $lte: queryEnd } }
        ]
      }
    ];
    
    if (courseId) {
      query['academicInfo.courseId'] = courseId;
    }
    
    // Get admissions
    const admissions = await Student.find(query)
      .populate('userId', 'email')
      .populate({
        path: 'academicInfo.courseId',
        select: 'name categoryId',
        populate: {
          path: 'categoryId',
          select: 'name'
        }
      })
      .sort({ 'academicInfo.admissionDate': -1, createdAt: -1 });
    
    // Filter by department if specified
    let filteredAdmissions = admissions;
    if (department) {
      filteredAdmissions = admissions.filter(admission => {
        const dept = admission.academicInfo?.courseId?.categoryId?.name || 'Uncategorized';
        return dept.toLowerCase().includes(department.toLowerCase());
      });
    }
    
    // Calculate statistics
    const stats = {
      total: filteredAdmissions.length,
      byDepartment: {},
      byCourse: {},
      byDate: {}
    };
    
    filteredAdmissions.forEach(admission => {
      const dept = admission.academicInfo?.courseId?.categoryId?.name || 'Uncategorized';
      const course = admission.academicInfo?.courseId?.name || 'Not Assigned';
      const date = admission.academicInfo?.admissionDate || admission.createdAt;
      const dateKey = date.toISOString().split('T')[0];
      
      stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
      stats.byCourse[course] = (stats.byCourse[course] || 0) + 1;
      stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + 1;
    });
    
    res.json({
      period: {
        start: queryStart,
        end: queryEnd
      },
      statistics: stats,
      data: filteredAdmissions
    });
  } catch (error) {
    console.error('Admission report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/students-by-department
// @desc    Get students grouped by department
// @access  Private (Admin)
router.get('/students-by-department', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const students = await Student.find({ 'academicInfo.status': 'active' })
      .populate({
        path: 'academicInfo.courseId',
        select: 'name categoryId',
        populate: {
          path: 'categoryId',
          select: 'name'
        }
      })
      .select('srNo personalInfo.fullName academicInfo.courseId');
    
    const departmentBreakdown = {};
    const courseBreakdown = {};
    
    students.forEach(student => {
      const category = student.academicInfo?.courseId?.categoryId;
      const course = student.academicInfo?.courseId;
      
      const deptName = category?.name || 'Uncategorized';
      const courseName = course?.name || 'Not Assigned';
      
      // Department breakdown
      if (!departmentBreakdown[deptName]) {
        departmentBreakdown[deptName] = {
          name: deptName,
          count: 0,
          students: [],
          courses: {}
        };
      }
      departmentBreakdown[deptName].count++;
      departmentBreakdown[deptName].students.push({
        srNo: student.srNo,
        name: student.personalInfo?.fullName,
        course: courseName
      });
      
      // Course breakdown within department
      if (!departmentBreakdown[deptName].courses[courseName]) {
        departmentBreakdown[deptName].courses[courseName] = 0;
      }
      departmentBreakdown[deptName].courses[courseName]++;
      
      // Overall course breakdown
      if (!courseBreakdown[courseName]) {
        courseBreakdown[courseName] = {
          name: courseName,
          department: deptName,
          count: 0,
          students: []
        };
      }
      courseBreakdown[courseName].count++;
      courseBreakdown[courseName].students.push({
        srNo: student.srNo,
        name: student.personalInfo?.fullName
      });
    });
    
    res.json({
      byDepartment: Object.values(departmentBreakdown),
      byCourse: Object.values(courseBreakdown),
      total: students.length
    });
  } catch (error) {
    console.error('Students by department error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


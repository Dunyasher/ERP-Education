const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Category = require('../models/Category');
const { Invoice } = require('../models/Fee');
const Expense = require('../models/Expense');
const Attendance = require('../models/Attendance');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/dashboard/admin
// @desc    Get admin dashboard stats
// @access  Private (Admin)
router.get('/admin', authenticate, async (req, res) => {
  try {
    const { instituteType } = req.query;
    const query = {};
    if (instituteType) {
      query['academicInfo.instituteType'] = instituteType;
    }
    
    // Get current month start and end dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // Get today's start and end dates
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // Get all students with their courses and categories for department breakdown
    let students = [];
    let departmentStats = [];
    let totalFeeAmount = 0;
    let amountCollected = 0;
    
    try {
      students = await Student.find(query)
        .populate({
          path: 'academicInfo.courseId',
          select: 'name categoryId',
          populate: {
            path: 'categoryId',
            select: 'name'
          }
        })
        .select('academicInfo feeInfo');
      
      // Calculate department breakdown
      const departmentBreakdown = {};
      students.forEach(student => {
        const category = student.academicInfo?.courseId?.categoryId;
        if (category) {
          const deptName = category.name || 'Uncategorized';
          if (!departmentBreakdown[deptName]) {
            departmentBreakdown[deptName] = 0;
          }
          departmentBreakdown[deptName]++;
        } else {
          const deptName = 'Uncategorized';
          if (!departmentBreakdown[deptName]) {
            departmentBreakdown[deptName] = 0;
          }
          departmentBreakdown[deptName]++;
        }
      });
      
      // Convert to array format
      departmentStats = Object.entries(departmentBreakdown).map(([name, count]) => ({
        name,
        count
      }));
      
      // Calculate total fee amount (sum of all student total fees)
      totalFeeAmount = students.reduce((sum, student) => {
        return sum + (student.feeInfo?.totalFee || 0);
      }, 0);
      
      // Calculate amount collected so far (sum of all paid fees)
      amountCollected = students.reduce((sum, student) => {
        return sum + (student.feeInfo?.paidFee || 0);
      }, 0);
    } catch (studentError) {
      console.error('Error processing students data:', studentError.message);
      // Continue with empty/default values if there's an error
    }
    
    // Calculate monthly income (from invoices paid this month)
    // Include invoices that are paid and either have paymentDate this month or were updated this month
    let monthlyIncome = 0;
    try {
      const monthlyIncomeResult = await Invoice.aggregate([
        {
          $match: {
            status: 'paid',
            $or: [
              {
                paymentDate: {
                  $gte: currentMonthStart,
                  $lte: currentMonthEnd
                }
              },
              {
                $and: [
                  { paymentDate: { $exists: false } },
                  { updatedAt: { $gte: currentMonthStart, $lte: currentMonthEnd } }
                ]
              }
            ]
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$paidAmount' }
          }
        }
      ]);
      monthlyIncome = monthlyIncomeResult[0]?.total || 0;
    } catch (incomeError) {
      console.error('Error calculating monthly income:', incomeError.message);
      // Continue with 0 income if there's an error
      monthlyIncome = 0;
    }
    
    // Calculate monthly expenses
    let monthlyExpenses = 0;
    try {
      const monthlyExpensesResult = await Expense.aggregate([
        {
          $match: {
            date: {
              $gte: currentMonthStart,
              $lte: currentMonthEnd
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      monthlyExpenses = monthlyExpensesResult[0]?.total || 0;
    } catch (expenseError) {
      console.error('Error calculating monthly expenses:', expenseError.message);
      // Continue with 0 expenses if there's an error
      monthlyExpenses = 0;
    }
    
    // Get other stats
    let totalStudents = 0;
    let totalTeachers = 0;
    let totalCourses = 0;
    let activeStudents = 0;
    let totalRevenue = 0;
    let pendingFees = 0;
    
    try {
      const [
        studentsCount,
        teachersCount,
        coursesCount,
        activeCount,
        revenueResult,
        pendingResult
      ] = await Promise.all([
        Student.countDocuments(query),
        Teacher.countDocuments(instituteType ? { 'employment.instituteType': instituteType } : {}),
        Course.countDocuments(instituteType ? { instituteType } : {}),
        Student.countDocuments({ ...query, 'academicInfo.status': 'active' }),
        Invoice.aggregate([
          { $match: { status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$paidAmount' } } }
        ]).catch(() => []),
        Invoice.aggregate([
          { $match: { status: { $in: ['pending', 'partial'] } } },
          { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
        ]).catch(() => [])
      ]);
      
      totalStudents = studentsCount || 0;
      totalTeachers = teachersCount || 0;
      totalCourses = coursesCount || 0;
      activeStudents = activeCount || 0;
      totalRevenue = revenueResult[0]?.total || 0;
      pendingFees = pendingResult[0]?.total || 0;
    } catch (statsError) {
      console.error('Error fetching dashboard stats:', statsError.message);
      // Continue with default values
    }
    
    // Get admission statistics
    let admissionsThisMonth = 0;
    let admissionsToday = 0;
    let recentAdmissions = [];
    
    try {
      // Admissions this month (based on admissionDate or createdAt)
      admissionsThisMonth = await Student.countDocuments({
        ...query,
        $or: [
          { 'academicInfo.admissionDate': { $gte: currentMonthStart, $lte: currentMonthEnd } },
          { 
            $and: [
              { 'academicInfo.admissionDate': { $exists: false } },
              { createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } }
            ]
          }
        ]
      });
      
      // Admissions today
      admissionsToday = await Student.countDocuments({
        ...query,
        $or: [
          { 'academicInfo.admissionDate': { $gte: todayStart, $lte: todayEnd } },
          { 
            $and: [
              { 'academicInfo.admissionDate': { $exists: false } },
              { createdAt: { $gte: todayStart, $lte: todayEnd } }
            ]
          }
        ]
      });
      
      // Recent admissions (last 10)
      recentAdmissions = await Student.find(query)
        .populate('academicInfo.courseId', 'name')
        .populate('userId', 'email')
        .select('srNo personalInfo.fullName academicInfo.admissionDate academicInfo.courseId createdAt')
        .sort({ 'academicInfo.admissionDate': -1, createdAt: -1 })
        .limit(10)
        .lean();
      
      // Format recent admissions
      recentAdmissions = recentAdmissions.map(student => ({
        srNo: student.srNo,
        name: student.personalInfo?.fullName || 'N/A',
        course: student.academicInfo?.courseId?.name || 'Not Assigned',
        admissionDate: student.academicInfo?.admissionDate || student.createdAt,
        email: student.userId?.email || 'N/A'
      }));
    } catch (admissionError) {
      console.error('Error fetching admission statistics:', admissionError.message);
      // Continue with default values
    }
    
    res.json({
      totalStudents,
      totalTeachers,
      totalCourses,
      activeStudents,
      totalRevenue,
      pendingFees,
      // New comprehensive stats
      departmentBreakdown: departmentStats,
      totalFeeAmount,
      amountCollected,
      monthlyIncome,
      monthlyExpenses,
      netBalance: monthlyIncome - monthlyExpenses,
      // Admission statistics
      admissionsThisMonth,
      admissionsToday,
      recentAdmissions
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/dashboard/teacher
// @desc    Get teacher dashboard stats
// @access  Private (Teacher)
router.get('/teacher', authenticate, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    const [myCourses, myStudents, recentAttendance] = await Promise.all([
      Course.find({ instructorId: teacher._id }).populate('categoryId', 'name'),
      Student.find({ 'academicInfo.courseId': { $in: teacher.employment.courses } }).countDocuments(),
      Attendance.find({ markedBy: teacher._id })
        .populate('studentId', 'personalInfo.fullName')
        .sort({ date: -1 })
        .limit(10)
    ]);
    
    res.json({
      myCourses,
      totalStudents: myStudents,
      recentAttendance
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/student
// @desc    Get student dashboard stats
// @access  Private (Student)
router.get('/student', authenticate, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate('academicInfo.courseId', 'name')
      .populate('feeInfo.feeStructureId');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const [myInvoices, myAttendance] = await Promise.all([
      Invoice.find({ studentId: student._id }).sort({ createdAt: -1 }).limit(5),
      Attendance.find({ studentId: student._id })
        .populate('courseId', 'name')
        .sort({ date: -1 })
        .limit(10)
    ]);
    
    res.json({
      student,
      myInvoices,
      myAttendance,
      pendingFee: student.feeInfo.pendingFee
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


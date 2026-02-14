const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/expenses
// @desc    Get all expenses with filters
// @access  Private (Admin)
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, category, department } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (category) query.category = category;
    if (department) query.department = department;

    const expenses = await Expense.find(query)
      .populate('createdBy', 'email')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private (Admin)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private (Admin)
router.post('/', authenticate, async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      createdBy: req.user.id
    };

    const expense = await Expense.create(expenseData);
    await expense.populate('createdBy', 'email');

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private (Admin)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private (Admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/reports/daily
// @desc    Get daily expense report
// @access  Private (Admin)
router.get('/reports/daily', authenticate, async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    
    let query = {};
    
    if (date) {
      // Single date report
      const reportDate = new Date(date);
      const dayStart = new Date(reportDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(reportDate);
      dayEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: dayStart, $lte: dayEnd };
    } else if (startDate && endDate) {
      // Date range report
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else {
      // Today's report by default
      const today = new Date();
      const dayStart = new Date(today);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(today);
      dayEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: dayStart, $lte: dayEnd };
    }

    // Get expenses
    const expenses = await Expense.find(query)
      .populate('createdBy', 'email profile.firstName profile.lastName')
      .sort({ date: -1 });

    // Calculate totals
    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // Category breakdown
    const categoryBreakdown = expenses.reduce((acc, exp) => {
      const cat = exp.category || 'other';
      if (!acc[cat]) {
        acc[cat] = { total: 0, count: 0, items: [] };
      }
      acc[cat].total += exp.amount || 0;
      acc[cat].count += 1;
      acc[cat].items.push(exp);
      return acc;
    }, {});

    // Department breakdown
    const departmentBreakdown = expenses.reduce((acc, exp) => {
      const dept = exp.department || 'General';
      if (!acc[dept]) {
        acc[dept] = { total: 0, count: 0 };
      }
      acc[dept].total += exp.amount || 0;
      acc[dept].count += 1;
      return acc;
    }, {});

    res.json({
      expenses,
      summary: {
        totalAmount,
        totalCount: expenses.length,
        dateRange: {
          start: query.date.$gte,
          end: query.date.$lte
        }
      },
      categoryBreakdown,
      departmentBreakdown
    });
  } catch (error) {
    console.error('Daily expense report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/expenses/stats/monthly
// @desc    Get monthly expense statistics
// @access  Private (Admin)
router.get('/stats/monthly', authenticate, async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth();

    const monthStart = new Date(targetYear, targetMonth, 1);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const stats = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: monthStart,
            $lte: monthEnd
          }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: monthStart,
            $lte: monthEnd
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

    res.json({
      categoryBreakdown: stats,
      totalExpenses: totalExpenses[0]?.total || 0,
      month: targetMonth + 1,
      year: targetYear
    });
  } catch (error) {
    console.error('Monthly expense stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


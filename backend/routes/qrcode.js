const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Student = require('../models/Student');
const { authenticate, authorize } = require('../middleware/auth');
const { addCollegeFilter, buildCollegeQuery } = require('../middleware/collegeFilter');

// @route   GET /api/qrcode/student/:studentId
// @desc    Generate QR code for a student
// @access  Private (Admin, Teacher, Student)
router.get('/student/:studentId', authenticate, addCollegeFilter, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findById(studentId)
      .populate('userId', 'email');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check access permissions
    if (req.user.role === 'student') {
      const studentUser = await Student.findOne({ userId: req.user.id });
      if (!studentUser || studentUser._id.toString() !== studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Use admissionNo, srNo, or rollNo as card ID
    const cardId = student.admissionNo || student.srNo || student.rollNo || student._id.toString();
    
    // Generate QR code data (JSON with student info)
    const qrData = JSON.stringify({
      studentId: student._id.toString(),
      cardId: cardId,
      name: student.personalInfo.fullName,
      admissionNo: student.admissionNo,
      srNo: student.srNo,
      rollNo: student.rollNo
    });
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1
    });
    
    // Update student with QR code if not set
    if (!student.qrCode) {
      student.qrCode = cardId;
      await student.save();
    }
    
    res.json({
      student: {
        id: student._id,
        name: student.personalInfo.fullName,
        admissionNo: student.admissionNo,
        srNo: student.srNo,
        rollNo: student.rollNo,
        cardId: cardId
      },
      qrCode: qrCodeDataUrl,
      cardId: cardId
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/qrcode/student/:studentId/download
// @desc    Download QR code as PNG
// @access  Private (Admin, Teacher)
router.get('/student/:studentId/download', authenticate, authorize('admin', 'super_admin', 'teacher'), addCollegeFilter, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const cardId = student.admissionNo || student.srNo || student.rollNo || student._id.toString();
    const qrData = JSON.stringify({
      studentId: student._id.toString(),
      cardId: cardId,
      name: student.personalInfo.fullName
    });
    
    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 500,
      margin: 2
    });
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="QR-${student.personalInfo.fullName}-${cardId}.png"`);
    res.send(qrCodeBuffer);
  } catch (error) {
    console.error('Download QR code error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/qrcode/bulk-generate
// @desc    Generate QR codes for multiple students
// @access  Private (Admin, Teacher)
router.post('/bulk-generate', authenticate, authorize('admin', 'super_admin', 'teacher'), addCollegeFilter, async (req, res) => {
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'Student IDs array is required' });
    }
    
    const query = buildCollegeQuery(req);
    query._id = { $in: studentIds };
    
    const students = await Student.find(query);
    
    const qrCodes = await Promise.all(
      students.map(async (student) => {
        const cardId = student.admissionNo || student.srNo || student.rollNo || student._id.toString();
        const qrData = JSON.stringify({
          studentId: student._id.toString(),
          cardId: cardId,
          name: student.personalInfo.fullName
        });
        
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 300,
          margin: 1
        });
        
        // Update student with QR code
        if (!student.qrCode) {
          student.qrCode = cardId;
          await student.save();
        }
        
        return {
          studentId: student._id,
          name: student.personalInfo.fullName,
          admissionNo: student.admissionNo,
          srNo: student.srNo,
          rollNo: student.rollNo,
          cardId: cardId,
          qrCode: qrCodeDataUrl
        };
      })
    );
    
    res.json({
      count: qrCodes.length,
      qrCodes
    });
  } catch (error) {
    console.error('Bulk generate QR codes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


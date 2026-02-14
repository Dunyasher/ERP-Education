const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create notification for student creation
 */
const notifyStudentCreated = async (student, createdBy) => {
  try {
    // Validate inputs
    if (!student || !student._id) {
      console.error('Invalid student object provided to notifyStudentCreated');
      return [];
    }

    if (!createdBy) {
      console.error('Invalid createdBy provided to notifyStudentCreated');
      return [];
    }

    let createdByUser = null;
    let studentUser = null;

    try {
      createdByUser = await User.findById(createdBy);
    } catch (err) {
      console.error('Error fetching createdBy user:', err.message);
    }

    if (student.userId) {
      try {
        studentUser = await User.findById(student.userId);
      } catch (err) {
        console.error('Error fetching student user:', err.message);
      }
    }

    // Get all admins and directors
    let adminsAndDirectors = [];
    try {
      adminsAndDirectors = await User.find({
        role: { $in: ['admin', 'super_admin', 'director', 'owner'] }
      }).limit(100); // Limit to prevent too many notifications
    } catch (err) {
      console.error('Error fetching admins/directors:', err.message);
      return [];
    }

    if (!adminsAndDirectors || adminsAndDirectors.length === 0) {
      console.warn('No admins or directors found to notify');
      return [];
    }

    const notifications = [];

    // Create notification for each admin/director
    for (const recipient of adminsAndDirectors) {
      if (!recipient || !recipient._id) continue;
      
      try {
        const notification = await Notification.create({
          type: 'student_created',
          priority: 'medium',
          title: 'New Student Admitted',
          message: `Student ${student.personalInfo?.fullName || 'N/A'} (${student.srNo || 'N/A'}) has been admitted by ${createdByUser?.email || 'System'}`,
          recipientId: recipient._id,
          recipientRole: recipient.role,
          relatedEntity: {
            entityType: 'student',
            entityId: student._id
          },
          metadata: {
            studentName: student.personalInfo?.fullName || 'N/A',
            studentEmail: studentUser?.email || student.contactInfo?.email || 'N/A',
            studentSrNo: student.srNo || 'N/A',
            createdBy: createdByUser?.email || 'System',
            createdByEmail: createdByUser?.email || 'N/A'
          }
        });
        notifications.push(notification);
      } catch (notifError) {
        console.error(`Error creating notification for recipient ${recipient._id}:`, notifError.message);
        // Continue with other recipients even if one fails
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error creating student creation notification:', error);
    return [];
  }
};

/**
 * Create notification for student deletion
 */
const notifyStudentDeleted = async (student, deletedBy, reason = '') => {
  try {
    // Validate inputs
    if (!student || !student._id) {
      console.error('Invalid student object provided to notifyStudentDeleted');
      return [];
    }

    if (!deletedBy) {
      console.error('Invalid deletedBy provided to notifyStudentDeleted');
      return [];
    }

    let deletedByUser = null;
    let studentUser = null;

    try {
      deletedByUser = await User.findById(deletedBy);
    } catch (err) {
      console.error('Error fetching deletedBy user:', err.message);
    }

    if (student.userId) {
      try {
        studentUser = await User.findById(student.userId);
      } catch (err) {
        console.error('Error fetching student user:', err.message);
      }
    }

    // Get all admins and directors
    let adminsAndDirectors = [];
    try {
      adminsAndDirectors = await User.find({
        role: { $in: ['admin', 'super_admin', 'director', 'owner'] }
      }).limit(100); // Limit to prevent too many notifications
    } catch (err) {
      console.error('Error fetching admins/directors:', err.message);
      return [];
    }

    if (!adminsAndDirectors || adminsAndDirectors.length === 0) {
      console.warn('No admins or directors found to notify');
      return [];
    }

    const notifications = [];

    // Create CRITICAL notification for each admin/director
    for (const recipient of adminsAndDirectors) {
      if (!recipient || !recipient._id) continue;
      
      try {
        const notification = await Notification.create({
          type: 'student_deleted',
          priority: 'critical',
          title: '⚠️ CRITICAL: Student Deleted',
          message: `Student ${student.personalInfo?.fullName || 'N/A'} (${student.srNo || 'N/A'}) has been DELETED by ${deletedByUser?.email || 'System'}. ${reason ? `Reason: ${reason}` : ''}`,
          recipientId: recipient._id,
          recipientRole: recipient.role,
          relatedEntity: {
            entityType: 'student',
            entityId: student._id
          },
          metadata: {
            studentName: student.personalInfo?.fullName || 'N/A',
            studentEmail: studentUser?.email || student.contactInfo?.email || 'N/A',
            studentSrNo: student.srNo || 'N/A',
            deletedBy: deletedByUser?.email || 'System',
            deletedByEmail: deletedByUser?.email || 'N/A',
            reason: reason
          }
        });
        notifications.push(notification);
      } catch (notifError) {
        console.error(`Error creating notification for recipient ${recipient._id}:`, notifError.message);
        // Continue with other recipients even if one fails
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error creating student deletion notification:', error);
    return [];
  }
};

/**
 * Create notification for student modification
 */
const notifyStudentModified = async (student, modifiedBy, changes) => {
  try {
    // Validate inputs
    if (!student || !student._id) {
      console.error('Invalid student object provided to notifyStudentModified');
      return [];
    }

    if (!modifiedBy) {
      console.error('Invalid modifiedBy provided to notifyStudentModified');
      return [];
    }

    let modifiedByUser = null;
    let studentUser = null;

    try {
      modifiedByUser = await User.findById(modifiedBy);
    } catch (err) {
      console.error('Error fetching modifiedBy user:', err.message);
    }

    if (student.userId) {
      try {
        studentUser = await User.findById(student.userId);
      } catch (err) {
        console.error('Error fetching student user:', err.message);
      }
    }

    // Get all admins and directors
    let adminsAndDirectors = [];
    try {
      adminsAndDirectors = await User.find({
        role: { $in: ['admin', 'super_admin', 'director', 'owner'] }
      }).limit(100); // Limit to prevent too many notifications
    } catch (err) {
      console.error('Error fetching admins/directors:', err.message);
      return [];
    }

    if (!adminsAndDirectors || adminsAndDirectors.length === 0) {
      console.warn('No admins or directors found to notify');
      return [];
    }

    const notifications = [];

    for (const recipient of adminsAndDirectors) {
      if (!recipient || !recipient._id) continue;
      
      try {
        const notification = await Notification.create({
          type: 'student_modified',
          priority: 'medium',
          title: 'Student Information Modified',
          message: `Student ${student.personalInfo?.fullName || 'N/A'} (${student.srNo || 'N/A'}) information has been modified by ${modifiedByUser?.email || 'System'}`,
          recipientId: recipient._id,
          recipientRole: recipient.role,
          relatedEntity: {
            entityType: 'student',
            entityId: student._id
          },
          metadata: {
            studentName: student.personalInfo?.fullName || 'N/A',
            studentEmail: studentUser?.email || student.contactInfo?.email || 'N/A',
            studentSrNo: student.srNo || 'N/A',
            createdBy: modifiedByUser?.email || 'System',
            createdByEmail: modifiedByUser?.email || 'N/A',
            oldValues: changes?.oldValues || {},
            newValues: changes?.newValues || {}
          }
        });
        notifications.push(notification);
      } catch (notifError) {
        console.error(`Error creating notification for recipient ${recipient._id}:`, notifError.message);
        // Continue with other recipients even if one fails
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error creating student modification notification:', error);
    return [];
  }
};

module.exports = {
  notifyStudentCreated,
  notifyStudentDeleted,
  notifyStudentModified
};


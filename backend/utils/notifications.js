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

/**
 * Create notification for email change
 */
const notifyEmailChanged = async (user, oldEmail, newEmail, changedBy) => {
  try {
    if (!user || !user._id) {
      console.error('Invalid user object provided to notifyEmailChanged');
      return [];
    }

    let changedByUser = null;
    try {
      changedByUser = await User.findById(changedBy);
    } catch (err) {
      console.error('Error fetching changedBy user:', err.message);
    }

    // Get all admins and directors
    const adminsAndDirectors = await User.find({
      role: { $in: ['admin', 'super_admin', 'director', 'owner'] }
    }).limit(100);

    if (!adminsAndDirectors || adminsAndDirectors.length === 0) {
      return [];
    }

    const notifications = [];

    for (const recipient of adminsAndDirectors) {
      if (!recipient || !recipient._id) continue;
      
      try {
        const notification = await Notification.create({
          type: 'email_changed',
          priority: 'high',
          title: 'Email Address Changed',
          message: `User ${oldEmail} email has been changed to ${newEmail} by ${changedByUser?.email || 'System'}`,
          recipientId: recipient._id,
          recipientRole: recipient.role,
          relatedEntity: {
            entityType: 'user',
            entityId: user._id
          },
          metadata: {
            userId: user._id,
            userEmail: newEmail,
            oldEmail: oldEmail,
            newEmail: newEmail,
            updatedBy: changedByUser?.email || 'System',
            updatedByEmail: changedByUser?.email || 'N/A',
            oldValues: { email: oldEmail },
            newValues: { email: newEmail }
          }
        });
        notifications.push(notification);
      } catch (notifError) {
        console.error(`Error creating notification for recipient ${recipient._id}:`, notifError.message);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error creating email change notification:', error);
    return [];
  }
};

/**
 * Create notification for password change
 */
const notifyPasswordChanged = async (user, changedBy, isAdminChange = false) => {
  try {
    if (!user || !user._id) {
      console.error('Invalid user object provided to notifyPasswordChanged');
      return [];
    }

    let changedByUser = null;
    try {
      changedByUser = await User.findById(changedBy);
    } catch (err) {
      console.error('Error fetching changedBy user:', err.message);
    }

    // Get all admins and directors
    const adminsAndDirectors = await User.find({
      role: { $in: ['admin', 'super_admin', 'director', 'owner'] }
    }).limit(100);

    if (!adminsAndDirectors || adminsAndDirectors.length === 0) {
      return [];
    }

    const notifications = [];

    for (const recipient of adminsAndDirectors) {
      if (!recipient || !recipient._id) continue;
      
      try {
        const notification = await Notification.create({
          type: 'password_changed',
          priority: isAdminChange ? 'high' : 'medium',
          title: isAdminChange ? 'Password Changed by Admin' : 'Password Changed',
          message: isAdminChange 
            ? `Password for user ${user.email} has been changed by admin ${changedByUser?.email || 'System'}`
            : `User ${user.email} has changed their password`,
          recipientId: recipient._id,
          recipientRole: recipient.role,
          relatedEntity: {
            entityType: 'user',
            entityId: user._id
          },
          metadata: {
            userId: user._id,
            userEmail: user.email,
            updatedBy: changedByUser?.email || 'System',
            updatedByEmail: changedByUser?.email || 'N/A'
          }
        });
        notifications.push(notification);
      } catch (notifError) {
        console.error(`Error creating notification for recipient ${recipient._id}:`, notifError.message);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error creating password change notification:', error);
    return [];
  }
};

/**
 * Create notification for financial data updates (income/expense)
 */
const notifyFinancialUpdate = async (type, data, createdBy) => {
  try {
    if (!type || !data) {
      console.error('Invalid data provided to notifyFinancialUpdate');
      return [];
    }

    let createdByUser = null;
    try {
      createdByUser = await User.findById(createdBy);
    } catch (err) {
      console.error('Error fetching createdBy user:', err.message);
    }

    // Get all admins and directors
    const adminsAndDirectors = await User.find({
      role: { $in: ['admin', 'super_admin', 'director', 'owner'] }
    }).limit(100);

    if (!adminsAndDirectors || adminsAndDirectors.length === 0) {
      return [];
    }

    const notifications = [];
    const amount = data.amount || 0;
    const category = data.category || 'N/A';
    const period = data.period || 'N/A';
    const date = data.date ? new Date(data.date).toLocaleDateString() : 'N/A';

    for (const recipient of adminsAndDirectors) {
      if (!recipient || !recipient._id) continue;
      
      try {
        const notificationType = type === 'income' ? 'income_recorded' : 'expense_recorded';
        const title = type === 'income' 
          ? `Income Recorded: ${amount.toLocaleString()}`
          : `Expense Recorded: ${amount.toLocaleString()}`;
        const message = type === 'income'
          ? `${amount.toLocaleString()} income recorded in ${category} category (${period}) by ${createdByUser?.email || 'System'}`
          : `${amount.toLocaleString()} expense recorded in ${category} category (${period}) by ${createdByUser?.email || 'System'}`;

        const notification = await Notification.create({
          type: notificationType,
          priority: amount > 10000 ? 'high' : 'medium',
          title: title,
          message: message,
          recipientId: recipient._id,
          recipientRole: recipient.role,
          relatedEntity: {
            entityType: 'financial',
            entityId: data._id || data.id
          },
          metadata: {
            amount: amount,
            category: category,
            date: data.date,
            period: period,
            createdBy: createdByUser?.email || 'System',
            createdByEmail: createdByUser?.email || 'N/A',
            description: data.description || ''
          }
        });
        notifications.push(notification);
      } catch (notifError) {
        console.error(`Error creating notification for recipient ${recipient._id}:`, notifError.message);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error creating financial update notification:', error);
    return [];
  }
};

module.exports = {
  notifyStudentCreated,
  notifyStudentDeleted,
  notifyStudentModified,
  notifyEmailChanged,
  notifyPasswordChanged,
  notifyFinancialUpdate
};


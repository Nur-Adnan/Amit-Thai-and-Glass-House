import asyncHandler from '../utils/asyncHandler.js';
import ScheduledBackupService from '../services/scheduledBackupService.js';

// @desc    Get scheduled backup service status
// @route   GET /api/backup/scheduled/status
// @access  Private (Owner only)
const getScheduledBackupStatus = asyncHandler(async (req, res) => {
  const status = ScheduledBackupService.getStatus();

  res.status(200).json({
    success: true,
    data: status
  });
});

// @desc    Start scheduled backup service
// @route   POST /api/backup/scheduled/start
// @access  Private (Owner only)
const startScheduledBackup = asyncHandler(async (req, res) => {
  if (ScheduledBackupService.isRunning) {
    return res.status(400).json({
      success: false,
      message: 'Scheduled backup service is already running'
    });
  }

  ScheduledBackupService.start();

  res.status(200).json({
    success: true,
    message: 'Scheduled backup service started successfully',
    data: ScheduledBackupService.getStatus()
  });
});

// @desc    Stop scheduled backup service
// @route   POST /api/backup/scheduled/stop
// @access  Private (Owner only)
const stopScheduledBackup = asyncHandler(async (req, res) => {
  if (!ScheduledBackupService.isRunning) {
    return res.status(400).json({
      success: false,
      message: 'Scheduled backup service is not running'
    });
  }

  ScheduledBackupService.stop();

  res.status(200).json({
    success: true,
    message: 'Scheduled backup service stopped successfully',
    data: ScheduledBackupService.getStatus()
  });
});

// @desc    Trigger manual backup
// @route   POST /api/backup/scheduled/trigger
// @access  Private (Owner only)
const triggerManualBackup = asyncHandler(async (req, res) => {
  try {
    await ScheduledBackupService.triggerManualBackup();

    res.status(200).json({
      success: true,
      message: 'Manual backup triggered successfully',
      data: ScheduledBackupService.getStatus()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export {
  getScheduledBackupStatus,
  startScheduledBackup,
  stopScheduledBackup,
  triggerManualBackup
};
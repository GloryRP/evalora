/**
 * Institution Configuration Controller
 * Manage college/university branding and settings
 */

const InstitutionConfig = require('../models/InstitutionConfig');

/**
 * Get institution configuration
 */
exports.getConfig = async (req, res) => {
  try {
    // Get or create default config
    let config = await InstitutionConfig.findOne();
    
    if (!config) {
      config = await InstitutionConfig.create({
        institutionName: 'PES Institute of Technology & Management',
        abbreviation: 'PES',
      });
      console.log('✓ Created default institution configuration');
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch configuration', 
      error: error.message 
    });
  }
};

/**
 * Update institution configuration
 */
exports.updateConfig = async (req, res) => {
  try {
    const updates = req.body;

    let config = await InstitutionConfig.findOne();
    
    if (!config) {
      config = await InstitutionConfig.create(updates);
    } else {
      Object.assign(config, updates);
      await config.save();
    }

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: config,
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update configuration', 
      error: error.message 
    });
  }
};

/**
 * Get timetable styling configuration
 */
exports.getTimetableConfig = async (req, res) => {
  try {
    let config = await InstitutionConfig.findOne();
    
    if (!config) {
      config = await InstitutionConfig.create({});
    }

    res.json({
      success: true,
      data: config.timetable,
      branding: config.branding,
      institution: {
        name: config.institutionName,
        abbreviation: config.abbreviation,
        logo: config.logo,
        address: config.address,
      },
    });
  } catch (error) {
    console.error('Error fetching timetable config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch timetable configuration', 
      error: error.message 
    });
  }
};

/**
 * Get current academic year and semester (PUBLIC - no auth required)
 */
exports.getCurrent = async (req, res) => {
  try {
    let config = await InstitutionConfig.findOne();
    
    if (!config) {
      config = await InstitutionConfig.create({
        currentAcademicYear: '2025-26',
        currentSemester: 5,
      });
    }

    res.json({
      success: true,
      data: {
        currentAcademicYear: config.currentAcademicYear || config.academicYear || '2025-26',
        currentSemester: config.currentSemester || 5,
        institutionName: config.institutionName,
        shortName: config.abbreviation,
      },
    });
  } catch (error) {
    console.error('Error fetching current academic info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch current academic information', 
      error: error.message 
    });
  }
};

/**
 * Get all academic years (PUBLIC - no auth required)
 */
exports.getAcademicYears = async (req, res) => {
  try {
    let config = await InstitutionConfig.findOne();
    
    if (!config) {
      config = await InstitutionConfig.create({
        currentAcademicYear: '2025-26',
        currentSemester: 5,
        academicYears: [],
      });
    }

    res.json({
      success: true,
      data: {
        academicYears: config.academicYears || [],
        currentAcademicYear: config.currentAcademicYear || config.academicYear || '2025-26',
        currentSemester: config.currentSemester || 5,
      },
    });
  } catch (error) {
    console.error('Error fetching academic years:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch academic years', 
      error: error.message 
    });
  }
};

/**
 * Add new academic year (ADMIN only)
 */
exports.addAcademicYear = async (req, res) => {
  try {
    const { year, startDate, endDate, isCurrent } = req.body;

    if (!year || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Year, start date, and end date are required',
      });
    }

    let config = await InstitutionConfig.findOne();
    
    if (!config) {
      config = await InstitutionConfig.create({
        currentAcademicYear: '2025-26',
        currentSemester: 5,
        academicYears: [],
      });
    }

    // Check if year already exists
    const existingYear = config.academicYears.find(ay => ay.year === year);
    if (existingYear) {
      return res.status(400).json({
        success: false,
        message: 'Academic year already exists',
      });
    }

    // If setting as current, unset all others
    if (isCurrent) {
      config.academicYears.forEach(ay => {
        ay.isCurrent = false;
      });
      config.currentAcademicYear = year;
    }

    // Add new academic year
    config.academicYears.push({
      year,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: isCurrent || false,
      semesters: [],
    });

    await config.save();

    res.json({
      success: true,
      message: 'Academic year added successfully',
      data: config.academicYears,
    });
  } catch (error) {
    console.error('Error adding academic year:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add academic year', 
      error: error.message 
    });
  }
};

/**
 * Update current academic year and semester (ADMIN only)
 */
exports.updateCurrent = async (req, res) => {
  try {
    const { year, currentSemester } = req.body;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Academic year is required',
      });
    }

    let config = await InstitutionConfig.findOne();
    
    if (!config) {
      config = await InstitutionConfig.create({
        currentAcademicYear: year,
        currentSemester: currentSemester || 5,
      });
    } else {
      // Update current academic year
      config.currentAcademicYear = year;
      config.academicYear = year; // Update legacy field for backward compatibility
      
      if (currentSemester !== undefined) {
        config.currentSemester = currentSemester;
      }

      // Update isCurrent flags in academicYears array
      if (config.academicYears && config.academicYears.length > 0) {
        config.academicYears.forEach(ay => {
          ay.isCurrent = ay.year === year;
        });
      }

      await config.save();
    }

    res.json({
      success: true,
      message: 'Current academic year updated successfully',
      data: {
        currentAcademicYear: config.currentAcademicYear,
        currentSemester: config.currentSemester,
      },
    });
  } catch (error) {
    console.error('Error updating current academic year:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update current academic year', 
      error: error.message 
    });
  }
};

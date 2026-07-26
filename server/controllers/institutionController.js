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

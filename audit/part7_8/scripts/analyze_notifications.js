const path = require('path');
module.paths.push(path.join(__dirname, '../../../server/node_modules'));
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../../../server/.env') });
const Notification = require('../../../server/models/Notification');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB:', mongoose.connection.name);
  
  const total = await Notification.countDocuments();
  console.log('Total notifications:', total);
  
  // Count by type
  const byType = await Notification.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log('By type:', JSON.stringify(byType, null, 2));
  
  // Get date range
  const oldest = await Notification.findOne().sort({ createdAt: 1 }).select('createdAt type title');
  const newest = await Notification.findOne().sort({ createdAt: -1 }).select('createdAt type title');
  console.log('Oldest:', JSON.stringify(oldest));
  console.log('Newest:', JSON.stringify(newest));
  
  // Check for result_published - could be from test runs
  const resultPublished = await Notification.find({ type: 'result_published' }).select('createdAt title recipientRole');
  console.log('result_published notifications:', JSON.stringify(resultPublished));
  
  // Any with Test Engineering dept
  const testDept = await Notification.countDocuments({ 'data.department': 'Test Engineering' });
  console.log('Test Engineering dept notifications:', testDept);

  process.exit(0);
})();

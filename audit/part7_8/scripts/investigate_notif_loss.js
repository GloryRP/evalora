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
  
  // Date range analysis
  const d_oct25 = new Date('2026-10-25');
  const d_sep01 = new Date('2026-09-01');
  const d_oct10 = new Date('2026-10-10');
  
  const beforeOct25 = await Notification.countDocuments({ createdAt: { $lt: d_oct25 } });
  const onOrAfterOct25 = await Notification.countDocuments({ createdAt: { $gte: d_oct25 } });
  console.log('Before 2026-10-25:', beforeOct25, '| On/After 2026-10-25:', onOrAfterOct25);
  
  const beforeSep01 = await Notification.countDocuments({ createdAt: { $lt: d_sep01 } });
  const sep01ToOct25 = await Notification.countDocuments({ createdAt: { $gte: d_sep01, $lt: d_oct25 } });
  console.log('Before Sep-01:', beforeSep01, '| Sep-01 to Oct-24:', sep01ToOct25);
  
  // Types breakdown
  const byType = await Notification.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 }, latestDate: { $max: '$createdAt' } } },
    { $sort: { count: -1 } }
  ]);
  console.log('By type:', JSON.stringify(byType, null, 2));
  
  // The 340-287=53 gap. The PART7_8_REPORT first run says 340->340.
  // The second run (verify_fix_tests.js) had a cleanup with:
  // await Notification.deleteMany({ 'data.department': 'Test Engineering' })
  // Check if any timetable_published notifications had data.department set
  const testEngNotif = await Notification.countDocuments({
    $or: [
      { 'data.department': 'Test Engineering' },
      { title: { $regex: /Test Engineering/i } }
    ]
  });
  console.log('Test Engineering related now:', testEngNotif);

  // Check what the 53 notifications were
  // Timetable published had 243, now check if it was 296 before
  const timetableCount = await Notification.countDocuments({ type: 'timetable_published' });
  console.log('timetable_published now:', timetableCount);
  
  process.exit(0);
})();

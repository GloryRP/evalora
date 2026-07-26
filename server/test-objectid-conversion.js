/**
 * Quick test to verify ObjectId conversion is working
 * Run: node test-objectid-conversion.js
 */

const mongoose = require('mongoose');

// Simulate what we get from MongoDB
const mockSubjectFromMongoDB = {
  _id: new mongoose.Types.ObjectId('6a45371c3a84444022ae86e3'),
  subjectCode: 'CS503',
  subjectName: 'Database Systems',
  department: 'CSE',
  semester: 5,
  credits: 4
};

console.log('1. Original MongoDB document:');
console.log('   _id type:', typeof mockSubjectFromMongoDB._id);
console.log('   _id value:', mockSubjectFromMongoDB._id);
console.log('   _id is ObjectId?', mockSubjectFromMongoDB._id instanceof mongoose.Types.ObjectId);
console.log();

// Apply the conversion function from examcellController.js
const convertObjectIds = (doc) => {
  return {
    ...doc,
    _id: doc._id.toString(),
    ...(doc.subjectId && { subjectId: doc.subjectId.toString() }),
    ...(doc.departmentId && { departmentId: doc.departmentId.toString() }),
  };
};

const converted = convertObjectIds(mockSubjectFromMongoDB);

console.log('2. After conversion:');
console.log('   _id type:', typeof converted._id);
console.log('   _id value:', converted._id);
console.log('   _id length:', converted._id.length);
console.log();

console.log('3. Full converted object:');
console.log(JSON.stringify(converted, null, 2));
console.log();

// Test if this would work with Mongoose
try {
  const testObjectId = new mongoose.Types.ObjectId(converted._id);
  console.log('✅ SUCCESS: Converted _id can be converted back to ObjectId');
  console.log('   Back to ObjectId:', testObjectId);
} catch (error) {
  console.log('❌ FAILED: Cannot convert back to ObjectId');
  console.log('   Error:', error.message);
}

console.log();
console.log('4. Testing the scheduling agent fallback logic:');
const subject = converted;
const subject_id = subject._id || subject.id || String(subject.subjectCode);
console.log('   subject._id:', subject._id, '(truthy?', !!subject._id, ')');
console.log('   subject.id:', subject.id, '(truthy?', !!subject.id, ')');
console.log('   subject.subjectCode:', subject.subjectCode);
console.log('   Result:', subject_id);

if (subject_id === converted._id) {
  console.log('   ✅ Using _id (correct!)');
} else if (subject_id === subject.subjectCode) {
  console.log('   ❌ Using subjectCode (wrong! means _id is falsy)');
} else {
  console.log('   ⚠️  Using something else');
}

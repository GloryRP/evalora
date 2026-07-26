module.exports = {
  gradeTable: [
    { min: 90, max: 100, grade: 'O',  
      gradePoint: 10, description: 'Outstanding' },
    { min: 80, max: 89,  grade: 'A+', 
      gradePoint: 9,  description: 'Excellent' },
    { min: 70, max: 79,  grade: 'A',  
      gradePoint: 8,  description: 'Very Good' },
    { min: 60, max: 69,  grade: 'B+', 
      gradePoint: 7,  description: 'Good' },
    { min: 55, max: 59,  grade: 'B',  
      gradePoint: 6,  description: 'Above Average' },
    { min: 50, max: 54,  grade: 'C',  
      gradePoint: 5,  description: 'Average' },
    { min: 40, max: 49,  grade: 'P',  
      gradePoint: 4,  description: 'Pass' },
    { min: 0,  max: 39,  grade: 'F',  
      gradePoint: 0,  description: 'Fail' },
  ],
  passMarkPercentage: 40,
  getGrade: function(marksObtained, maxMarks) {
    const percentage = (marksObtained / maxMarks) * 100;
    const entry = this.gradeTable.find(
      g => percentage >= g.min && 
           percentage <= g.max
    );
    return entry || this.gradeTable[
      this.gradeTable.length - 1
    ];
  }
};

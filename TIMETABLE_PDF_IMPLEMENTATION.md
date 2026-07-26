# Dynamic Timetable PDF Generation - Complete Implementation

## Overview
A **fully configurable, institution-agnostic** timetable PDF generator that works for ANY university/college with customizable:
- Institution branding (colors, logo, name)
- Timetable styling (fonts, borders, columns)
- Document settings (page format, margins, orientation)
- Dynamic columns (show/hide branch, room, semester)

## Architecture

### 1. **InstitutionConfig Model** (`server/models/InstitutionConfig.js`)
Stores all institution and timetable configuration:

```javascript
{
  // Institution Details
  institutionName: "PES Institute of Technology & Management",
  abbreviation: "PES",
  logo: "URL to logo",
  address: { street, city, state, country, postalCode },
  phone: "+91-080-40506906",
  email: "exam@pes.edu",
  website: "www.pes.edu",

  // Timetable Configuration
  timetable: {
    headerStyle: { bgColor, textColor, fontSize },
    tableStyle: { borderColor, headerBgColor, rowBgColor, alternateRowBgColor },
    columns: { date, time, branch, subjectCode, subjectName, room, semester },
    footerText: "This is an official document...",
    signatureLabel: "Examination Controller",
  },

  // Branding
  branding: {
    primaryColor: "#1E3A5F",    // Navy
    secondaryColor: "#C9A227",  // Gold
    backgroundColor: "#FAFAF8", // Off-white
  },

  // Document Settings
  documentDefaults: {
    format: "A4",          // or "Letter"
    orientation: "portrait", // or "landscape"
    margins: {...},
  }
}
```

### 2. **Dynamic HTML Template** (`server/templates/timetable.html`)
Professional timetable template with:
- Dynamic CSS using template variables
- Professional header with institution logo, name, address
- Configurable exam info bar (academic year, date range, generated date)
- Dynamic table columns (show/hide based on config)
- Professional footer with signature area
- Automatic page breaks for multi-page documents

### 3. **PDF Generation Controller** (`server/controllers/timetableController.js`)
Generates PDFs with:
- Puppeteer for HTML → PDF conversion
- Dynamic placeholder replacement from config
- Proper date formatting
- Exam grouping by date
- Responsive styling

### 4. **API Endpoints**

#### Get/Update Institution Configuration
```bash
GET  /api/v1/institution/config              # Get current config
PUT  /api/v1/institution/config              # Update config (admin/examcell only)
GET  /api/v1/institution/timetable-config    # Get config for timetable
```

#### Generate Timetable
```bash
GET  /api/v1/timetable/pdf?semester=5&examType=regular
     # Returns: PDF file (download)

GET  /api/v1/timetable/preview?semester=5&examType=regular
     # Returns: JSON with exam data and configuration
```

## Usage Guide

### Step 1: Install Puppeteer
```bash
cd server
npm install puppeteer
```

### Step 2: Update Institution Config (Admin Panel)
```javascript
// Via API
PUT /api/v1/institution/config
{
  "institutionName": "Your University Name",
  "abbreviation": "YUN",
  "address": {
    "street": "123 University Road",
    "city": "Your City",
    "state": "Your State",
    "country": "India",
    "postalCode": "560027"
  },
  "phone": "+91-XXXXXXXXXX",
  "email": "exam@youruniversity.edu",
  "website": "www.youruniversity.edu",
  "academicYear": "2025-26",
  "branding": {
    "primaryColor": "#1E3A5F",    // Your primary color
    "secondaryColor": "#C9A227",  // Your secondary color
    "backgroundColor": "#FAFAF8"
  },
  "timetable": {
    "columns": {
      "date": true,
      "time": true,
      "branch": true,      // Show/hide department
      "subjectCode": true,
      "subjectName": true,
      "room": false,       // Hide room if not applicable
      "semester": false    // Hide semester if not needed
    },
    "signatureLabel": "Examination Controller",
    "signatureDesignation": "Exam Cell In-charge",
    "footerText": "This is an official document. Unauthorized reproduction is prohibited."
  },
  "documentDefaults": {
    "format": "A4",
    "orientation": "portrait",
    "marginTop": "20mm",
    "marginBottom": "20mm",
    "marginLeft": "15mm",
    "marginRight": "15mm"
  }
}
```

### Step 3: Generate Timetable PDF
Frontend button in `Timetable.jsx`:
```javascript
const handleDownloadTimetable = async (semester) => {
  try {
    const response = await api.get(
      `/timetable/pdf?semester=${semester}&examType=regular`,
      { responseType: 'blob' }
    );
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `timetable-sem${semester}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading timetable:', error);
    showError('Failed to download timetable');
  }
};
```

## Features

### ✅ Institution Customization
- Institution name, abbreviation, logo
- Address, phone, email, website
- Academic year
- Custom branding colors

### ✅ Timetable Styling
- Header background and text color
- Table border, header, and row colors
- Font sizes
- Dynamic columns (show/hide)

### ✅ Document Settings
- Page format (A4, Letter)
- Orientation (portrait, landscape)
- Custom margins
- Automatic page breaks

### ✅ Professional Output
- Institution header with logo area
- Exam information bar (academic year, date range, generated date)
- Well-formatted table with alternating row colors
- Professional footer with signature area
- Footer text/disclaimer
- PDF download capability

## Database Schema

```javascript
InstitutionConfig
├── institutionName: String
├── abbreviation: String
├── logo: String (URL)
├── address: {
│   ├── street: String
│   ├── city: String
│   ├── state: String
│   ├── country: String
│   └── postalCode: String
├── phone: String
├── email: String
├── website: String
├── academicYear: String
├── timetable: {
│   ├── headerStyle: { bgColor, textColor, fontSize }
│   ├── tableStyle: { borderColor, headerBgColor, rowBgColor, alternateRowBgColor, fontSize }
│   ├── columns: { date, time, branch, subjectCode, subjectName, room, semester }
│   ├── footerText: String
│   ├── signatureLabel: String
│   └── signatureDesignation: String
├── branding: {
│   ├── primaryColor: String
│   ├── secondaryColor: String
│   └── backgroundColor: String
├── documentDefaults: {
│   ├── format: String (A4|Letter)
│   ├── orientation: String (portrait|landscape)
│   ├── marginTop: String
│   ├── marginBottom: String
│   ├── marginLeft: String
│   └── marginRight: String
├── createdAt: Date
└── updatedAt: Date
```

## API Response Examples

### Get Configuration
```bash
GET /api/v1/institution/config
```
Response:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "institutionName": "PES Institute of Technology & Management",
    "abbreviation": "PES",
    "branding": {
      "primaryColor": "#1E3A5F",
      "secondaryColor": "#C9A227"
    },
    "timetable": {
      "columns": {
        "date": true,
        "time": true,
        "branch": true,
        "subjectCode": true,
        "subjectName": true,
        "room": false,
        "semester": false
      }
    }
  }
}
```

### Generate PDF
```bash
GET /api/v1/timetable/pdf?semester=5&examType=regular
```
Response: Binary PDF file

### Preview Timetable
```bash
GET /api/v1/timetable/preview?semester=5&examType=regular
```
Response:
```json
{
  "success": true,
  "data": {
    "totalExams": 5,
    "exams": [...],
    "config": {...}
  }
}
```

## Frontend Integration

### Add Download Button to Timetable Page
```jsx
import React, { useState } from 'react';
import { api } from '../lib/api';

export function TimetablePage() {
  const [selectedSemester, setSelectedSemester] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/timetable/pdf?semester=${selectedSemester}&examType=regular`,
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Timetable-Sem${selectedSemester}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to download timetable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
        {[1, 2, 3, 4, 5, 6].map(s => (
          <option key={s} value={s}>Semester {s}</option>
        ))}
      </select>
      
      <button onClick={handleDownloadPDF} disabled={loading}>
        {loading ? 'Generating...' : '📄 Download Timetable PDF'}
      </button>
    </div>
  );
}
```

## Customization Examples

### Example 1: Remove Department Column
```javascript
PUT /api/v1/institution/config
{
  "timetable": {
    "columns": {
      "branch": false  // Hide department
    }
  }
}
```

### Example 2: Change Colors to Red/Gold
```javascript
PUT /api/v1/institution/config
{
  "branding": {
    "primaryColor": "#8B0000",    // Dark Red
    "secondaryColor": "#FFD700"   // Gold
  }
}
```

### Example 3: Landscape A3 Format
```javascript
PUT /api/v1/institution/config
{
  "documentDefaults": {
    "format": "A4",            // Note: A3 requires custom impl
    "orientation": "landscape",
    "marginLeft": "10mm",
    "marginRight": "10mm"
  }
}
```

## Testing

1. **Run seed to initialize config:**
   ```bash
   node seed.js
   ```

2. **Check configuration:**
   ```bash
   curl http://localhost:5000/api/v1/institution/config
   ```

3. **Generate timetable (after creating exams):**
   ```bash
   curl http://localhost:5000/api/v1/timetable/pdf?semester=5&examType=regular > timetable.pdf
   ```

## Troubleshooting

### PDF Generation Fails
- Ensure Puppeteer is installed: `npm install puppeteer`
- Check Node.js version (14+)
- Ensure Chromium dependencies are available

### Configuration Not Applying
- Clear browser cache
- Verify config was saved: `GET /api/v1/institution/config`
- Check for typos in configuration keys

### Styling Issues
- Test with preview endpoint first
- Verify color hex codes are valid
- Check margin values are valid CSS

## Future Enhancements

1. **Multi-language support** (exam timetable in multiple languages)
2. **QR codes** (link to exam guidelines)
3. **Student-specific timetables** (only their exams)
4. **Email delivery** (auto-send timetables to students)
5. **Custom logos** (upload and store institution logo)
6. **Template designer** (visual UI for styling)
7. **Export formats** (Excel, CSV, JSON)
8. **Bulk generation** (all semesters at once)

## Status: ✅ READY FOR IMPLEMENTATION
All code files have been created and integrated with the system.

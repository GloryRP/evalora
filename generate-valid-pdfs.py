import os

pdf_template = """%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << >> >>
endobj
4 0 obj
<< /Length 75 >>
stream
BT
/F1 12 Tf
72 712 Td
(PESITM Scan - Student booklet evaluation matching USN: {usn}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000222 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
348
%%EOF"""

def generate_pdf(path, usn):
    content = pdf_template.format(usn=usn)
    with open(path, 'wb') as f:
        f.write(content.encode('ascii'))
    print(f"Generated valid PDF at {path}")

# Generate inside project
os.makedirs("sample-answer-scripts", exist_ok=True)
generate_pdf("sample-answer-scripts/1PE21CS001_ML.pdf", "1PE21CS001")
generate_pdf("sample-answer-scripts/1PE21CS002_ML.pdf", "1PE21CS002")
generate_pdf("sample-answer-scripts/4PM23CD015_DSP.pdf", "4PM23CD015")

# Generate inside user downloads
downloads_path = "c:/Users/Glory/Downloads/sample-answer-scripts"
os.makedirs(downloads_path, exist_ok=True)
generate_pdf(os.path.join(downloads_path, "1PE21CS001_ML.pdf"), "1PE21CS001")
generate_pdf(os.path.join(downloads_path, "1PE21CS002_ML.pdf"), "1PE21CS002")
generate_pdf(os.path.join(downloads_path, "4PM23CD015_DSP.pdf"), "4PM23CD015")

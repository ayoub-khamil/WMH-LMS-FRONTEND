import { jsPDF } from 'jspdf';

/**
 * Generates and triggers a native download of the completion certificate PDF
 * @param {Object} params
 * @param {string} params.agentName
 * @param {string} params.courseTitle
 * @param {string} params.completionDate
 * @param {number|string} params.courseId
 */
export function downloadCertificatePDF({ agentName, courseTitle, completionDate, courseId }) {
  // Create landscape A4 document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // 1. Clean Flat Border (Monochrome styling)
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(1);
  doc.rect(12, 12, width - 24, height - 24);

  // Inner subtle secondary 1px border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(15, 15, width - 30, height - 30);

  // 2. Header Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text('WATERMELONHUB LMS — BPO OPERATIONS ACADEMY', width / 2, 28, { align: 'center' });

  // 3. Main Title
  doc.setFontSize(26);
  doc.setTextColor(15, 15, 15);
  doc.text('CERTIFICATE OF COMPLETION', width / 2, 45, { align: 'center' });

  // 4. Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('This document certifies that the following professional has successfully mastered all modules and assessments:', width / 2, 56, { align: 'center' });

  // 5. Agent Name (Prominent)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(10, 10, 10);
  doc.text(agentName.toUpperCase(), width / 2, 78, { align: 'center' });

  // Divider line under name
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(0.75);
  doc.line(width / 2 - 60, 83, width / 2 + 60, 83);

  // 6. Course Title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text('For completing the enterprise training curriculum:', width / 2, 95, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 15, 15);
  doc.text(courseTitle, width / 2, 106, { align: 'center' });

  // 7. Verification Meta
  const formattedDate = completionDate ? new Date(completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const certId = `WMH-${courseId}-${Date.now().toString().slice(-6)}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Issue Date: ${formattedDate}`, 30, 140);
  doc.text(`Certificate ID: ${certId}`, 30, 146);
  doc.text('Score: 100% (Full Mastery)', 30, 152);

  // 8. Signature Block
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(width - 90, 142, width - 30, 142);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('Sarah Jenkins', width - 60, 148, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Director of Operations & Compliance', width - 60, 154, { align: 'center' });

  // Generate Blob and trigger native browser file download
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Certificate_${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${agentName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

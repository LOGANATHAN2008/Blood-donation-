const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

/**
 * Generates a high-quality PDF Certificate of Appreciation
 * @param {Object} data { donorName, date, bloodGroup, units, donationCount, certificateId, isMilestone }
 * @returns {Promise<Uint8Array>}
 */
async function generateDonationCertificate({ donorName, date, bloodGroup, units = 1, donationCount = 1, certificateId, isMilestone = false }) {
  const doc = await PDFDocument.create();
  // A4 Landscape: 842 x 595 pt
  const page = doc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  // Background and Border
  // Outer Border Crimson (#E11D48 -> rgb(0.88, 0.11, 0.28))
  const crimson = rgb(0.882, 0.114, 0.282);
  const darkNavy = rgb(0.06, 0.09, 0.16);
  const gold = rgb(0.85, 0.65, 0.13);
  const slateGray = rgb(0.39, 0.45, 0.55);

  // Draw double borders
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: crimson,
    borderWidth: 4,
    color: rgb(0.99, 0.99, 1.0)
  });

  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: gold,
    borderWidth: 1.5,
  });

  // Top Brand Header
  page.drawText('BLOOD.LOGANATHANM.IN', {
    x: width / 2 - 110,
    y: height - 70,
    size: 14,
    font: fontBold,
    color: crimson
  });

  page.drawText('Life Connect - Blood Donation & Emergency Network', {
    x: width / 2 - 150,
    y: height - 88,
    size: 10,
    font: font,
    color: slateGray
  });

  // Certificate Title
  const title = isMilestone ? 'MILESTONE LIFE SAVER AWARD' : 'CERTIFICATE OF APPRECIATION';
  const titleWidth = fontBold.widthOfTextAtSize(title, 26);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 135,
    size: 26,
    font: fontBold,
    color: darkNavy
  });

  // Ribbon / Subtitle
  const presentedText = 'THIS CERTIFICATE IS PROUDLY PRESENTED TO';
  const presWidth = font.widthOfTextAtSize(presentedText, 12);
  page.drawText(presentedText, {
    x: (width - presWidth) / 2,
    y: height - 170,
    size: 12,
    font: font,
    color: gold
  });

  // Sanitize name for standard font (fallback to safe ASCII if unicode symbols present)
  let safeName = donorName || 'Valued Donor';
  try {
    // test encoding
    fontBold.encodeText(safeName);
  } catch (e) {
    safeName = safeName.replace(/[^\x00-\x7F]/g, '').trim() || 'Valued Donor';
  }

  const nameWidth = fontBold.widthOfTextAtSize(safeName, 30);
  page.drawText(safeName, {
    x: (width - nameWidth) / 2,
    y: height - 225,
    size: 30,
    font: fontBold,
    color: crimson
  });

  // Underline for name
  page.drawLine({
    start: { x: width / 2 - 180, y: height - 235 },
    end: { x: width / 2 + 180, y: height - 235 },
    thickness: 1.5,
    color: gold
  });

  // Appreciation Paragraph
  const formattedDate = date ? new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : new Date().toLocaleDateString('en-IN');

  const desc1 = `In deep gratitude for your noble and selfless donation of ${bloodGroup || 'Blood'} (${units} unit) on ${formattedDate}.`;
  const desc2 = `Your generous gift of life empowers critical care and brings renewed hope to patients and their families.`;
  const desc3 = `Total Verified Donations: ${donationCount} | Every drop makes a difference.`;

  const d1Width = font.widthOfTextAtSize(desc1, 13);
  const d2Width = font.widthOfTextAtSize(desc2, 13);
  const d3Width = fontBold.widthOfTextAtSize(desc3, 12);

  page.drawText(desc1, {
    x: (width - d1Width) / 2,
    y: height - 280,
    size: 13,
    font: font,
    color: darkNavy
  });

  page.drawText(desc2, {
    x: (width - d2Width) / 2,
    y: height - 302,
    size: 13,
    font: font,
    color: slateGray
  });

  page.drawText(desc3, {
    x: (width - d3Width) / 2,
    y: height - 330,
    size: 12,
    font: fontBold,
    color: crimson
  });

  // QR Code Verification
  const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0].trim() : 'https://Blood.loganathanm.in';
  const verifyUrl = `${clientUrl}/verify-certificate/${certificateId}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 150 });
    const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const embeddedQr = await doc.embedPng(qrImageBytes);

    page.drawImage(embeddedQr, {
      x: 70,
      y: 65,
      width: 85,
      height: 85
    });

    page.drawText('Scan to Verify', {
      x: 75,
      y: 50,
      size: 9,
      font: fontBold,
      color: slateGray
    });
  } catch (err) {
    console.error('Failed to embed QR code in certificate:', err);
  }

  // Certificate ID & Issue Info
  page.drawText(`Certificate ID: ${certificateId}`, {
    x: 175,
    y: 95,
    size: 10,
    font: fontBold,
    color: darkNavy
  });

  page.drawText(`Issue Date: ${formattedDate}`, {
    x: 175,
    y: 80,
    size: 9,
    font: font,
    color: slateGray
  });

  page.drawText(`Verify at: ${clientUrl}/verify-certificate/${certificateId}`, {
    x: 175,
    y: 65,
    size: 8,
    font: font,
    color: slateGray
  });

  // Signature Section (Right Bottom)
  page.drawLine({
    start: { x: width - 260, y: 105 },
    end: { x: width - 70, y: 105 },
    thickness: 1,
    color: slateGray
  });

  page.drawText('Authorized Signatory', {
    x: width - 220,
    y: 88,
    size: 11,
    font: fontBold,
    color: darkNavy
  });

  page.drawText('Life Connect Blood Network', {
    x: width - 235,
    y: 73,
    size: 9,
    font: font,
    color: slateGray
  });

  page.drawText('Donate Blood. Save Lives.', {
    x: width - 225,
    y: 58,
    size: 9,
    font: fontItalic,
    color: crimson
  });

  return await doc.save();
}

module.exports = { generateDonationCertificate };

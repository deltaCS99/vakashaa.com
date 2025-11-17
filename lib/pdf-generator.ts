// lib/pdf-generator.ts
"use server";

import { supabase } from "./supabase";
import { randomUUID } from "crypto";

interface AgreementData {
    businessName: string;
    registrationNumber: string;
    physicalAddress: string;
    phone: string;
    email: string;
    fullName: string;
    capacity: string;
    isSoleProprietor: boolean;
    signedAt: Date;
    profileId: string;
}

const AGREEMENT_TEXT = `
SA TOURS MERCHANT SERVICE AGREEMENT

This Merchant Services Agreement is an agreement between you and SA Tours, a details your obligations and responsibilities in using our platform. By accepting this agreement electronically, you will be deemed to have acknowledged and agreed that you are bound by the terms of the Agreement and it shall be deemed to have been accepted by the Company.

[Full agreement text here...]
`.trim();

export async function generateSignedAgreementPDF(data: AgreementData) {
    try {
        // Create HTML for PDF
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 10px;
      margin: 20px 0;
      padding: 20px;
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .info-label {
      font-weight: bold;
    }
    .agreement-content {
      white-space: pre-wrap;
      text-align: justify;
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #ddd;
      background: #fafafa;
    }
    .signature-section {
      margin-top: 50px;
      padding: 20px;
      border: 2px solid #000;
      background: #f0f8ff;
    }
    .signature-line {
      border-top: 2px solid #000;
      margin-top: 50px;
      padding-top: 10px;
      text-align: center;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SA TOURS</h1>
    <h2>MERCHANT SERVICE AGREEMENT</h2>
  </div>

  <div class="section">
    <div class="section-title">AGREEMENT DETAILS</div>
    <div class="info-grid">
      <div class="info-label">Business Name:</div>
      <div>${data.businessName}</div>
      
      <div class="info-label">${data.isSoleProprietor ? "ID Number:" : "Registration:"}</div>
      <div>${data.registrationNumber}</div>
      
      <div class="info-label">Address:</div>
      <div>${data.physicalAddress}</div>
      
      <div class="info-label">Phone:</div>
      <div>${data.phone}</div>
      
      <div class="info-label">Email:</div>
      <div>${data.email}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">AGREEMENT TERMS</div>
    <div class="agreement-content">
${AGREEMENT_TEXT}
    </div>
  </div>

  <div class="signature-section">
    <div class="section-title">DIGITAL SIGNATURE</div>
    <div class="info-grid">
      <div class="info-label">Signed By:</div>
      <div>${data.fullName}</div>
      
      <div class="info-label">Capacity:</div>
      <div>${data.capacity}</div>
      
      <div class="info-label">Date & Time:</div>
      <div>${data.signedAt.toLocaleString('en-ZA', {
            dateStyle: 'full',
            timeStyle: 'long',
            timeZone: 'Africa/Johannesburg'
        })}</div>
      
      <div class="info-label">Agreement ID:</div>
      <div>${data.profileId.substring(0, 16).toUpperCase()}</div>
    </div>
    
    <div class="signature-line">
      <strong>Digitally signed and accepted electronically</strong><br>
      This document constitutes a legally binding agreement
    </div>
  </div>

  <div class="footer">
    <p>SA Tours Merchant Service Agreement | Generated ${new Date().toLocaleDateString('en-ZA')}</p>
    <p>This is a digitally signed document. No physical signature required.</p>
  </div>
</body>
</html>
    `;

        // For now, we'll use a simple approach - you can integrate a proper PDF library later
        // Using Puppeteer would be ideal, but for now let's use a placeholder
        // You'll need to install: npm install puppeteer

        // TODO: Implement actual PDF generation
        // For now, return a mock URL - replace this with actual PDF generation
        const mockPdfUrl = `https://storage.example.com/agreements/${data.profileId}.pdf`;

        return {
            success: true,
            url: mockPdfUrl,
        };
    } catch (error) {
        console.error("Error generating PDF:", error);
        return {
            success: false,
            error: "Failed to generate PDF",
        };
    }
}
import { NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import fs from "fs";
import path from "path";
import prisma from "@/lib/db";
import os from "os";
import QRCode from "qrcode";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const templateStyle = body.template || 'corporate';

    const interfaces = os.networkInterfaces();
    let allIps: string[] = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]!) {
        if (iface.family === "IPv4" && !iface.internal) {
          allIps.push(iface.address);
        }
      }
    }
    const networkIp = allIps.find(ip => ip.startsWith("192.168.")) || allIps.find(ip => !ip.startsWith("10.")) || allIps[0] || "localhost";
    const port = process.env.PORT || 4000;
    const origin = `http://${networkIp}:${port}`;
    
    let pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_16x9";
    pptx.author = "JSPL System";
    pptx.company = "Jindal Steel & Power";
    pptx.title = "Monthly Maintenance Workshop";

    // Template Config
    let bg = "F0F4F8";
    let textBody = "333333";
    let textHeading = "0A3D62";
    let accentPrimary = "7DB87F";
    let accentSecondary = "F4805A";
    let accentTertiary = "4A90E2";
    let cardBg = "FFFFFF";
    let cardLine = "CCCCCC";
    let logoOpts = { x: 8.5, y: 0.2, w: 1, h: 1 };
    let logoOpacity = 100;
    
    if (templateStyle === 'modern') {
      bg = "E0EAFC";
      textBody = "444444";
      textHeading = "2C3E50";
      accentPrimary = "F4805A";
      accentSecondary = "4A90E2";
      accentTertiary = "7DB87F";
      cardBg = "F9FAFB";
      logoOpts = { x: 0.5, y: 0.2, w: 1, h: 1 };
    } else if (templateStyle === 'dark') {
      bg = "1A202C";
      textBody = "E2E8F0";
      textHeading = "F7FAFC";
      accentPrimary = "E53E3E";
      accentSecondary = "F6AD55";
      accentTertiary = "63B3ED";
      cardBg = "2D3748";
      cardLine = "4A5568";
      logoOpacity = 80;
    } else if (templateStyle === 'vibrant') {
      bg = "FF9A9E"; textBody = "333333"; textHeading = "D63230"; accentPrimary = "F39237"; accentSecondary = "F9D423"; accentTertiary = "FF4E50"; cardBg = "FFFFFF";
    } else if (templateStyle === 'industrial') {
      bg = "2C3E50"; textBody = "ECF0F1"; textHeading = "F39C12"; accentPrimary = "E74C3C"; accentSecondary = "34495E"; accentTertiary = "95A5A6"; cardBg = "34495E"; cardLine = "2C3E50"; logoOpts = { x: 0.5, y: 0.2, w: 1, h: 1 }; logoOpacity = 80;
    } else if (templateStyle === 'nature') {
      bg = "E9F7EF"; textBody = "145A32"; textHeading = "1E8449"; accentPrimary = "27AE60"; accentSecondary = "2ECC71"; accentTertiary = "F1C40F"; cardBg = "D4EFDF";
    } else if (templateStyle === 'highContrast') {
      bg = "000000"; textBody = "FFFF00"; textHeading = "FFFFFF"; accentPrimary = "00FF00"; accentSecondary = "FF00FF"; accentTertiary = "00FFFF"; cardBg = "111111"; cardLine = "FFFFFF"; logoOpacity = 80;
    } else if (templateStyle === 'oceanic') {
      bg = "0F2027"; textBody = "E0F7FA"; textHeading = "80DEEA"; accentPrimary = "4DD0E1"; accentSecondary = "00BCD4"; accentTertiary = "0097A7"; cardBg = "203A43"; cardLine = "2C5364"; logoOpts = { x: 0.5, y: 0.2, w: 1, h: 1 }; logoOpacity = 80;
    } else if (templateStyle === 'sunset') {
      bg = "FF4E50"; textBody = "4A2311"; textHeading = "FFFFFF"; accentPrimary = "FFD700"; accentSecondary = "F9D423"; accentTertiary = "FF8C00"; cardBg = "F9D423"; cardLine = "FF4E50";
    } else if (templateStyle === 'elegant') {
      bg = "FDFBF7"; textBody = "4A4A4A"; textHeading = "B8860B"; accentPrimary = "DAA520"; accentSecondary = "FFD700"; accentTertiary = "EEE8AA"; cardBg = "FFF8DC"; logoOpts = { x: 0.5, y: 0.2, w: 1, h: 1 };
    }

    const isDarkMode = ['dark', 'industrial', 'highContrast', 'oceanic'].includes(templateStyle);

    let masterObjects: any[] = [];
    try {
      const bgPath = path.join(process.cwd(), "public", "background.jpg");
      if (fs.existsSync(bgPath)) {
        const bgBuffer = fs.readFileSync(bgPath);
        const bgBase64 = "data:image/jpeg;base64," + bgBuffer.toString('base64');
        
        masterObjects.push({ image: { data: bgBase64, x: 0, y: 0, w: "100%", h: "100%" } });
        masterObjects.push({ rect: { x: 0, y: 0, w: "100%", h: "100%", fill: { color: bg, transparency: isDarkMode ? 95 : 85 } } });
        
        // The logo as an image instead of text JSPL
        masterObjects.push({ image: { data: bgBase64, x: logoOpts.x, y: logoOpts.y, w: logoOpts.w, h: logoOpts.h, transparency: 100 - logoOpacity } });
      }
    } catch(e) {
      console.log("Bg error", e);
    }

    // Header bar logic
    if (templateStyle === 'corporate') {
      masterObjects.push({ rect: { x: 0, y: 0, w: "100%", h: 0.2, fill: { color: "0A3D62" } } });
    } else if (['modern', 'oceanic', 'elegant'].includes(templateStyle)) {
      masterObjects.push({ rect: { x: 0.5, y: 0.1, w: 9, h: 0.05, fill: { color: "FFFFFF", transparency: 40 } } });
    } else if (['dark', 'vibrant', 'industrial', 'nature', 'highContrast', 'sunset'].includes(templateStyle)) {
      masterObjects.push({ rect: { x: 0, y: 0, w: "100%", h: 0.1, fill: { color: accentPrimary } } });
    }

    // FETCH REAL DATA
    const dbSubmissions = await prisma.submission.findMany({
      where: { status: { in: ["Submitted", "Accepted"] } },
      include: { department: true, suggestions: true }
    });

    // Calculate total slides to link the QR code to the final slide
    const totalSlides = 4 + dbSubmissions.length; // 1 Cover + 1 Agenda + ... + 1 Feedback + 1 QR

    // Generate local Base64 QR code for bulletproof offline rendering
    const qrDataUrl = await QRCode.toDataURL(`${origin}/feedback`, { width: 300, margin: 1 });

    const addSmallQr = (slide: any) => {
      // Add the image
      slide.addImage({
        data: qrDataUrl,
        x: 9.2, y: 4.8, w: 0.6, h: 0.6
      });
      // Add invisible clickable shape over it for 100% viewer compatibility
      slide.addShape(pptx.ShapeType.rect, {
        x: 9.2, y: 4.8, w: 0.6, h: 0.6,
        fill: { transparency: 100 },
        hyperlink: { slide: totalSlides.toString() }
      });
    };

    pptx.defineSlideMaster({
      title: "PREMIUM_MASTER",
      background: { fill: bg },
      objects: masterObjects,
      slideNumber: { x: 0.5, y: 5.3, color: textBody, fontSize: 8 }
    });

    let coverSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
    if (templateStyle === 'corporate') {
      coverSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.5, h: 5.625, fill: { color: "2C3E50" } });
      coverSlide.addShape(pptx.ShapeType.chord, { x: 0, y: 0.5, w: 0.5, h: 0.5, fill: { color: accentSecondary } });
      coverSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 1.0, w: 0.5, h: 0.5, fill: { color: accentPrimary } });
      coverSlide.addShape(pptx.ShapeType.rtTriangle, { x: 0, y: 1.5, w: 0.5, h: 0.5, fill: { color: accentTertiary } });
      coverSlide.addShape(pptx.ShapeType.chord, { x: 0, y: 2.0, w: 0.5, h: 0.5, fill: { color: accentSecondary } });
    }

    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    coverSlide.addText(formattedDate.toUpperCase(), { x: 1.0, y: 1.5, w: 7, h: 0.3, fontSize: 12, color: textBody, bold: true });
    coverSlide.addText("MONTHLY MAINTENANCE WORKSHOP", { x: 1.0, y: 1.8, w: 8, h: 0.8, fontSize: 32, color: textHeading, bold: true });
    coverSlide.addText("Best Practice Sharing & Repetitive Problem Resolution", { x: 1.0, y: 2.5, w: 8, h: 0.4, fontSize: 18, color: textBody });
    addSmallQr(coverSlide);

    let agendaSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
    agendaSlide.addShape(pptx.ShapeType.rect, { x: templateStyle === 'modern' ? 1.5 : 0.4, y: 0.4, w: 0.05, h: 0.4, fill: { color: accentPrimary } });
    agendaSlide.addText("Workshop agenda", { x: templateStyle === 'modern' ? 1.6 : 0.5, y: 0.4, w: 5, h: 0.4, fontSize: 24, color: textHeading, bold: true });
    
    agendaSlide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 1.2, w: 9, h: 3.5, fill: { color: cardBg, transparency: isDarkMode ? 10 : 30 }, line: { color: accentPrimary, width: 2 }, rectRadius: 0.1 });
    
    const blockStyle = { w: 1.8, h: 2.5, fill: { color: isDarkMode ? "1A202C" : "FFFFFF" }, rectRadius: 0.1, line: { color: cardLine, width: 1 } };
    
    agendaSlide.addShape(pptx.ShapeType.roundRect, { x: 1.0, y: 1.7, ...blockStyle });
    agendaSlide.addText("★", { x: 1.0, y: 2.2, w: 1.8, h: 0.4, fontSize: 32, color: accentPrimary, align: "center" });
    agendaSlide.addText("BEST PRACTICES\nSHARING", { x: 1.0, y: 2.8, w: 1.8, h: 0.6, fontSize: 10, color: textHeading, bold: true, align: "center" });

    agendaSlide.addShape(pptx.ShapeType.roundRect, { x: 3.1, y: 1.7, ...blockStyle });
    agendaSlide.addText("▲", { x: 3.1, y: 2.2, w: 1.8, h: 0.4, fontSize: 32, color: accentSecondary, align: "center" });
    agendaSlide.addText("REPETITIVE / CHRONIC\nPROBLEM\nDISCUSSION", { x: 3.1, y: 2.8, w: 1.8, h: 0.6, fontSize: 10, color: textHeading, bold: true, align: "center" });

    agendaSlide.addShape(pptx.ShapeType.roundRect, { x: 5.2, y: 1.7, ...blockStyle });
    agendaSlide.addText("📈", { x: 5.2, y: 2.2, w: 1.8, h: 0.4, fontSize: 32, color: accentTertiary, align: "center" });
    agendaSlide.addText("ACTION REVIEW &\nKPI TRENDS", { x: 5.2, y: 2.8, w: 1.8, h: 0.6, fontSize: 10, color: textHeading, bold: true, align: "center" });

    agendaSlide.addShape(pptx.ShapeType.roundRect, { x: 7.3, y: 1.7, ...blockStyle });
    agendaSlide.addText("🏢", { x: 7.3, y: 2.2, w: 1.8, h: 0.4, fontSize: 32, color: accentPrimary, align: "center" });
    agendaSlide.addText("HORIZONTAL\nDEPLOYMENT", { x: 7.3, y: 2.8, w: 1.8, h: 0.6, fontSize: 10, color: textHeading, bold: true, align: "center" });
    addSmallQr(agendaSlide);

    dbSubmissions.forEach(sub => {
      let slide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
      
      const headerX = templateStyle === 'modern' ? 1.5 : 0.4;
      
      slide.addText([
        { text: "Department: ", options: { color: textBody, bold: true } },
        { text: sub.department.name, options: { color: accentPrimary, bold: true } }
      ], { x: headerX, y: 0.2, w: 5, h: 0.3, fontSize: 14 });
      
      if (sub.type === "BestPractice") {
        slide.addShape(pptx.ShapeType.rect, { x: headerX, y: 0.6, w: 0.05, h: 0.3, fill: { color: accentPrimary } });
        slide.addText([
          { text: "BEST PRACTICE: ", options: { color: textHeading, bold: true } },
          { text: sub.title, options: { color: textBody, bold: false } }
        ], { x: headerX + 0.1, y: 0.6, w: 8, h: 0.3, fontSize: 18 });
        
        const innerCardStyle = { w: 4.5, fill: { color: cardBg }, line: { color: accentPrimary, width: 0.5 } };
        const labelStyle = { w: 4.3, h: 0.2, fontSize: 9, bold: true, color: accentPrimary };
        const textStyle = { w: 4.3, fontSize: 10, color: textBody };

        slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.1, h: 0.8, ...innerCardStyle });
        slide.addText("OBJECTIVE / PURPOSE", { x: 0.5, y: 1.15, ...labelStyle });
        slide.addText(sub.objective || "N/A", { x: 0.5, y: 1.4, h: 0.4, ...textStyle });

        slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 2.0, h: 0.9, ...innerCardStyle });
        slide.addText("PROBLEM ADDRESSED", { x: 0.5, y: 2.05, ...labelStyle });
        slide.addText(sub.problemAddressed || "N/A", { x: 0.5, y: 2.3, h: 0.5, ...textStyle });

        slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 3.0, h: 0.9, ...innerCardStyle });
        slide.addText("METHODOLOGY / INNOVATION", { x: 0.5, y: 3.05, ...labelStyle });
        slide.addText(sub.methodology || "N/A", { x: 0.5, y: 3.3, h: 0.5, ...textStyle });

        slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 4.0, h: 0.8, ...innerCardStyle });
        slide.addText("IMPACT / SAVING", { x: 0.5, y: 4.05, ...labelStyle });
        slide.addText(`Cost Impact: Approx Rs. ${sub.impactSavings || 0} Lakhs.`, { x: 0.5, y: 4.3, h: 0.4, ...textStyle });

        if (sub.calculationTable) {
          slide.addText("CALCULATION TABLE", { x: 5.1, y: 1.1, w: 4.5, h: 0.2, fontSize: 9, color: textHeading, bold: true });
          try {
            const parsedTable = JSON.parse(sub.calculationTable);
            let tableData: any[] = [
              [{ text: "Metric", options: { bold: true, color: "FFFFFF", fill: "6366F1" } }, 
               { text: "Before", options: { bold: true, color: "FFFFFF", fill: "6366F1" } }, 
               { text: "After", options: { bold: true, color: "FFFFFF", fill: "6366F1" } }, 
               { text: "Gain", options: { bold: true, color: "FFFFFF", fill: "6366F1" } }]
            ];
            parsedTable.forEach((row: any) => tableData.push([{text: row.metric, options: {color: textBody}}, {text: row.before, options: {color: textBody}}, {text: row.after, options: {color: textBody}}, {text: row.gain, options: {color: textBody}}]));
            
            slide.addTable(tableData, { 
              x: 5.1, y: 1.3, w: 4.5, 
              border: { type: 'solid', color: isDarkMode ? cardLine : 'FFFFFF', pt: 1 },
              fill: { color: cardBg }, 
              fontSize: 9, 
              colW: [1.8, 0.9, 0.9, 0.9]
            });
          } catch(e) {}
        }

        slide.addText("PHOTOS & EVIDENCE", { x: 5.1, y: 2.8, w: 4.5, h: 0.2, fontSize: 8, color: accentPrimary, bold: true });
        
        slide.addShape(pptx.ShapeType.rect, { x: 5.1, y: 3.0, w: 1.4, h: 1.8, fill: { color: "111111" }, line: { color: accentSecondary, width: 1.5 } });
        if (sub.beforeImageUrl) {
           const beforeImgPath = path.join(process.cwd(), "public", sub.beforeImageUrl);
           if (fs.existsSync(beforeImgPath)) {
               slide.addImage({ path: beforeImgPath, x: 5.1, y: 3.0, w: 1.4, h: 1.8 });
           }
        }
        slide.addShape(pptx.ShapeType.rect, { x: 5.1, y: 3.0, w: 0.6, h: 0.15, fill: { color: "CCCCCC" } });
        slide.addText("BEFORE", { x: 5.1, y: 3.0, w: 0.6, h: 0.15, fontSize: 7, color: "111111", bold: true, align: "center" });

        slide.addShape(pptx.ShapeType.rect, { x: 6.7, y: 3.0, w: 1.4, h: 1.8, fill: { color: "111111" }, line: { color: accentSecondary, width: 1.5 } });
        if (sub.afterImageUrl) {
           const afterImgPath = path.join(process.cwd(), "public", sub.afterImageUrl);
           if (fs.existsSync(afterImgPath)) {
               slide.addImage({ path: afterImgPath, x: 6.7, y: 3.0, w: 1.4, h: 1.8 });
           }
        }
        slide.addShape(pptx.ShapeType.rect, { x: 6.7, y: 3.0, w: 0.6, h: 0.15, fill: { color: accentPrimary } });
        slide.addText("AFTER", { x: 6.7, y: 3.0, w: 0.6, h: 0.15, fontSize: 7, color: "111111", bold: true, align: "center" });

        slide.addShape(pptx.ShapeType.rect, { x: 8.3, y: 3.0, w: 1.4, h: 1.8, fill: { color: "111111" }, line: { color: accentSecondary, width: 1.5 } });
        if (sub.attachmentUrl) {
           const attachImgPath = path.join(process.cwd(), "public", sub.attachmentUrl);
           if (fs.existsSync(attachImgPath)) {
               slide.addImage({ path: attachImgPath, x: 8.3, y: 3.0, w: 1.4, h: 1.8 });
           }
        }
        slide.addShape(pptx.ShapeType.rect, { x: 8.3, y: 3.0, w: 0.8, h: 0.15, fill: { color: "666666" } });
        slide.addText("SUPPORTING", { x: 8.3, y: 3.0, w: 0.8, h: 0.15, fontSize: 7, color: "FFFFFF", bold: true, align: "center" });
        
      } else {
        slide.addShape(pptx.ShapeType.rect, { x: headerX, y: 0.6, w: 0.05, h: 0.3, fill: { color: accentPrimary } });
        slide.addText([
          { text: "Repetitive : ", options: { color: textHeading, bold: true } },
          { text: sub.title, options: { color: textBody, bold: false } }
        ], { x: headerX + 0.1, y: 0.6, w: 9, h: 0.3, fontSize: 18 });
        
        const innerCardStyle = { w: 4.2, fill: { color: cardBg }, line: { color: accentPrimary, width: 0.5 } };
        const labelStyle = { w: 4.0, h: 0.2, fontSize: 9, bold: true, color: accentPrimary };
        const textStyle = { w: 4.0, fontSize: 10, color: textBody };

        slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.1, h: 0.8, ...innerCardStyle });
        slide.addText("PROBLEM STATEMENT", { x: 0.5, y: 1.15, ...labelStyle });
        slide.addText(sub.problemStatement || "N/A", { x: 0.5, y: 1.4, h: 0.4, ...textStyle });

        slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 2.0, h: 2.7, ...innerCardStyle });
        slide.addText("WHY-WHY ANALYSIS", { x: 0.5, y: 2.05, ...labelStyle });
        if (sub.whyWhyAnalysis) {
          try {
            const whys = JSON.parse(sub.whyWhyAnalysis);
            let yPos = 2.3;
            whys.forEach((why: string, i: number) => {
              if (why) {
                slide.addText(`Why ${i+1}: ${why}`, { x: 0.5, y: yPos, w: 4.0, h: 0.2, fontSize: 9, color: textBody, bold: false });
                yPos += 0.3;
              }
            });
          } catch(e) {}
        }

        if (sub.actionTakenTable) {
          slide.addText("ACTION TAKEN TABLE", { x: 4.8, y: 1.1, w: 4.8, h: 0.2, fontSize: 9, bold: true, color: accentPrimary });
          try {
              const parsedActions = JSON.parse(sub.actionTakenTable);
              let actionTable: any[] = [
                [{ text: "Action Taken / Planned", options: { bold: true, color: "FFFFFF", fill: { color: accentTertiary } } },
                 { text: "Status", options: { bold: true, color: "FFFFFF", fill: { color: accentTertiary } } }]
              ];
              parsedActions.forEach((sugg: any) => actionTable.push([{text: sugg.action, options: {color: textBody}}, {text: sugg.status, options: {color: textBody}}]));
              
              slide.addTable(actionTable, { 
                x: 4.8, y: 1.3, w: 4.8, 
                border: { type: 'solid', color: cardLine, pt: 0.5 },
                fill: { color: cardBg }, 
                fontSize: 8, 
                colW: [3.8, 1.0]
              });
          } catch (e) {}
        }

        slide.addShape(pptx.ShapeType.rect, { x: 4.8, y: 2.4, h: 0.8, w: 4.8, fill: { color: "111111" }, line: { color: accentPrimary, width: 1 } });
        slide.addText("IMPACT CALCULATION", { x: 4.9, y: 2.45, w: 4.6, h: 0.2, fontSize: 9, bold: true, color: accentPrimary });
        
        if (sub.impactCalculation) {
          try {
            const parsedImpact = JSON.parse(sub.impactCalculation);
            let tableData: any[] = [
              [{ text: "Parameter", options: { bold: true, color: "111111", fill: accentPrimary } }, 
               { text: "Value", options: { bold: true, color: "111111", fill: accentPrimary } }, 
               { text: "Calculation", options: { bold: true, color: "111111", fill: accentPrimary } }]
            ];
            parsedImpact.forEach((row: any) => tableData.push([
              { text: row.parameter, options: { color: "FFFFFF" } },
              { text: row.value, options: { color: "E53E3E", bold: true } },
              { text: row.calculation || row.calculate, options: { color: "FFFFFF" } }
            ]));
            
            slide.addTable(tableData, { 
              x: 4.9, y: 2.7, w: 4.6, 
              border: { type: 'solid', color: accentPrimary, pt: 0.5 },
              fill: { color: "111111" }, 
              fontSize: 8, 
              colW: [1.5, 1.5, 1.6]
            });
          } catch(e) {}
        }

        if (sub.attachmentUrl) {
          slide.addShape(pptx.ShapeType.rect, { x: 4.8, y: 3.4, w: 4.8, h: 1.3, fill: { color: "111111" }, line: { color: accentSecondary, width: 1.5 } });
          const attachImgPath = path.join(process.cwd(), "public", sub.attachmentUrl);
          if (fs.existsSync(attachImgPath)) {
              slide.addImage({ path: attachImgPath, x: 4.8, y: 3.4, w: 4.8, h: 1.3 });
          }
          slide.addShape(pptx.ShapeType.rect, { x: 4.8, y: 3.4, w: 1.5, h: 0.15, fill: { color: "666666" } });
          slide.addText("SUPPORTING EVIDENCE", { x: 4.8, y: 3.4, w: 1.5, h: 0.15, fontSize: 7, color: "FFFFFF", bold: true, align: "center" });
        }
      }
      addSmallQr(slide);
    });

    // FEEDBACK GALLERY SLIDE
    const suggestions = await prisma.suggestion.findMany({ where: { status: "Accepted" } });
    if (suggestions.length > 0) {
      const fbSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
      if (templateStyle === 'corporate') {
        fbSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.5, h: 5.625, fill: { color: "2C3E50" } });
      }
      const headerX = templateStyle === 'modern' ? 1.5 : 0.4;
      fbSlide.addShape(pptx.ShapeType.rect, { x: headerX, y: 0.6, w: 0.05, h: 0.4, fill: { color: accentPrimary } });
      fbSlide.addText("OUTSTANDING SUGGESTIONS", { x: headerX + 0.1, y: 0.6, w: 8, h: 0.4, fontSize: 24, bold: true, color: textHeading });
      
      let startY = 1.5;
      suggestions.slice(0, 4).forEach((s) => {
        fbSlide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: startY, w: 9, h: 0.8, fill: { color: cardBg }, line: { color: accentPrimary, width: 2 }, rectRadius: 0.1 });
        fbSlide.addText(`"${s.suggestionText}"`, { x: 0.6, y: startY + 0.1, w: 8.8, h: 0.4, fontSize: 14, italic: true, color: textBody });
        fbSlide.addText(`— ${s.guestName || "Anonymous"} (${s.guestDept || "General"} Dept)`, { x: 0.6, y: startY + 0.45, w: 8.8, h: 0.2, fontSize: 10, bold: true, color: textHeading });
        startY += 1.0;
      });
      addSmallQr(fbSlide);
    }

    // ----------------------------------------------------
    // SLIDE N: Feedback QR
    // ----------------------------------------------------
    let qrSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
    qrSlide.addText("We Want Your Feedback!", { x: 1, y: 1.5, w: 8, h: 1.0, fontSize: 44, color: textHeading, bold: true, align: "center" });
    qrSlide.addText("Scan the QR Code to submit your suggestions live.", { x: 1, y: 2.5, w: 8, h: 0.5, fontSize: 20, color: textBody, align: "center" });
    
    qrSlide.addImage({
      data: qrDataUrl,
      x: 3.8, y: 3.0, w: 2.4, h: 2.4
    });

    const base64String = await pptx.write({ outputType: "base64" });
    return NextResponse.json({ base64: base64String });

  } catch (error) {
    console.error("PPT Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate PPT" }, { status: 500 });
  }
}

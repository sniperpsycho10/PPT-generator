// No NextResponse import
import PptxGenJS from "pptxgenjs";
import fs from "fs";
import path from "path";
import prisma from "@/lib/db";
import os from "os";
import QRCode from "qrcode";
import sharp from "sharp";
import { logger } from "@/lib/logger";

async function updateProgress(reportId: string | null, progress: number, status: string = "Generating") {
  if (!reportId) return;
  try {
    await prisma.generatedReport.update({
      where: { id: reportId },
      data: { progress, status }
    });
  } catch (e) {
    console.error("Failed to update report progress:", e);
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logger.warn(`Operation failed, retrying (${i + 1}/${retries})...`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
  throw lastError;
}

async function processImage(imagePath: string): Promise<string | null> {
  return withRetry(async () => {
    try {
      let fullPath = path.join(process.cwd(), "public", imagePath);
      if (!fs.existsSync(fullPath)) {
        // Handle /api/files/<hash>
        const hash = path.basename(imagePath);
        const attachment = await prisma.attachment.findFirst({
          where: { OR: [{ hash }, { url: imagePath }] }
        });
        if (attachment && attachment.filePath && fs.existsSync(attachment.filePath)) {
          fullPath = attachment.filePath;
        } else {
          // Fallback check in data/uploads
          const uploadDir = path.join(process.cwd(), "data", "uploads");
          if (fs.existsSync(uploadDir)) {
             const files = fs.readdirSync(uploadDir);
             const matched = files.find(f => f.startsWith(hash));
             if (matched) fullPath = path.join(uploadDir, matched);
          }
        }
      }
      
      if (!fs.existsSync(fullPath)) return null;

      const buffer = await sharp(fullPath)
        .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();

      return "data:image/jpeg;base64," + buffer.toString('base64');
    } catch (error) {
      logger.error(`Failed to process image ${imagePath}:`, error);
      return null;
    }
  }, 2, 500).catch(() => null);
}

export async function generateWorkshopPpt(body: any, reportId: string | null = null) {
  try {
    await updateProgress(reportId, 5);

    const templateStyle = body.template || 'corporate';
    const customColors = body.customColors || {};

    let origin = body.origin || "";
    if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("172.")) {
      const interfaces = os.networkInterfaces();
      let allIps: string[] = [];
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
          if (iface.family === "IPv4" && !iface.internal && !iface.address.startsWith("172.") && !iface.address.startsWith("169.254.")) {
            allIps.push(iface.address);
          }
        }
      }
      const networkIp = allIps.find(ip => ip.startsWith("192.168.")) || allIps.find(ip => ip.startsWith("10.")) || allIps[0] || "localhost";
      const port = process.env.PORT || 4000;
      origin = `http://${networkIp}:${port}`;

      try {
        const tunnelPath = path.join(process.cwd(), '.tunnel-url');
        if (fs.existsSync(tunnelPath)) {
          const tunnelUrl = fs.readFileSync(tunnelPath, 'utf8').trim();
          if (tunnelUrl) {
            origin = tunnelUrl;
          }
        }
      } catch (err) {
        // ignore
      }
    }
    
    let pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_16x9";
    pptx.theme = { headFontFace: "Poppins", bodyFontFace: "Poppins" };
    pptx.author = "JSPL System";
    pptx.company = "Jindal Steel & Power";
    pptx.title = "Monthly Maintenance Workshop";

    // Template Config
    let bg = customColors.bg || "F0F4F8";
    let textBody = customColors.textBody || "333333";
    let textHeading = customColors.textHeading || "0A3D62";
    let accentPrimary = customColors.accentPrimary || "7DB87F";
    let accentSecondary = customColors.accentSecondary || "F4805A";
    let accentTertiary = customColors.accentTertiary || "4A90E2";
    let cardBg = "FFFFFF";
    let cardLine = "CCCCCC";
    let logoOpts = { x: 8.5, y: 0.2, w: 1, h: 1 };
    let logoOpacity = 100;
    
    if (!body.customColors) {
      if (templateStyle === 'modern') {
        bg = "E0EAFC"; textBody = "444444"; textHeading = "2C3E50"; accentPrimary = "F4805A"; accentSecondary = "4A90E2"; accentTertiary = "7DB87F"; cardBg = "F9FAFB"; logoOpts = { x: 0.5, y: 0.2, w: 1, h: 1 };
      } else if (templateStyle === 'dark') {
        bg = "1A202C"; textBody = "E2E8F0"; textHeading = "F7FAFC"; accentPrimary = "E53E3E"; accentSecondary = "F6AD55"; accentTertiary = "63B3ED"; cardBg = "2D3748"; cardLine = "4A5568"; logoOpacity = 80;
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
      } else if (templateStyle === 'neon') {
        bg = "0F0F1A"; textBody = "E0E0FF"; textHeading = "00FFAA"; accentPrimary = "FF00AA"; accentSecondary = "00FFAA"; accentTertiary = "9D00FF"; cardBg = "1A1A2E"; cardLine = "FF00AA"; logoOpacity = 80;
      } else if (templateStyle === 'minimalWhite') {
        bg = "FFFFFF"; textBody = "222222"; textHeading = "111111"; accentPrimary = "555555"; accentSecondary = "333333"; accentTertiary = "AAAAAA"; cardBg = "F9F9F9"; cardLine = "EEEEEE"; logoOpts = { x: 0.5, y: 0.2, w: 1, h: 1 };
      } else if (templateStyle === 'royalPurple') {
        bg = "1A0B2E"; textBody = "E6D8F8"; textHeading = "D4B5FF"; accentPrimary = "9B51E0"; accentSecondary = "BB6BD9"; accentTertiary = "8A2BE2"; cardBg = "2D1B4E"; cardLine = "9B51E0"; logoOpacity = 90;
      } else if (templateStyle === 'pastel') {
        bg = "FDF6E3"; textBody = "5C4B51"; textHeading = "8CBEB2"; accentPrimary = "F3B562"; accentSecondary = "F2EBBF"; accentTertiary = "F06060"; cardBg = "FFFFFF"; cardLine = "F2EBBF";
      } else if (templateStyle === 'forest') {
        bg = "1C3127"; textBody = "D1E8E2"; textHeading = "A3E4D7"; accentPrimary = "58D68D"; accentSecondary = "2ECC71"; accentTertiary = "1ABC9C"; cardBg = "274436"; cardLine = "58D68D"; logoOpts = { x: 0.5, y: 0.2, w: 1, h: 1 }; logoOpacity = 85;
      }
    }

    const isDarkMode = ['dark', 'industrial', 'highContrast', 'oceanic', 'neon', 'royalPurple', 'forest'].includes(templateStyle) || customColors.isDarkMode;

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
    if (templateStyle === 'corporate' && !body.customColors) {
      masterObjects.push({ rect: { x: 0, y: 0, w: "100%", h: 0.2, fill: { color: "0A3D62" } } });
    } else if (['modern', 'oceanic', 'elegant'].includes(templateStyle) && !body.customColors) {
      masterObjects.push({ rect: { x: 0.5, y: 0.1, w: 9, h: 0.05, fill: { color: "FFFFFF", transparency: 40 } } });
    } else {
      masterObjects.push({ rect: { x: 0, y: 0, w: "100%", h: 0.1, fill: { color: accentPrimary } } });
    }

    await updateProgress(reportId, 10);

    // FETCH REAL DATA
    const activeCycle = await prisma.cycle.findFirst({
      where: { isActive: true }
    });
    const bpRemarks = activeCycle?.bpRemarks || "-";
    const rpRemarks = activeCycle?.rpRemarks || "-";

    let dbSubmissions = body.submissions;
    let bps: any[] = [];
    let rps: any[] = [];
    let ss: any[] = [];
    let allSubmissions = body.allSubmissions || [];

    if (!dbSubmissions) {
      allSubmissions = await prisma.submission.findMany({
        where: { status: { in: ["Submitted", "Accepted"] } },
        include: { 
          department: true, 
          suggestions: { include: { assignedTeam: true } },
          adoptions: { include: { user: { include: { department: true } } } }
        }
      });
      dbSubmissions = allSubmissions.filter((s: any) => s.status === "Accepted");
      bps = dbSubmissions.filter((s: any) => s.type === "BestPractice");
      rps = dbSubmissions.filter((s: any) => s.type === "RepetitiveProblem");
      ss = dbSubmissions.filter((s: any) => s.type === "SupportingSlide");
      
      const ordered: any[] = [];
      const getSupporting = (t: string) => ss.find((s: any) => s.title === `Supporting Doc: ${t}`);
      
      bps.forEach((bp: any) => {
        ordered.push(bp);
        const child = getSupporting(bp.title);
        if (child) ordered.push(child);
      });
      
      rps.forEach((rp: any) => {
        ordered.push(rp);
        const child = getSupporting(rp.title);
        if (child) ordered.push(child);
      });
      
      const usedIds = new Set(ordered.map(s => s.id));
      dbSubmissions.forEach((s: any) => {
        if (!usedIds.has(s.id)) ordered.push(s);
      });
      dbSubmissions = ordered;
    } else {
      bps = dbSubmissions.filter((s: any) => s.type === "BestPractice");
      rps = dbSubmissions.filter((s: any) => s.type === "RepetitiveProblem");
    }

    await updateProgress(reportId, 20);
    
    const qrDataUrl = await QRCode.toDataURL(`${origin}/feedback`, { width: 300, margin: 1 });

    pptx.defineSlideMaster({
      title: "PREMIUM_MASTER",
      background: { fill: bg },
      objects: [
        ...masterObjects
      ],
      slideNumber: { x: 0.5, y: 5.3, color: textBody, fontSize: 8 }
    });

    let coverSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
    if (templateStyle === 'corporate' && !body.customColors) {
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

    const totalSubmissions = dbSubmissions.length;
    let processedSubmissions = 0;

    for (const sub of dbSubmissions) {
      processedSubmissions++;
      await updateProgress(reportId, 20 + Math.floor((processedSubmissions / totalSubmissions) * 60));

      let slide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
      
      const headerX = templateStyle === 'modern' ? 1.5 : 0.4;
      
      slide.addText([
        { text: "Department: ", options: { color: textBody, bold: true } },
        { text: sub.department?.name || 'Unknown', options: { color: accentPrimary, bold: true } }
      ], { x: headerX, y: 0.2, w: 5, h: 0.3, fontSize: 14 });
      
      if (sub.type === "BestPractice") {
        slide.addShape(pptx.ShapeType.rect, { x: headerX, y: 0.6, w: 0.05, h: 0.3, fill: { color: accentPrimary } });
        slide.addText([
          { text: "BEST PRACTICE: ", options: { color: textHeading, bold: true } },
          { text: sub.title, options: { color: textBody, bold: false } }
        ], { x: headerX + 0.1, y: 0.6, w: 8, h: 0.3, fontSize: 18 });
        
        const innerCardStyle = { w: 4.5, fill: { color: cardBg }, line: { color: accentPrimary, width: 0.5 } };
        const labelStyle = { w: 4.3, h: 0.2, fontSize: 9, bold: true, color: accentPrimary };
        const textStyle: any = { w: 4.3, fontSize: 10, color: textBody, valign: 'top', wrap: true };

        slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.1, h: 0.8, ...innerCardStyle });
        slide.addText("OBJECTIVE / PURPOSE", { x: 0.5, y: 1.15, ...labelStyle });
        slide.addText(sub.objective || "Missing data", { x: 0.5, y: 1.4, h: 0.4, ...textStyle });

        slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 2.0, h: 0.9, ...innerCardStyle });
        slide.addText("PROBLEM ADDRESSED", { x: 0.5, y: 2.05, ...labelStyle });
        slide.addText(sub.problemAddressed || "Missing data", { x: 0.5, y: 2.3, h: 0.5, ...textStyle });

        slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 3.0, h: 0.9, ...innerCardStyle });
        slide.addText("METHODOLOGY / INNOVATION", { x: 0.5, y: 3.05, ...labelStyle });
        slide.addText(sub.methodology || "Missing data", { x: 0.5, y: 3.3, h: 0.5, ...textStyle });

        slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 4.0, h: 0.8, ...innerCardStyle });
        slide.addText("IMPACT / SAVING", { x: 0.5, y: 4.05, ...labelStyle });
        slide.addText(`Cost Impact: Approx Rs. ${sub.impactSavings || 0} Lakhs.`, { x: 0.5, y: 4.3, h: 0.4, ...textStyle });

        if (sub.calculationTable) {
          try {
            const parsedTable = typeof sub.calculationTable === 'string' ? JSON.parse(sub.calculationTable) : sub.calculationTable;
            if (Array.isArray(parsedTable) && parsedTable.length > 0) {
              let isLegacy = !Array.isArray(parsedTable[0]);
              
              if (isLegacy) {
                 slide.addText("CALCULATION TABLE", { x: 5.1, y: 1.1, w: 4.5, h: 0.2, fontSize: 9, color: textHeading, bold: true });
                 let tableData: any[] = [
                   [{ text: "Metric", options: { bold: true, color: "FFFFFF", fill: "6366F1" } }, 
                    { text: "Before", options: { bold: true, color: "FFFFFF", fill: "6366F1" } }, 
                    { text: "After", options: { bold: true, color: "FFFFFF", fill: "6366F1" } }, 
                    { text: "Gain", options: { bold: true, color: "FFFFFF", fill: "6366F1" } }]
                 ];
                 parsedTable.forEach((row: any) => tableData.push([
                   {text: String(row.metric || ""), options: {color: textBody}}, 
                   {text: String(row.before || ""), options: {color: textBody}}, 
                   {text: String(row.after || ""), options: {color: textBody}}, 
                   {text: String(row.gain || ""), options: {color: textBody}}
                 ]));
                 slide.addTable(tableData, { 
                   x: 5.1, y: 1.3, w: 4.5, 
                   border: { type: 'solid', color: isDarkMode ? cardLine : 'FFFFFF', pt: 1 },
                   fill: { color: cardBg }, 
                   fontSize: 9, 
                   colW: [1.8, 0.9, 0.9, 0.9],
                   autoPage: true, autoPageRepeatHeader: true, autoPageSlideStartY: 1.3
                 });
              } else {
                 let targetX = 5.1;
                 let targetY = 1.3;
                 let targetW = 4.5;
                 let numCols = parsedTable[0].length;
                 let targetSlide = slide;
                 
                 let tableData: any[] = [];
                 parsedTable.forEach((row: any[], rIdx: number) => {
                     const isHeader = rIdx === 0;
                     const paddedRow = Array.isArray(row) ? [...row] : [];
                     while(paddedRow.length < numCols) paddedRow.push("");
                     
                     tableData.push(paddedRow.map((cell: string) => ({
                       text: String(cell || ""),
                       options: {
                         color: isHeader ? "FFFFFF" : textBody,
                         fill: isHeader ? "6366F1" : cardBg,
                         bold: isHeader
                       }
                     })));
                 });

                 if (tableData.length > 5) {
                     targetSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
                     targetSlide.addText([
                       { text: `CALCULATION TABLE: `, options: { color: textHeading, bold: true } },
                       { text: sub.title, options: { color: textBody, bold: false } }
                     ], { x: 0.5, y: 0.4, w: 9, h: 0.3, fontSize: 18 });
                     targetX = 0.5;
                     targetY = 1.0;
                     targetW = 9.0;
                 } else {
                     slide.addText("CALCULATION TABLE", { x: targetX, y: 1.1, w: targetW, h: 0.2, fontSize: 9, color: textHeading, bold: true });
                 }


                 let fontSize = numCols > 8 ? 6 : (numCols > 6 ? 7 : (numCols > 4 ? 8 : 10));

                 targetSlide.addTable(tableData, { 
                   x: targetX, y: targetY, w: targetW, 
                   border: { type: 'solid', color: isDarkMode ? cardLine : 'FFFFFF', pt: 1 },
                   fill: { color: cardBg }, 
                   fontSize: fontSize, 
                   colW: Array(numCols).fill(targetW / numCols),
                   autoPage: true,
                   autoPageRepeatHeader: true,
                   autoPageSlideStartY: targetY
                 });
              }
            }
          } catch(e) {}
        }

        let imgSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
        imgSlide.addText([
           { text: `PHOTOS & EVIDENCE: `, options: { color: textHeading, bold: true } },
           { text: sub.title, options: { color: textBody, bold: false } }
        ], { x: 0.5, y: 0.4, w: 9, h: 0.3, fontSize: 18 });
        
        imgSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 2.6, h: 3.5, fill: { color: "111111" }, line: { color: accentSecondary, width: 1.5 } });
        if (sub.beforeImageUrl) {
           const processed = await processImage(sub.beforeImageUrl);
           if (processed) imgSlide.addImage({ data: processed, x: 0.5, y: 1.0, w: 2.6, h: 3.5 });
        } else {
           imgSlide.addText("MISSING BEFORE", { x: 0.5, y: 1.0, w: 2.6, h: 3.5, fontSize: 12, color: "FFFFFF", align: "center" });
        }
        imgSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 1.0, h: 0.25, fill: { color: "CCCCCC" } });
        imgSlide.addText("BEFORE", { x: 0.5, y: 1.0, w: 1.0, h: 0.25, fontSize: 9, color: "111111", bold: true, align: "center" });

        imgSlide.addShape(pptx.ShapeType.rect, { x: 3.6, y: 1.0, w: 2.6, h: 3.5, fill: { color: "111111" }, line: { color: accentSecondary, width: 1.5 } });
        if (sub.afterImageUrl) {
           const processed = await processImage(sub.afterImageUrl);
           if (processed) imgSlide.addImage({ data: processed, x: 3.6, y: 1.0, w: 2.6, h: 3.5 });
        } else {
           imgSlide.addText("MISSING AFTER", { x: 3.6, y: 1.0, w: 2.6, h: 3.5, fontSize: 12, color: "FFFFFF", align: "center" });
        }
        imgSlide.addShape(pptx.ShapeType.rect, { x: 3.6, y: 1.0, w: 1.0, h: 0.25, fill: { color: accentPrimary } });
        imgSlide.addText("AFTER", { x: 3.6, y: 1.0, w: 1.0, h: 0.25, fontSize: 9, color: "111111", bold: true, align: "center" });

        imgSlide.addShape(pptx.ShapeType.rect, { x: 6.7, y: 1.0, w: 2.6, h: 3.5, fill: { color: "111111" }, line: { color: accentSecondary, width: 1.5 } });
        if (sub.attachmentUrl) {
           const processed = await processImage(sub.attachmentUrl);
           if (processed) imgSlide.addImage({ data: processed, x: 6.7, y: 1.0, w: 2.6, h: 3.5 });
        } else {
           imgSlide.addText("NO FILE", { x: 6.7, y: 1.0, w: 2.6, h: 3.5, fontSize: 12, color: "FFFFFF", align: "center" });
        }
        imgSlide.addShape(pptx.ShapeType.rect, { x: 6.7, y: 1.0, w: 1.2, h: 0.25, fill: { color: "666666" } });
        imgSlide.addText("SUPPORTING", { x: 6.7, y: 1.0, w: 1.2, h: 0.25, fontSize: 9, color: "FFFFFF", bold: true, align: "center" });
        
      } else if (sub.type === "RepetitiveProblem") {
        slide.addShape(pptx.ShapeType.rect, { x: headerX, y: 0.6, w: 0.05, h: 0.3, fill: { color: accentPrimary } });
        slide.addText([
          { text: "Repetitive : ", options: { color: textHeading, bold: true } },
          { text: sub.title, options: { color: textBody, bold: false } }
        ], { x: headerX + 0.1, y: 0.6, w: 9, h: 0.3, fontSize: 18 });
        
        const leftX = 0.4;
        const leftW = 4.2;
        
        slide.addShape(pptx.ShapeType.rect, { x: leftX, y: 1.1, h: 0.8, w: leftW, fill: { color: cardBg }, line: { color: accentPrimary, width: 0.5 } });
        slide.addText("PROBLEM STATEMENT", { x: leftX + 0.1, y: 1.15, w: leftW - 0.2, h: 0.2, fontSize: 9, bold: true, color: accentPrimary });
        slide.addText(sub.problemStatement || "Missing data", { x: leftX + 0.1, y: 1.4, w: leftW - 0.2, h: 0.4, fontSize: 10, color: textBody, valign: 'top', wrap: true });

        let whyCount = 0;
        let whys: string[] = [];
        try { whys = typeof sub.whyWhyAnalysis === 'string' ? JSON.parse(sub.whyWhyAnalysis) : (sub.whyWhyAnalysis || []); whyCount = whys.filter((w: string) => w).length; } catch(e) {}
        const whyBoxH = Math.max(0.8, 0.3 + whyCount * 0.3);
        
        slide.addShape(pptx.ShapeType.rect, { x: leftX, y: 2.0, h: whyBoxH, w: leftW, fill: { color: cardBg }, line: { color: accentPrimary, width: 0.5 } });
        slide.addText("WHY-WHY ANALYSIS", { x: leftX + 0.1, y: 2.05, w: leftW - 0.2, h: 0.2, fontSize: 9, bold: true, color: accentPrimary });
        let yPos = 2.3;
        whys.forEach((why: string, i: number) => {
          if (why) {
            slide.addText(`Why ${i+1}: ${why}`, { x: leftX + 0.1, y: yPos, w: leftW - 0.2, h: 0.2, fontSize: 9, color: textBody, bold: false });
            yPos += 0.3;
          }
        });

        const rightX = 4.8;
        const rightW = 4.8;

        const addDynamicTable = (parsed: any[], tableTitle: string, headerFill: string, headerColor: string, bodyColor: string, inlineY: number) => {
          if (!parsed || parsed.length === 0) return;
          const isLegacy = !Array.isArray(parsed[0]);
          let allRows: any[][] = [];
          let colCount = 3;

          if (isLegacy) {
            const headers = tableTitle.includes("ACTION") 
              ? ["Action Taken / Planned", "Target", "Status"]
              : ["Parameter", "Value", "Calculation"];
            allRows.push(headers.map(h => ({ text: h, options: { bold: true, color: headerColor, fill: { color: headerFill } } })));
            parsed.forEach((row: any) => {
              if (tableTitle.includes("ACTION")) {
                allRows.push([
                  { text: String(row.action || ""), options: { color: bodyColor } },
                  { text: String(row.target || ""), options: { color: bodyColor } },
                  { text: String(row.status || ""), options: { color: bodyColor } }
                ]);
              } else {
                allRows.push([
                  { text: String(row.parameter || ""), options: { color: bodyColor } },
                  { text: String(row.value || ""), options: { color: "E53E3E", bold: true } },
                  { text: String(row.calculation || row.calculate || ""), options: { color: bodyColor } }
                ]);
              }
            });
          } else {
            colCount = parsed[0].length || 1;
            allRows.push(parsed[0].map((h: string) => ({ text: String(h || ""), options: { bold: true, color: headerColor, fill: { color: headerFill } } })));
            parsed.slice(1).forEach((row: string[]) => {
              allRows.push(row.map((c: string) => ({ text: String(c || ""), options: { color: bodyColor } })));
            });
          }

          if (allRows.length > 5) {
            const targetSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
            targetSlide.addText([
              { text: `${tableTitle}: `, options: { color: textHeading, bold: true } },
              { text: sub.title, options: { color: textBody, bold: false } }
            ], { x: 0.5, y: 0.4, w: 9, h: 0.3, fontSize: 18 });
            
            targetSlide.addTable(allRows, {
              x: 0.5, y: 1.0, w: 9.0,
              border: { type: 'solid', color: cardLine, pt: 0.5 },
              fill: { color: cardBg },
              fontSize: colCount > 10 ? 6 : (colCount > 7 ? 7 : 8),
              colW: Array(colCount).fill(9.0 / colCount),
              autoPage: true, autoPageRepeatHeader: true, autoPageSlideStartY: 1.0
            });
          } else {
            slide.addText(tableTitle, { x: rightX, y: inlineY, w: rightW, h: 0.2, fontSize: 9, bold: true, color: accentPrimary });
            slide.addTable(allRows, {
              x: rightX, y: inlineY + 0.2, w: rightW,
              border: { type: 'solid', color: cardLine, pt: 0.5 },
              fill: { color: cardBg },
              fontSize: colCount > 4 ? 7 : 8,
              colW: Array(colCount).fill(rightW / colCount),
              autoPage: true, autoPageRepeatHeader: true, autoPageSlideStartY: 1.0
            });
          }
        };

        if (sub.actionTakenTable) {
          try {
            const parsedActions = typeof sub.actionTakenTable === 'string' ? JSON.parse(sub.actionTakenTable) : sub.actionTakenTable;
            addDynamicTable(parsedActions, "ACTION TAKEN TABLE", accentTertiary, "FFFFFF", textBody, 1.1);
          } catch(e) {}
        }

        if (sub.impactCalculation) {
          try {
            const parsedImpact = typeof sub.impactCalculation === 'string' ? JSON.parse(sub.impactCalculation) : sub.impactCalculation;
            addDynamicTable(parsedImpact, "IMPACT CALCULATION", accentPrimary, "111111", "FFFFFF", 2.5);
          } catch(e) {}
        }

        if (sub.attachmentUrl) {
          slide.addShape(pptx.ShapeType.rect, { x: 4.8, y: 3.8, w: 4.8, h: 1.0, fill: { color: "111111" }, line: { color: accentSecondary, width: 1.5 } });
          const processed = await processImage(sub.attachmentUrl);
          if (processed) slide.addImage({ data: processed, x: 4.8, y: 3.8, w: 4.8, h: 1.0 });
          slide.addShape(pptx.ShapeType.rect, { x: 4.8, y: 3.8, w: 1.5, h: 0.15, fill: { color: "666666" } });
          slide.addText("SUPPORTING EVIDENCE", { x: 4.8, y: 3.8, w: 1.5, h: 0.15, fontSize: 7, color: "FFFFFF", bold: true, align: "center" });
        }
      } else {
        slide.addShape(pptx.ShapeType.rect, { x: headerX, y: 0.6, w: 0.05, h: 0.3, fill: { color: accentPrimary } });
        slide.addText([
          { text: "SUPPORTING : ", options: { color: textHeading, bold: true } },
          { text: sub.title, options: { color: textBody, bold: false } }
        ], { x: headerX + 0.1, y: 0.6, w: 9, h: 0.3, fontSize: 18 });
        
        if (sub.customTable) {
          slide.addText("CUSTOM TABLE", { x: 0.4, y: 1.1, w: 9, h: 0.2, fontSize: 9, color: textHeading, bold: true });
          try {
            const parsedTable = typeof sub.customTable === 'string' ? JSON.parse(sub.customTable) : sub.customTable;
            if (Array.isArray(parsedTable) && parsedTable.length > 0) {
              const numCols = Math.max(...parsedTable.map((r: any[]) => r?.length || 0));
              const colW = Array(numCols).fill(9.2 / numCols);
              let tableData: any[] = [];
              
              parsedTable.forEach((row: any[], rIdx: number) => {
                const isHeader = rIdx === 0;
                const paddedRow = Array.isArray(row) ? [...row] : [];
                while(paddedRow.length < numCols) paddedRow.push("");
                
                tableData.push(paddedRow.map((cell: string) => ({
                  text: String(cell || ""),
                  options: {
                    color: isHeader ? "FFFFFF" : textBody,
                    fill: isHeader ? accentPrimary : cardBg,
                    bold: isHeader
                  }
                })));
              });
              
              slide.addTable(tableData, { 
                x: 0.4, y: 1.3, w: 9.2, 
                border: { type: 'solid', color: isDarkMode ? cardLine : 'FFFFFF', pt: 1 },
                fill: { color: cardBg }, 
                fontSize: numCols > 10 ? 5 : (numCols > 7 ? 6 : (numCols > 5 ? 7 : 9)), 
                colW: colW,
                autoPage: true, autoPageRepeatHeader: true, autoPageSlideStartY: 1.3
              });
            }
          } catch(e) {}
        }

        if (sub.supportingImages && sub.supportingImages.length > 0) {
          slide.addText("SUPPORTING PICTURES", { x: 0.4, y: 3.5, w: 9, h: 0.2, fontSize: 9, color: accentPrimary, bold: true });
          let imgX = 0.4;
          for (const img of sub.supportingImages) {
             const processed = await processImage(img);
             if (processed) {
                 slide.addImage({ data: processed, x: imgX, y: 3.7, w: 2.8, h: 1.6, sizing: { type: 'contain', w: 2.8, h: 1.6 } });
             }
             imgX += 3.0;
          }
        }
      }

      if (sub.type !== "SupportingSlide") {
        const acceptedSuggestions = (sub.suggestions || []).filter((s: any) => s.status === 'Accepted');
        if (acceptedSuggestions.length > 0) {
          const sugSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
          if (templateStyle === 'corporate' && !body.customColors) {
            sugSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.5, h: 5.625, fill: { color: "2C3E50" } });
          }
          const headerX = templateStyle === 'modern' ? 1.5 : 0.4;
          sugSlide.addShape(pptx.ShapeType.rect, { x: headerX, y: 0.6, w: 0.05, h: 0.4, fill: { color: accentPrimary } });
          sugSlide.addText(`SUGGESTIONS FOR: ${sub.title.toUpperCase()}`, { x: headerX + 0.1, y: 0.6, w: 8, h: 0.4, fontSize: 18, bold: true, color: textHeading });
          
          let startY = 1.5;
          acceptedSuggestions.slice(0, 4).forEach((s: any) => {
            sugSlide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: startY, w: 9, h: 0.8, fill: { color: cardBg }, line: { color: accentPrimary, width: 2 }, rectRadius: 0.1 });
            sugSlide.addText(`"${s.suggestionText}"`, { x: 0.6, y: startY + 0.1, w: 8.8, h: 0.4, fontSize: 14, italic: true, color: textBody, valign: 'top', wrap: true } as any);
            sugSlide.addText(`— ${s.guestName || "Anonymous"} (${s.guestDept || "General"} Dept)`, { x: 0.6, y: startY + 0.45, w: 8.8, h: 0.2, fontSize: 10, bold: true, color: textHeading });
            startY += 1.0;
          });
        }
      }
    }

    await updateProgress(reportId, 85);

    // TRACKER SLIDE
    const totalBP = allSubmissions.filter((s: any) => s.type === "BestPractice").length;
    const accBP = bps.length;
    const totalRP = allSubmissions.filter((s: any) => s.type === "RepetitiveProblem").length;
    const accRP = rps.length;

    let trkSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
    trkSlide.addText("Tracker", { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 32, bold: true, color: textHeading, align: 'center' });
    trkSlide.addText("Monthly Maintenance Workshop", { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 20, color: textHeading, align: 'center' });

    let trackerRows: any[][] = [
      [
        { text: "Category", options: { bold: true, color: "FFFFFF", fill: accentTertiary } },
        { text: "Total Nos. of Entries", options: { bold: true, color: "FFFFFF", fill: accentTertiary } },
        { text: "Nos. of entries for Action", options: { bold: true, color: "FFFFFF", fill: accentTertiary } },
        { text: "Remarks", options: { bold: true, color: "FFFFFF", fill: accentTertiary } }
      ],
      [
        { text: "Best Practice", options: { fill: cardBg, color: textBody } },
        { text: totalBP < 10 ? `0${totalBP}` : `${totalBP}`, options: { fill: cardBg, color: textBody, align: 'center' } },
        { text: accBP < 10 ? `0${accBP}` : `${accBP}`, options: { fill: cardBg, color: textBody, align: 'center' } },
        { text: bpRemarks, options: { fill: cardBg, color: textBody, align: 'center' } }
      ],
      [
        { text: "Repetitive Problem", options: { fill: cardBg, color: textBody } },
        { text: totalRP < 10 ? `0${totalRP}` : `${totalRP}`, options: { fill: cardBg, color: textBody, align: 'center' } },
        { text: accRP < 10 ? `0${accRP}` : `${accRP}`, options: { fill: cardBg, color: textBody, align: 'center' } },
        { text: rpRemarks, options: { fill: cardBg, color: textBody, align: 'center' } }
      ]
    ];
    trkSlide.addTable(trackerRows as any, { x: 0.5, y: 2.2, w: 9, colW: [2, 2, 2, 3], border: { pt: 1, color: "CCCCCC" }, rowH: 0.4, valign: 'middle', fontSize: 12 });

    await updateProgress(reportId, 90);

    // HORIZONTAL DEPLOYMENT TRACKER SLIDE
    let hdSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
    hdSlide.addText([
      { text: "Best Practice: ", options: { bold: true, color: accentTertiary } },
      { text: "Monthly Maintenance Workshop", options: { bold: false, color: textHeading } }
    ], { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 24 });
    hdSlide.addText("Horizontal Deployment Tracker:", { x: 0.5, y: 0.8, w: 9, h: 0.4, fontSize: 20, bold: true, color: textHeading });

    let hdRows: any[][] = [
      [
        { text: "Department", options: { bold: true, color: "FFFFFF", fill: "1A365D" } },
        { text: "Best Practice Title", options: { bold: true, color: "FFFFFF", fill: "1A365D" } },
        { text: "Area/ Department to be Implemented", options: { bold: true, color: "FFFFFF", fill: "1A365D", align: "center" } },
        { text: "Deadline", options: { bold: true, color: "FFFFFF", fill: "1A365D", align: "center" } },
        { text: "Remarks", options: { bold: true, color: "FFFFFF", fill: "1A365D" } }
      ]
    ];

    bps.forEach((bp: any) => {
      const adoptions = bp.adoptions || [];
      const hasAdoptions = adoptions.length > 0;
      const rowFill = hasAdoptions ? "C6F6D5" : cardBg;
      
      hdRows.push([
        { text: bp.department?.name || "-", options: { fill: rowFill, color: "000000" } },
        { text: bp.title, options: { fill: rowFill, color: "000000" } },
        { text: hasAdoptions ? adoptions.map((a:any) => a.user?.department?.name || 'Unknown').join(', ') : "-", options: { fill: rowFill, color: "000000", bold: hasAdoptions, align: 'center' } },
        { text: hasAdoptions ? "30.12.2026" : "-", options: { fill: rowFill, color: "000000", bold: hasAdoptions, align: 'center' } },
        { text: "-", options: { fill: rowFill, color: "000000", align: 'center' } }
      ]);
    });
    
    if (hdRows.length === 1) {
      hdRows.push([{ text: "No Best Practices recorded yet.", options: { colspan: 5, fill: cardBg, color: textBody, align: 'center' } } as any]);
    }
    
    hdSlide.addTable(hdRows as any, { x: 0.2, y: 1.4, w: 9.6, colW: [1.2, 2.8, 2, 1, 2.6], border: { pt: 1, color: "CCCCCC" }, rowH: 0.4, valign: 'middle', fontSize: 10, autoPage: true });

    // SUGGESTION TRACKER SLIDE
    let stSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
    stSlide.addText([
      { text: "Repetitive Problem: ", options: { bold: true, color: "E53E3E" } },
      { text: "Monthly Maintenance Workshop", options: { bold: false, color: textHeading } }
    ], { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 24 });
    stSlide.addText("Suggestion Tracker:", { x: 0.5, y: 0.8, w: 9, h: 0.4, fontSize: 20, bold: true, color: textHeading });

    let stRows: any[][] = [
      [
        { text: "Dept.", options: { bold: true, color: "FFFFFF", fill: "1A365D" } },
        { text: "Equipment Details", options: { bold: true, color: "FFFFFF", fill: "1A365D" } },
        { text: "Problem Statement", options: { bold: true, color: "FFFFFF", fill: "1A365D" } },
        { text: "Discussion/ Initial Suggestion during workshop", options: { bold: true, color: "FFFFFF", fill: "1A365D" } },
        { text: "Suggester Name", options: { bold: true, color: "FFFFFF", fill: "1A365D" } },
        { text: "Team name for Analyse the problem", options: { bold: true, color: "FFFFFF", fill: "1A365D" } },
        { text: "Analysis Target Date", options: { bold: true, color: "FFFFFF", fill: "1A365D" } },
        { text: "Remarks", options: { bold: true, color: "FFFFFF", fill: "1A365D" } }
      ]
    ];

    rps.forEach((rp: any) => {
      const suggestions = rp.suggestions || [];
      const hasSug = suggestions.length > 0;
      const sugText = hasSug ? suggestions.map((s:any) => s.suggestionText).join('\n') : "After visiting the site.";
      const sugName = hasSug ? suggestions.map((s:any) => s.guestName || s.suggestedBy?.name || "-").join(', ') : "-";
      const sugTeam = suggestions.map((s:any) => s.assignedTeam?.name).filter(Boolean).join(', ') || "-";
      const sugRemarks = suggestions.map((s:any) => s.trackingRemarks).filter(Boolean).join(', ') || "-";
      
      stRows.push([
        { text: rp.department?.name || "-", options: { fill: cardBg, color: textBody } },
        { text: rp.equipment || "-", options: { fill: cardBg, color: textBody } },
        { text: rp.problemStatement || "-", options: { fill: cardBg, color: textBody } },
        { text: sugText, options: { fill: cardBg, color: "38A169", bold: true } },
        { text: sugName, options: { fill: hasSug ? "FAF089" : cardBg, color: "000000" } },
        { text: sugTeam, options: { fill: cardBg, color: textBody } },
        { text: "10.06.2026", options: { fill: cardBg, color: textBody } },
        { text: sugRemarks, options: { fill: cardBg, color: textBody } }
      ]);
    });
    
    if (stRows.length === 1) {
      stRows.push([{ text: "No Repetitive Problems recorded yet.", options: { colspan: 8, fill: cardBg, color: textBody, align: 'center' } } as any]);
    }
    
    stSlide.addTable(stRows as any, { x: 0.1, y: 1.4, w: 9.8, colW: [0.8, 1.2, 1.4, 2, 1, 1.2, 1, 1.2], border: { pt: 1, color: "CCCCCC" }, rowH: 0.4, valign: 'middle', fontSize: 8, autoPage: true });

    // FEEDBACK GALLERY SLIDE
    const suggestions = await prisma.suggestion.findMany({ where: { status: "Accepted", submissionId: null } });
    if (suggestions.length > 0) {
      const fbSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
      if (templateStyle === 'corporate' && !body.customColors) {
        fbSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.5, h: 5.625, fill: { color: "2C3E50" } });
      }
      const headerX = templateStyle === 'modern' ? 1.5 : 0.4;
      fbSlide.addShape(pptx.ShapeType.rect, { x: headerX, y: 0.6, w: 0.05, h: 0.4, fill: { color: accentPrimary } });
      fbSlide.addText("OUTSTANDING SUGGESTIONS", { x: headerX + 0.1, y: 0.6, w: 8, h: 0.4, fontSize: 24, bold: true, color: textHeading });
      
      let startY = 1.5;
      suggestions.slice(0, 4).forEach((s: any) => {
        fbSlide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: startY, w: 9, h: 0.8, fill: { color: cardBg }, line: { color: accentPrimary, width: 2 }, rectRadius: 0.1 });
        fbSlide.addText(`"${s.suggestionText}"`, { x: 0.6, y: startY + 0.1, w: 8.8, h: 0.4, fontSize: 14, italic: true, color: textBody });
        fbSlide.addText(`— ${s.guestName || "Anonymous"} (${s.guestDept || "General"} Dept)`, { x: 0.6, y: startY + 0.45, w: 8.8, h: 0.2, fontSize: 10, bold: true, color: textHeading });
        startY += 1.0;
      });
    }

    let qrSlide = pptx.addSlide({ masterName: "PREMIUM_MASTER" });
    qrSlide.addText("We Want Your Feedback!", { x: 1, y: 1.5, w: 8, h: 1.0, fontSize: 44, color: textHeading, bold: true, align: "center" });
    qrSlide.addText("Scan the QR Code to submit your suggestions live.", { x: 1, y: 2.5, w: 8, h: 0.5, fontSize: 20, color: textBody, align: "center" });
    
    qrSlide.addImage({
      data: qrDataUrl,
      x: 3.8, y: 3.0, w: 2.4, h: 2.4
    });

    // Add small QR code to all slides linking to the last slide
    const totalSlides = (pptx as any)._slides.length;
    (pptx as any)._slides.forEach((slideObj: any, index: number) => {
      if (index < totalSlides - 1) { // Don't add to the last QR slide itself
        slideObj.addImage({ data: qrDataUrl, x: 9.3, y: 5.0, w: 0.5, h: 0.5, hyperlink: { slide: totalSlides, tooltip: "Go to Feedback Slide" } });
        slideObj.addText("Click or Scan QR", { x: 9.1, y: 4.8, w: 0.9, h: 0.2, fontSize: 6, color: textHeading, align: "center" });
      }
    });

    await updateProgress(reportId, 95);

    // Save File
    const fileName = `Workshop_Report_${Date.now()}.pptx`;
    const reportsDir = path.join(process.cwd(), "public", "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const filePath = path.join(reportsDir, fileName);
    
    await pptx.writeFile({ fileName: filePath });
    const fileUrl = `/reports/${fileName}`;

    if (reportId) {
      await prisma.generatedReport.update({
        where: { id: reportId },
        data: { fileUrl, progress: 100, status: "Completed" }
      });
    }

    return { fileUrl };
  } catch (error) {
    if (reportId) {
      await updateProgress(reportId, 0, "Failed");
    }
    logger.error("Failed to generate PPT", error);
    throw new Error("Failed to generate PPT");
  }
}

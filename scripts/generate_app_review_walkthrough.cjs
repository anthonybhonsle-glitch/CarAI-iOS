const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { spawn } = require('child_process');

async function run() {
  console.log('Rendering CarAI Official App Review Walkthrough Video (720x1560, 20fps)...');

  const width = 720;
  const height = 1560;
  const fps = 20;
  const durationSec = 38; // 38 seconds covers every single Apple requirement cleanly
  const totalFrames = fps * durationSec;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  let appIcon = null;
  try {
    appIcon = await loadImage(path.join(__dirname, '../public/app-icon-1024.png'));
  } catch (err) {
    console.warn('App icon fallback.');
  }

  const outputPath = path.join(__dirname, '../public/CarAI_AppReview_Walkthrough.mp4');

  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-c:v', 'png',
    '-r', String(fps),
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '21',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputPath
  ]);

  ffmpeg.stderr.on('data', (d) => {
    // optional debug
  });

  ffmpeg.on('error', (err) => {
    console.error('FFmpeg process error:', err);
  });

  function roundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawIPhoneBezel(ctx) {
    // Dynamic Island
    ctx.fillStyle = '#000000';
    roundRect(ctx, width / 2 - 95, 18, 190, 44, 22);
    ctx.fill();

    // Camera lens reflection
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(width / 2 + 65, 40, 7, 0, Math.PI * 2);
    ctx.fill();

    // Time (9:41)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "SF Pro", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('9:41', 44, 46);

    // Status icons (Cellular 5G, Battery)
    ctx.textAlign = 'right';
    ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "SF Pro", sans-serif';
    ctx.fillText('5G  100%', width - 44, 46);

    // Home indicator bar at bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    roundRect(ctx, width / 2 - 110, height - 18, 220, 5, 2.5);
    ctx.fill();
  }

  function drawHeader(ctx) {
    ctx.fillStyle = '#0B131E';
    ctx.fillRect(0, 70, width, 84);

    // App Icon
    if (appIcon) {
      ctx.save();
      roundRect(ctx, 28, 80, 62, 62, 16);
      ctx.clip();
      ctx.drawImage(appIcon, 28, 80, 62, 62);
      ctx.restore();
    } else {
      ctx.fillStyle = '#0284c7';
      roundRect(ctx, 28, 80, 62, 62, 16);
      ctx.fill();
    }

    // App Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Car AI', 104, 114);

    ctx.fillStyle = '#38BDF8';
    ctx.font = '600 15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Mechanic & OBD2', 104, 136);

    // Pro Button
    const proBtnX = width - 185;
    ctx.fillStyle = 'rgba(2, 132, 199, 0.2)';
    roundRect(ctx, proBtnX, 90, 96, 42, 10);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑 PRO', proBtnX + 48, 117);

    // Profile Button
    const profX = width - 72;
    ctx.fillStyle = '#1E293B';
    roundRect(ctx, profX, 90, 44, 44, 22);
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('👤', profX + 22, 118);

    // Divider
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 154, width, 1);
  }

  function drawTouchPointer(ctx, x, y, isTapping, tapProgress = 0) {
    ctx.save();
    if (isTapping && tapProgress > 0) {
      ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 0.8 - tapProgress)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 16 + tapProgress * 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = isTapping ? 'rgba(56, 189, 248, 0.9)' : 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(x, y, isTapping ? 18 : 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  for (let f = 0; f < totalFrames; f++) {
    const sec = f / fps;

    // Background
    ctx.fillStyle = '#060B13';
    ctx.fillRect(0, 0, width, height);

    drawHeader(ctx);

    const isDemoConnected = sec >= 5.5;
    let rpm = 0;
    let speed = 0;
    let boost = 0;
    let coolant = 24;

    if (isDemoConnected) {
      const liveTime = sec - 5.5;
      const cycle = (Math.sin(liveTime * 1.6) + 1) / 2;
      rpm = Math.floor(920 + cycle * 3180);
      speed = Math.floor(cycle * 66);
      boost = (cycle * 15.6).toFixed(1);
      coolant = 92;
    }

    // SECTION 1: CONNECTION BAR
    const connY = 168;
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, 24, connY, width - 48, 82, 18);
    ctx.fill();
    ctx.strokeStyle = isDemoConnected ? '#10B981' : '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isDemoConnected ? '#10B981' : '#EF4444';
    ctx.beginPath();
    ctx.arc(50, connY + 41, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(isDemoConnected ? 'Demo Vehicle Simulator' : 'OBD-II Hardware Detached', 70, connY + 36);

    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = isDemoConnected ? '#34D399' : '#94A3B8';
    ctx.fillText(
      isDemoConnected ? '● CAN-Bus Active • Live Telemetry' : 'Connect ELM327 Bluetooth or run Demo Car',
      70,
      connY + 58
    );

    // "Demo Car" toggle button
    const demoBtnX = width - 180;
    const isDemoBtnTarget = sec >= 4.0 && sec <= 5.5;
    ctx.fillStyle = isDemoConnected ? '#065F46' : isDemoBtnTarget ? '#0284C7' : '#1E293B';
    roundRect(ctx, demoBtnX, connY + 18, 140, 46, 12);
    ctx.fill();
    ctx.strokeStyle = isDemoConnected ? '#10B981' : '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(isDemoConnected ? '✓ CONNECTED' : '⚡ Demo Car', demoBtnX + 70, connY + 46);

    // SECTION 2: LIVE TELEMETRY GAUGES
    const gaugeSectionY = 266;
    const halfCardW = (width - 64) / 2;

    // RPM Card
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, 24, gaugeSectionY, halfCardW, 230, 20);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const rpmCenterX = 24 + halfCardW / 2;
    const rpmCenterY = gaugeSectionY + 105;
    const rpmRadius = 66;

    ctx.beginPath();
    ctx.arc(rpmCenterX, rpmCenterY, rpmRadius, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 11;
    ctx.stroke();

    const rpmFraction = Math.min(1, rpm / 6000);
    const rpmEndAngle = Math.PI * 0.75 + rpmFraction * (Math.PI * 1.5);
    ctx.beginPath();
    ctx.arc(rpmCenterX, rpmCenterY, rpmRadius, Math.PI * 0.75, rpmEndAngle);
    ctx.strokeStyle = rpm > 3800 ? '#EF4444' : '#38BDF8';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(String(rpm), rpmCenterX, rpmCenterY + 10);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('ENGINE RPM', rpmCenterX, gaugeSectionY + 200);

    // Speedometer Card
    const speedX = 24 + halfCardW + 16;
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, speedX, gaugeSectionY, halfCardW, 230, 20);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const speedCenterX = speedX + halfCardW / 2;
    const speedCenterY = gaugeSectionY + 105;
    const speedRadius = 66;

    ctx.beginPath();
    ctx.arc(speedCenterX, speedCenterY, speedRadius, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 11;
    ctx.stroke();

    const speedFraction = Math.min(1, speed / 120);
    const speedEndAngle = Math.PI * 0.75 + speedFraction * (Math.PI * 1.5);
    ctx.beginPath();
    ctx.arc(speedCenterX, speedCenterY, speedRadius, Math.PI * 0.75, speedEndAngle);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(String(speed), speedCenterX, speedCenterY + 12);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('SPEED (MPH)', speedCenterX, gaugeSectionY + 200);

    // SECTION 3: SENSOR METRICS ROW
    const metricsY = 512;
    const metricW = (width - 48 - 24) / 3;

    // Coolant
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, 24, metricsY, metricW, 90, 16);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('COOLANT', 24 + metricW / 2, metricsY + 28);
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`${coolant}°C`, 24 + metricW / 2, metricsY + 65);

    // Boost
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, 24 + metricW + 12, metricsY, metricW, 90, 16);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.stroke();
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('TURBO BOOST', 24 + metricW + 12 + metricW / 2, metricsY + 28);
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`${boost} PSI`, 24 + metricW + 12 + metricW / 2, metricsY + 65);

    // Battery
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, 24 + (metricW + 12) * 2, metricsY, metricW, 90, 16);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.stroke();
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('BATTERY', 24 + (metricW + 12) * 2 + metricW / 2, metricsY + 28);
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(isDemoConnected ? '14.2 V' : '12.4 V', 24 + (metricW + 12) * 2 + metricW / 2, metricsY + 65);

    // SECTION 4: DIAGNOSTICS & FAULT CODES (DTC)
    const diagY = 618;
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, 24, diagY, width - 48, 380, 20);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('ECU Diagnostic Scanner', 46, diagY + 38);

    ctx.font = '13.5px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Standard SAE J1979 / OBD-II Trouble Code Interrogation', 46, diagY + 64);

    const isScanning = sec >= 14.5 && sec < 18.0;
    const isScanComplete = sec >= 18.0;

    if (!isScanComplete) {
      const scanBtnY = diagY + 95;
      ctx.fillStyle = isScanning ? '#0369A1' : '#0284C7';
      roundRect(ctx, 46, scanBtnY, width - 92, 60, 16);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
      if (isScanning) {
        const scanProgress = Math.min(100, Math.floor(((sec - 14.5) / 3.5) * 100));
        ctx.fillText(`Scanning Powertrain ECU... ${scanProgress}%`, width / 2, scanBtnY + 37);
      } else {
        ctx.fillText('🔍 Run Full Diagnostic Scan', width / 2, scanBtnY + 37);
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748B';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Ready to scan Powertrain, ABS, and Emission readiness.', 46, diagY + 195);
    } else {
      const codeCardY = diagY + 86;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      roundRect(ctx, 44, codeCardY, width - 88, 195, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.stroke();

      ctx.fillStyle = '#EF4444';
      roundRect(ctx, 62, codeCardY + 16, 92, 32, 8);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('P0300', 108, codeCardY + 38);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#F87171';
      ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Random / Multiple Cylinder Misfire', 166, codeCardY + 38);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Severity: Moderate (Non-Immediate Damage)', 62, codeCardY + 74);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '13.5px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('AI Mechanic: Cylinder 3 ionization irregularity detected.', 62, codeCardY + 102);
      ctx.fillText('Inspect spark plug electrode gap and ignition coil resistance.', 62, codeCardY + 124);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '600 12.5px monospace';
      ctx.fillText('FREEZE FRAME: RPM 2,410 | LOAD 48% | COOLANT 92°C | STFT +4.2%', 62, codeCardY + 158);

      // Clear DTC Button
      const clearBtnY = diagY + 298;
      ctx.fillStyle = '#1E293B';
      roundRect(ctx, 44, clearBtnY, width - 88, 52, 14);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '600 15px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Clear Trouble Code (MIL Reset)', width / 2, clearBtnY + 32);
    }

    // SECTION 5: MODALS (Account Deletion & Paywall)
    const isProfileOpen = sec >= 23.5 && sec < 31.0;
    const isPaywallOpen = sec >= 31.0;

    if (isProfileOpen) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.fillRect(0, 0, width, height);

      const modalW = width - 48;
      const modalH = 750;
      const modalX = 24;
      const modalY = 220;

      ctx.fillStyle = '#111827';
      roundRect(ctx, modalX, modalY, modalW, modalH, 24);
      ctx.fill();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Driver Profile Vault', modalX + 30, modalY + 52);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Cloud-Synced Driver Identity & Registered Vehicles', modalX + 30, modalY + 80);

      // User Card
      const userCardY = modalY + 104;
      ctx.fillStyle = '#1F2937';
      roundRect(ctx, modalX + 24, userCardY, modalW - 48, 144, 18);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Alex Vance', modalX + 44, userCardY + 40);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '14px monospace';
      ctx.fillText('📱 +1 (555) 839-2041  •  driver@carai.io', modalX + 44, userCardY + 68);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Primary Garage: Toyota GR Supra 3.0', modalX + 44, userCardY + 98);

      ctx.fillStyle = '#10B981';
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('✓ Driver Verified • Cloud Vault Synced', modalX + 44, userCardY + 125);

      // Buttons
      const btnRowY = userCardY + 164;
      const smallBtnW = (modalW - 48 - 24) / 3;

      ctx.fillStyle = '#374151';
      roundRect(ctx, modalX + 24, btnRowY, smallBtnW, 46, 12);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#E5E7EB';
      ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Edit Profile', modalX + 24 + smallBtnW / 2, btnRowY + 28);

      ctx.fillStyle = '#374151';
      roundRect(ctx, modalX + 24 + smallBtnW + 12, btnRowY, smallBtnW, 46, 12);
      ctx.fill();
      ctx.fillText('Switch Driver', modalX + 24 + smallBtnW + 12 + smallBtnW / 2, btnRowY + 28);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      roundRect(ctx, modalX + 24 + (smallBtnW + 12) * 2, btnRowY, smallBtnW, 46, 12);
      ctx.fill();
      ctx.strokeStyle = '#EF4444';
      ctx.stroke();
      ctx.fillStyle = '#F87171';
      ctx.fillText('Log Out', modalX + 24 + (smallBtnW + 12) * 2 + smallBtnW / 2, btnRowY + 28);

      // APPLE MANDATED IN-APP ACCOUNT DELETION FLOW
      const isDeleteConfirmationVisible = sec >= 27.0;
      const deleteSectionY = btnRowY + 74;

      if (!isDeleteConfirmationVisible) {
        ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
        roundRect(ctx, modalX + 24, deleteSectionY, modalW - 48, 58, 14);
        ctx.fill();
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#F87171';
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('🗑 Delete Driver Account & Wipe Data', modalX + modalW / 2, deleteSectionY + 36);
      } else {
        ctx.fillStyle = 'rgba(127, 29, 29, 0.45)';
        roundRect(ctx, modalX + 24, deleteSectionY, modalW - 48, 225, 18);
        ctx.fill();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#FCA5A5';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('⚠️ Permanently Delete Driver Account?', modalX + 44, deleteSectionY + 36);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '13.5px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(
          'In compliance with Apple App Store policies, this will permanently',
          modalX + 44,
          deleteSectionY + 66
        );
        ctx.fillText(
          'erase your profile, vehicle garage records, and stored diagnostic trouble',
          modalX + 44,
          deleteSectionY + 88
        );
        ctx.fillText('codes. This action cannot be reversed.', modalX + 44, deleteSectionY + 110);

        const confBtnY = deleteSectionY + 140;
        const confBtnW = (modalW - 48 - 48) / 2;

        ctx.fillStyle = '#DC2626';
        roundRect(ctx, modalX + 44, confBtnY, confBtnW, 50, 12);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Permanently Delete', modalX + 44 + confBtnW / 2, confBtnY + 31);

        ctx.fillStyle = '#374151';
        roundRect(ctx, modalX + 44 + confBtnW + 16, confBtnY, confBtnW, 50, 12);
        ctx.fill();
        ctx.fillStyle = '#D1D5DB';
        ctx.fillText('Cancel', modalX + 44 + confBtnW + 16 + confBtnW / 2, confBtnY + 31);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#9CA3AF';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('✕', modalX + modalW - 36, modalY + 46);
    }

    if (isPaywallOpen) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, width, height);

      const pModalW = width - 48;
      const pModalH = 820;
      const pModalX = 24;
      const pModalY = 200;

      ctx.fillStyle = '#0F172A';
      roundRect(ctx, pModalX, pModalY, pModalW, pModalH, 24);
      ctx.fill();
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('👑 CAR AI PRO DIAGNOSTIC SUITE', width / 2, pModalY + 50);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Unlock Master Technician Tools', width / 2, pModalY + 88);

      const features = [
        'Unlimited AI Diagnostic Trouble Code Deep Scans',
        'Live High-Frequency CAN-Bus Telemetry & Custom Gauges',
        'Audio Engine Knock Acoustic Frequency Analyzer',
        'Unlimited Garage Profiles & Exportable PDF Reports'
      ];

      ctx.textAlign = 'left';
      ctx.font = '600 14.5px -apple-system, BlinkMacSystemFont, sans-serif';
      features.forEach((feat, i) => {
        const featY = pModalY + 138 + i * 40;
        ctx.fillStyle = '#10B981';
        ctx.fillText('✓', pModalX + 36, featY);
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText(feat, pModalX + 62, featY);
      });

      // Annual Card
      const annualY = pModalY + 310;
      ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
      roundRect(ctx, pModalX + 28, annualY, pModalW - 56, 115, 18);
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#0284C7';
      roundRect(ctx, pModalX + pModalW - 150, annualY - 12, 105, 26, 13);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('POPULAR', pModalX + pModalW - 97, annualY + 5);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 19px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Annual Pro Access', pModalX + 52, annualY + 42);

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('$59.99 / year', pModalX + 52, annualY + 78);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('(Just $4.99/mo • Save 50%)', pModalX + 215, annualY + 76);

      // Monthly Card
      const monthY = annualY + 132;
      ctx.fillStyle = '#1E293B';
      roundRect(ctx, pModalX + 28, monthY, pModalW - 56, 90, 18);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Monthly Pro Access', pModalX + 52, monthY + 38);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('$9.99 / month', pModalX + 52, monthY + 68);

      // CTA
      const ctaY = monthY + 110;
      ctx.fillStyle = '#0284C7';
      roundRect(ctx, pModalX + 28, ctaY, pModalW - 56, 60, 16);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 19px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Start 7-Day Free Trial', width / 2, ctaY + 37);

      const restoreY = ctaY + 86;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38BDF8';
      ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Restore Purchases  •  Terms of Use  •  Privacy Policy', width / 2, restoreY);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('✕', pModalX + pModalW - 36, pModalY + 46);
    }

    // ANIMATED FINGER TOUCH POINTER
    let pointerX = -100;
    let pointerY = -100;
    let isTapping = false;
    let tapProgress = 0;

    if (sec >= 3.8 && sec <= 5.5) {
      pointerX = width - 110;
      pointerY = 210;
      isTapping = sec >= 4.6 && sec <= 5.1;
      tapProgress = isTapping ? (sec - 4.6) / 0.5 : 0;
      drawTouchPointer(ctx, pointerX, pointerY, isTapping, tapProgress);
    } else if (sec >= 13.5 && sec <= 15.5) {
      pointerX = width / 2;
      pointerY = 740;
      isTapping = sec >= 14.3 && sec <= 14.8;
      tapProgress = isTapping ? (sec - 14.3) / 0.5 : 0;
      drawTouchPointer(ctx, pointerX, pointerY, isTapping, tapProgress);
    } else if (sec >= 22.5 && sec <= 24.5) {
      pointerX = width - 50;
      pointerY = 112;
      isTapping = sec >= 23.3 && sec <= 23.8;
      tapProgress = isTapping ? (sec - 23.3) / 0.5 : 0;
      drawTouchPointer(ctx, pointerX, pointerY, isTapping, tapProgress);
    } else if (sec >= 26.0 && sec <= 28.0) {
      pointerX = width / 2;
      pointerY = 560;
      isTapping = sec >= 26.8 && sec <= 27.3;
      tapProgress = isTapping ? (sec - 26.8) / 0.5 : 0;
      drawTouchPointer(ctx, pointerX, pointerY, isTapping, tapProgress);
    } else if (sec >= 29.5 && sec <= 31.5) {
      pointerX = width / 2 + 110;
      pointerY = 720;
      isTapping = sec >= 30.2 && sec <= 30.7;
      tapProgress = isTapping ? (sec - 30.2) / 0.5 : 0;
      drawTouchPointer(ctx, pointerX, pointerY, isTapping, tapProgress);
    } else if (sec >= 31.5 && sec <= 33.5) {
      pointerX = width - 135;
      pointerY = 112;
      isTapping = sec >= 32.2 && sec <= 32.7;
      tapProgress = isTapping ? (sec - 32.2) / 0.5 : 0;
      drawTouchPointer(ctx, pointerX, pointerY, isTapping, tapProgress);
    } else if (sec >= 35.5 && sec <= 37.5) {
      pointerX = width / 2;
      pointerY = 820;
      isTapping = sec >= 36.2 && sec <= 36.7;
      tapProgress = isTapping ? (sec - 36.2) / 0.5 : 0;
      drawTouchPointer(ctx, pointerX, pointerY, isTapping, tapProgress);
    }

    drawIPhoneBezel(ctx);

    const buf = canvas.toBuffer('image/png');
    if (!ffmpeg.stdin.write(buf)) {
      await new Promise((r) => ffmpeg.stdin.once('drain', r));
    }

    if (f % (fps * 5) === 0) {
      console.log(`Rendered frame ${f}/${totalFrames} (${Math.round((f / totalFrames) * 100)}%)`);
    }
  }

  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('Video generated successfully at:', outputPath);
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
}

run().catch((err) => {
  console.error('Fatal error during video generation:', err);
  process.exit(1);
});

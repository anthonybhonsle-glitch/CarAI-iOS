import { DTCFaultCode } from '../src/types';
import { generateContentWithRetry } from './geminiClient';
import { Type } from '@google/genai';

// Built-in expert database for instant fallback & comprehensive diagnostics
const BUILT_IN_DTC_DATABASE: Record<string, DTCFaultCode> = {
  P0101: {
    code: 'P0101',
    title: 'Mass Air Flow (MAF) Sensor Circuit Range/Performance',
    system: 'Powertrain (P)',
    severity: 'warning',
    symptoms: [
      'Hesitation or bogging down during hard acceleration',
      'Noticeably worse fuel economy (MPG down 15-25%)',
      'Rough or fluctuating idle at red lights',
      'Engine may stall momentarily when coming to a stop',
    ],
    plainEnglishSummary:
      'Your engine’s MAF sensor is the digital breath-meter measuring how many grams of air enter your intake. The computer noticed the sensor readings don’t match the throttle position and engine RPM, confusing the fuel injection calculations.',
    whyItHappened: [
      'Dirty sensor hot-wire covered in dust, oil, or debris',
      'Vacuum leak or torn intake boot downstream of the sensor',
      'Faulty wiring harness or corroded electrical connector pin',
      'Failed MAF heating element or degraded internal sensor',
    ],
    safetyRisk:
      'Safe for short-distance driving to home or shop. Extended driving with bad air/fuel mixture risks fouling spark plugs and overheating the catalytic converter.',
    drivingRecommendation:
      'Avoid wide-open throttle or towing heavy loads until cleaned or replaced.',
    diyDifficulty: 'Easy (DIY)',
    estimatedRepairCost: {
      min: 15,
      max: 280,
      averagePartsCost: 85,
      laborHours: 0.5,
      laborRatePerHour: 140,
    },
    mechanicQuestions: [
      'Did you clean the MAF sensor wire with dedicated CRC cleaner before suggesting replacement?',
      'Did you smoke-test the intake tubing for torn rubber boots or post-MAF vacuum leaks?',
      'What were the live fuel trim numbers (STFT / LTFT) when the code triggered?',
    ],
    stepByStepFix: [
      'Turn vehicle off and disconnect the negative battery terminal.',
      'Locate the MAF housing along the air intake duct right after the airbox.',
      'Unclip the sensor electrical connector and remove the two T20 Torx / Phillips screws.',
      'Spray the exposed platinum wires with dedicated MAF Cleaner (never touch wires with fingers/cotton).',
      'Let it air-dry completely for 10 minutes, reinstall snugly, and clear DTC with CarAI.',
    ],
    partsNeeded: [
      { name: 'CRC Mass Air Flow Sensor Cleaner (11 oz)', estimatedPrice: 12, partNumber: 'CRC-05110' },
      { name: 'OEM Replacement MAF Sensor Unit', estimatedPrice: 85, partNumber: 'MAF-8204-OEM' },
      { name: 'High-Flow Engine Air Filter', estimatedPrice: 28, partNumber: 'AF-3320' },
    ],
    upgradeOptions: [
      {
        id: 'upg_cai_01',
        title: 'Cold Air Intake System with Shielded Velocity Filter',
        category: 'Air Intake',
        description: 'Replaces restrictive OEM plastic intake tube with mandrel-bent aluminum piping, improving airflow volume and providing a satisfying intake induction growl.',
        estimatedPrice: 249,
        performanceGain: '+8 to 14 HP & crisper throttle response',
        affiliateUrl: 'https://example.com/affiliate/intake-p0101',
        brand: 'Injen / K&N Performance',
      },
      {
        id: 'upg_dry_filter',
        title: 'High-Flow Dry Synthetic Performance Drop-In Filter',
        category: 'Air Intake',
        description: 'Oil-free high flow air filter that will never contaminate your delicate MAF sensor wire with oily residue.',
        estimatedPrice: 65,
        performanceGain: '+2-4 HP & Lifetime washable',
        affiliateUrl: 'https://example.com/affiliate/dry-filter',
        brand: 'AEM Induction',
      },
    ],
  },
  P0300: {
    code: 'P0300',
    title: 'Random / Multiple Cylinder Misfire Detected',
    system: 'Powertrain (P)',
    severity: 'critical',
    symptoms: [
      'Flashing Check Engine Light (flashing = catalytic converter damage risk)',
      'Severe engine shaking / violent vibration at idle',
      'Strong smell of unburnt raw gasoline from exhaust',
      'Substantial loss of power on highway merges',
    ],
    plainEnglishSummary:
      'The crankshaft position sensor detected uneven acceleration between cylinder firing events. Multiple cylinders failed to properly ignite the fuel-air mixture, sending unburnt fuel into the exhaust pipe.',
    whyItHappened: [
      'Worn spark plugs with excessive electrode gap',
      'Degraded ignition coil pack with internal insulation breakdown',
      'Low fuel pressure or clogged fuel injector nozzles',
      'Intake manifold gasket vacuum leak letting unmetered air in',
    ],
    safetyRisk:
      'HIGH RISK IF FLASHING: A blinking MIL indicates raw fuel is burning inside your $1,200 catalytic converter, which can melt the ceramic core in under 15 minutes of driving.',
    drivingRecommendation:
      'If Check Engine Light is FLASHING, pull over safely and turn off engine immediately. Call a tow truck.',
    diyDifficulty: 'Moderate (Jack + Hand Tools)',
    estimatedRepairCost: {
      min: 45,
      max: 650,
      averagePartsCost: 180,
      laborHours: 1.5,
      laborRatePerHour: 140,
    },
    mechanicQuestions: [
      'Which specific cylinders show the highest misfire count on mode $06 data?',
      'Are the spark plug electrodes fouled with fuel, oil, or white ash deposits?',
      'What is the fuel rail pressure under load?',
    ],
    stepByStepFix: [
      'Check freeze frame data to see which cylinders misfired and under what load.',
      'Remove ignition coils and inspect spark plug wells for engine oil seepage.',
      'Remove spark plugs and check electrode wear, gap (.028" - .044"), and ceramic cracks.',
      'Swap coil pack from misfiring cylinder to a healthy cylinder to see if misfire follows.',
      'Install a fresh set of Iridium plugs torqued to manufacturer spec (usually 15-20 lb-ft).',
    ],
    partsNeeded: [
      { name: 'NGK Laser Iridium Spark Plugs (Set of 4/6)', estimatedPrice: 58, partNumber: 'NGK-94201' },
      { name: 'Direct Ignition Coil Pack Set', estimatedPrice: 160, partNumber: 'IGN-COIL-4X' },
      { name: 'Dielectric Spark Plug Boot Grease', estimatedPrice: 8, partNumber: 'PERM-81150' },
    ],
    upgradeOptions: [
      {
        id: 'upg_spark_01',
        title: 'High-Output Performance Ignition Coils (Red/Gold Pack)',
        category: 'Ignition',
        description: 'Delivers 10% stronger spark energy across the entire RPM range, preventing high-RPM spark blowout and smoothing out rough cold starts.',
        estimatedPrice: 280,
        performanceGain: 'Sharper spark arc & smoother high-rev ignition',
        affiliateUrl: 'https://example.com/affiliate/coils-p0300',
        brand: 'MSD / APR Performance',
      },
      {
        id: 'upg_iridium_plugs',
        title: 'NGK Ruthenium HX High-Ignitability Spark Plugs',
        category: 'Ignition',
        description: 'State-of-the-art DFE design with precious ruthenium tip for unmatched combustion efficiency and thermal durability.',
        estimatedPrice: 72,
        performanceGain: 'Optimal flame kernel expansion & 100k mi life',
        affiliateUrl: 'https://example.com/affiliate/ruthenium-plugs',
        brand: 'NGK Racing',
      },
    ],
  },
  P0420: {
    code: 'P0420',
    title: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    system: 'Powertrain (P)',
    severity: 'warning',
    symptoms: [
      'Steady Check Engine Light illuminated on dash',
      'Emissions / SMOG inspection failure guaranteed',
      'Rotten egg / sulfur smell from exhaust under heavy load',
      'Sluggish top-end engine power if converter is partially restricted',
    ],
    plainEnglishSummary:
      'The engine computer compares readings from the oxygen sensor BEFORE the catalytic converter with the sensor AFTER it. Because the downstream sensor is switching rapidly instead of staying steady, the cat is no longer scrubbing exhaust emissions cleanly.',
    whyItHappened: [
      'Catalytic converter internal substrate degraded from age or oil/coolant contamination',
      'Exhaust leak at the manifold flange or flex pipe before downstream O2 sensor',
      'Downstream heated O2 sensor failing and giving erratic voltage',
      'Engine running rich or misfiring previously, damaging the catalyst washcoat',
    ],
    safetyRisk:
      'Low immediate safety risk. Vehicle is drivable, but tailpipe greenhouse emissions are high and your car will fail state vehicle inspections.',
    drivingRecommendation:
      'Safe to drive normally, but inspect exhaust pipe for leaks before purchasing a costly replacement converter.',
    diyDifficulty: 'Advanced (Specialty Tools)',
    estimatedRepairCost: {
      min: 120,
      max: 1850,
      averagePartsCost: 750,
      laborHours: 2.0,
      laborRatePerHour: 140,
    },
    mechanicQuestions: [
      'Did you test the downstream O2 sensor response curve with a live scan oscilloscope?',
      'Is there an upstream exhaust manifold leak or cracked flex pipe pulling in fresh ambient oxygen?',
      'Is there unburnt oil or coolant entering the exhaust stream from valve seals or head gasket?',
    ],
    stepByStepFix: [
      'Use CarAI live telemetry to monitor O2 Sensor Bank 1 Sensor 2 voltage (should stay steady ~0.6-0.7V at cruise).',
      'Inspect exhaust pipe upstream of catalytic converter for black carbon soot indicating a flange leak.',
      'Test catalytic converter temperature with an infrared thermometer (outlet should be 50-100°F hotter than inlet).',
      'Replace downstream O2 sensor first if older than 100,000 miles.',
      'If converter substrate has melted/cracked, replace with direct-fit EPA-compliant catalytic unit.',
    ],
    partsNeeded: [
      { name: 'Bosch Heated Downstream Oxygen Sensor (O2)', estimatedPrice: 75, partNumber: 'BSH-15733' },
      { name: 'Direct-Fit EPA Certified Catalytic Converter Assembly', estimatedPrice: 580, partNumber: 'MAG-54212' },
      { name: 'Cataclean Liquid Exhaust & Cat Cleaner', estimatedPrice: 26, partNumber: 'CAT-4820' },
    ],
    upgradeOptions: [
      {
        id: 'upg_exhaust_01',
        title: 'High-Flow 200-Cell Stainless Steel Sport Catalytic Downpipe',
        category: 'Exhaust',
        description: 'TIG-welded 304 stainless steel downpipe with ultra-low restriction 200-cell metallic core, freeing up turbo spool while maintaining clean emissions.',
        estimatedPrice: 650,
        performanceGain: '+15 to 22 HP & deeper exhaust resonance',
        affiliateUrl: 'https://example.com/affiliate/downpipe-p0420',
        brand: 'Milltek / Borla Sport',
      },
    ],
  },
  P0171: {
    code: 'P0171',
    title: 'System Too Lean (Bank 1) — Excess Air / Insufficient Fuel',
    system: 'Powertrain (P)',
    severity: 'warning',
    symptoms: [
      'Engine pinging or knocking under moderate acceleration',
      'Cold start stalling or rough idle until warmed up',
      'Hesitation or flat-spot when depressing accelerator',
      'High Long Term Fuel Trim (LTFT exceeding +15% to +25%)',
    ],
    plainEnglishSummary:
      'The engine computer detected way too much unburned oxygen in the exhaust. It is forced to inject extra fuel to compensate for unmetered air leaking in or a weak fuel delivery system.',
    whyItHappened: [
      'Cracked PCV rubber vacuum hose or failed PCV diaphragm valve',
      'Intake manifold gasket leaking under engine vacuum',
      'Weak fuel pump delivering low fuel pressure or clogged fuel filter',
      'Dirty mass air flow sensor under-reporting incoming air volume',
    ],
    safetyRisk:
      'Moderate risk: Running too lean creates excessive combustion chamber heat, which over time can cause pre-ignition, detonation, and burnt exhaust valves.',
    drivingRecommendation:
      'Drive gently with moderate throttle; avoid aggressive high-RPM driving.',
    diyDifficulty: 'Moderate (Jack + Hand Tools)',
    estimatedRepairCost: {
      min: 25,
      max: 420,
      averagePartsCost: 110,
      laborHours: 1.2,
      laborRatePerHour: 140,
    },
    mechanicQuestions: [
      'What are the Long Term Fuel Trim (LTFT) numbers at idle vs 2500 RPM?',
      'Did a smoke test reveal leaks at the PCV valve, brake booster line, or intake gaskets?',
      'What is the static and dynamic fuel pressure at the test port?',
    ],
    stepByStepFix: [
      'Connect CarAI live gauge and observe Short Term & Long Term Fuel Trims.',
      'If LTFT drops closer to 0% at 2500 RPM, you have an intake vacuum leak at idle.',
      'Inspect PCV valve and vacuum hoses for cracks, softness, or hissing sounds.',
      'Spray carburetor cleaner cautiously around intake gasket joints while monitoring RPM.',
      'Replace brittle PCV hose or faulty PCV valve and clear code.',
    ],
    partsNeeded: [
      { name: 'OEM PCV Valve & Molded Breather Hose Kit', estimatedPrice: 38, partNumber: 'PCV-9912-KIT' },
      { name: 'Intake Manifold Gasket Set', estimatedPrice: 42, partNumber: 'FEL-MS97120' },
      { name: 'High-Flow In-Line Fuel Filter', estimatedPrice: 22, partNumber: 'WIX-33033' },
    ],
    upgradeOptions: [
      {
        id: 'upg_fuel_01',
        title: 'High-Flow DeatschWerks In-Tank 265LPH Fuel Pump',
        category: 'Fuel System',
        description: 'Robust turbine-impeller fuel pump providing consistent 265 liters/hr flow rate to ensure your engine never runs lean even under full boost.',
        estimatedPrice: 175,
        performanceGain: 'Guaranteed steady fuel delivery up to 450 HP',
        affiliateUrl: 'https://example.com/affiliate/fuelpump-p0171',
        brand: 'DeatschWerks',
      },
    ],
  },
  P0442: {
    code: 'P0442',
    title: 'Evaporative Emission Control System (EVAP) Small Leak Detected',
    system: 'Powertrain (P)',
    severity: 'info',
    symptoms: [
      'Check Engine Light on dashboard without any noticeable drivability issues',
      'Mild fuel vapor smell near rear wheel arch or fuel filler neck',
      'Fails automatic state emissions OBD-II readiness inspection',
    ],
    plainEnglishSummary:
      'The EVAP system seals fuel vapors inside your tank and directs them to the engine to be burned. The system performed an automated vacuum decay test overnight and noticed a tiny leak (approx. 0.040" pinhole).',
    whyItHappened: [
      'Loose, worn, or cracked rubber O-ring seal on the gas cap',
      'Stuck open or sticking EVAP Canister Purge Solenoid Valve',
      'Cracked EVAP vapor line or degraded charcoal canister housing',
      'Corroded fuel filler neck lip preventing a tight cap seal',
    ],
    safetyRisk:
      'Very low safety risk. The car drives completely normally. Fuel vapors are vented to atmosphere rather than burned.',
    drivingRecommendation:
      'Drivable indefinitely without mechanical damage, but repair is required to pass smog checks.',
    diyDifficulty: 'Easy (DIY)',
    estimatedRepairCost: {
      min: 15,
      max: 220,
      averagePartsCost: 45,
      laborHours: 0.5,
      laborRatePerHour: 140,
    },
    mechanicQuestions: [
      'Did you inspect the gas cap rubber gasket for micro-cracks before replacing solenoids?',
      'Did you test the purge solenoid resistance and vacuum seal with a 12V test pulse?',
      'Where did the EVAP smoke test exit the chassis?',
    ],
    stepByStepFix: [
      'Remove gas cap, clean metal filler neck lip, and inspect the rubber gasket for dry rot.',
      'Reinstall gas cap and ensure it clicks 3 times firmly.',
      'Inspect EVAP purge solenoid located near the engine intake manifold for cracks.',
      'If code returns, replace gas cap with OEM locking cap and clear code.',
    ],
    partsNeeded: [
      { name: 'OEM Replacement Click-Lock Gas Cap with Viton Seal', estimatedPrice: 18, partNumber: 'CAP-77300' },
      { name: 'EVAP Vapor Canister Purge Solenoid Valve', estimatedPrice: 55, partNumber: 'PRG-911-042' },
    ],
    upgradeOptions: [
      {
        id: 'upg_billet_cap',
        title: 'Billet Anodized Aluminum Race Fuel Cap Cover',
        category: 'Sensors',
        description: 'CNC machined 6061 aircraft aluminum cap cover with laser-etched octane rating, adding engine bay styling while maintaining hermetic seal.',
        estimatedPrice: 48,
        performanceGain: 'Aesthetic motorsport finish & leakproof seal',
        affiliateUrl: 'https://example.com/affiliate/billet-cap',
        brand: 'Mishimoto',
      },
    ],
  },
};

export async function explainDTC(
  code: string,
  vehicleInfo?: { make?: string; model?: string; year?: number; engine?: string }
): Promise<DTCFaultCode> {
  const cleanCode = (code || 'P0101').toUpperCase().trim();

  // If built-in exists and no complex custom AI prompt requested, return enriched built-in immediately
  const existing = BUILT_IN_DTC_DATABASE[cleanCode];

  try {
    const vehicleDesc = vehicleInfo?.make
      ? `${vehicleInfo.year || ''} ${vehicleInfo.make} ${vehicleInfo.model || ''} (${vehicleInfo.engine || 'Engine'})`
      : 'Generic OBD-II compliant vehicle';

    const prompt = `You are the lead master ASE-certified automotive diagnostic technician for CarAI. 
Analyze the OBD-II diagnostic trouble code (DTC): "${cleanCode}" for vehicle: "${vehicleDesc}".
Provide an ultra-detailed, highly actionable, plain-English breakdown with mechanic defense advice, step-by-step fix, DIY vs mechanic cost estimates ($ USD), parts needed, and performance upgrade opportunities (e.g. cold air intake, high flow catalytic downpipe, high performance ignition coils, etc.).

Return the response in strict JSON format.`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.7-flash',
      fallbackModels: ['gemini-3.1-flash-lite', 'gemini-flash-latest'],
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            title: { type: Type.STRING },
            system: { type: Type.STRING },
            severity: { type: Type.STRING },
            symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            plainEnglishSummary: { type: Type.STRING },
            whyItHappened: { type: Type.ARRAY, items: { type: Type.STRING } },
            safetyRisk: { type: Type.STRING },
            drivingRecommendation: { type: Type.STRING },
            diyDifficulty: { type: Type.STRING },
            estimatedRepairCost: {
              type: Type.OBJECT,
              properties: {
                min: { type: Type.NUMBER },
                max: { type: Type.NUMBER },
                averagePartsCost: { type: Type.NUMBER },
                laborHours: { type: Type.NUMBER },
                laborRatePerHour: { type: Type.NUMBER },
              },
              required: ['min', 'max', 'averagePartsCost', 'laborHours', 'laborRatePerHour'],
            },
            mechanicQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            stepByStepFix: { type: Type.ARRAY, items: { type: Type.STRING } },
            partsNeeded: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  estimatedPrice: { type: Type.NUMBER },
                  partNumber: { type: Type.STRING },
                },
                required: ['name', 'estimatedPrice'],
              },
            },
            upgradeOptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedPrice: { type: Type.NUMBER },
                  performanceGain: { type: Type.STRING },
                  affiliateUrl: { type: Type.STRING },
                  brand: { type: Type.STRING },
                },
                required: ['id', 'title', 'category', 'description', 'estimatedPrice', 'performanceGain', 'brand'],
              },
            },
          },
          required: [
            'code',
            'title',
            'system',
            'severity',
            'symptoms',
            'plainEnglishSummary',
            'whyItHappened',
            'safetyRisk',
            'drivingRecommendation',
            'diyDifficulty',
            'estimatedRepairCost',
            'mechanicQuestions',
            'stepByStepFix',
            'partsNeeded',
            'upgradeOptions',
          ],
        },
      },
    });

    if (response?.text) {
      const parsed = JSON.parse(response.text.trim()) as DTCFaultCode;
      if (parsed && parsed.code) {
        return parsed;
      }
    }
  } catch (err) {
    // Non-blocking fallback to curated database
  }

  if (existing) {
    return existing;
  }

  // Generic fallback if unrecognized DTC and offline
  return {
    code: cleanCode,
    title: `Diagnostic Trouble Code ${cleanCode}`,
    system: cleanCode.startsWith('P') ? 'Powertrain (P)' : cleanCode.startsWith('U') ? 'Network / CAN (U)' : cleanCode.startsWith('B') ? 'Body (B)' : 'Chassis (C)',
    severity: 'warning',
    symptoms: [
      'Check Engine MIL light active on dash cluster',
      'Possible degraded acceleration and fuel efficiency',
      'Electronic control unit logged freeze frame snapshot',
    ],
    plainEnglishSummary: `Your vehicle ECU registered a sensor or actuator variance exceeding factory tolerance thresholds for DTC ${cleanCode}.`,
    whyItHappened: [
      'Sensor signal voltage out of calibrated range',
      'Intermittent circuit resistance or loose ground strap',
      'Mechanical component wear or carbon accumulation',
    ],
    safetyRisk: 'Moderate: Inspect with live diagnostic scanner before long road trips.',
    drivingRecommendation: 'Drive cautiously to your destination and schedule diagnostic inspection.',
    diyDifficulty: 'Moderate (Jack + Hand Tools)',
    estimatedRepairCost: {
      min: 60,
      max: 350,
      averagePartsCost: 95,
      laborHours: 1.0,
      laborRatePerHour: 140,
    },
    mechanicQuestions: [
      `What were the live sensor PID values when ${cleanCode} set?`,
      'Is there an OEM Technical Service Bulletin (TSB) for this code on my make/model?',
    ],
    stepByStepFix: [
      'Check vehicle battery state of charge (ensure >12.4V at rest).',
      'Inspect wire harnesses and connectors leading to the monitored component.',
      'Check fuse box for blown circuit protection fuses.',
      'Clear trouble codes and test drive under identical conditions.',
    ],
    partsNeeded: [
      { name: 'Replacement OEM Sensor Assembly', estimatedPrice: 95, partNumber: 'OEM-SPEC' },
      { name: 'Automotive Electrical Contact Cleaner', estimatedPrice: 14, partNumber: 'DEOX-D5' },
    ],
    upgradeOptions: [
      {
        id: 'upg_generic_obd',
        title: 'ELM327 Bluetooth Low Energy Real-Time Telemetry Dongle',
        category: 'Sensors',
        description: 'High-speed CAN OBD-II reader enabling 50Hz sensor polling and instant fault code clearing.',
        estimatedPrice: 39,
        performanceGain: 'Real-time telemetry & instant MIL clear',
        affiliateUrl: 'https://example.com/affiliate/elm327-pro',
        brand: 'CarAI ProLink',
      },
    ],
  };
}

export function getAllKnownDTCs(): { code: string; title: string; system: string; severity: string }[] {
  return Object.values(BUILT_IN_DTC_DATABASE).map((dtc) => ({
    code: dtc.code,
    title: dtc.title,
    system: dtc.system,
    severity: dtc.severity,
  }));
}

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// [lat_center, lng_center, radius_km]
const DISTRICT_GPS = {
  CMB: [6.9271, 79.8612, 8],
  GMP: [7.0873, 79.9986, 12],
  KLT: [6.5855, 79.9607, 10],
  KDY: [7.2906, 80.6337, 10],
  MTL: [7.4675, 80.6234, 12],
  NWE: [6.9497, 80.7891, 8],
  GLE: [6.0535, 80.221, 10],
  MTR: [5.9455, 80.5353, 10],
  HBT: [6.1241, 81.1185, 15],
  JFN: [9.6615, 80.0255, 12],
  KLN: [9.3973, 80.4029, 15],
  MNR: [8.9744, 79.9044, 20],
  VVN: [8.7515, 80.4977, 15],
  MLT: [9.2672, 80.8142, 20],
  TRM: [8.5874, 81.2152, 12],
  BTC: [7.7167, 81.6924, 12],
  AMP: [7.2985, 81.6747, 15],
  KRN: [7.4818, 80.3609, 15],
  PTL: [8.0314, 79.8395, 15],
  ANP: [8.3114, 80.4037, 20],
  PLN: [7.9403, 81.0188, 15],
  BDL: [6.9895, 81.0557, 12],
  MON: [6.8728, 81.3507, 15],
  RTN: [6.6828, 80.3992, 12],
  KGL: [7.2513, 80.3464, 12],
};

const toRad = (deg) => (deg * Math.PI) / 180;

function moveCoordinate(lat, lng, maxKm) {
  const earthRadius = 6371;
  const deltaLat =
    (((Math.random() - 0.5) * 2 * maxKm) / earthRadius) * (180 / Math.PI);
  const deltaLng =
    (((Math.random() - 0.5) * 2 * maxKm) /
      (earthRadius * Math.cos(toRad(lat)))) *
    (180 / Math.PI);
  return [
    Math.round((lat + deltaLat) * 1e6) / 1e6,
    Math.round((lng + deltaLng) * 1e6) / 1e6,
  ];
}

function generateHeading() {
  return Math.round(Math.random() * 360);
}

//Generate a plausible speed for a tuk-tuk.

function generateSpeed(type = "city") {
  if (type === "parked") {
    return 0;
  }
  if (type === "highway") {
    return Math.round(35 + Math.random() * 35);
  }
  return Math.round(5 + Math.random() * 30);
}

async function generateHistory() {
  console.log("📡 Generating location history (8 days × 200 vehicles)...\n");

  const vehicles = await prisma.vehicle.findMany({
    where: { status: "ACTIVE" },
    include: { district: true },
    take: 200,
  });

  console.log(`Found ${vehicles.length} active vehicles\n`);

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 8);
  startDate.setHours(6, 0, 0, 0);

  let totalPings = 0;
  const BATCH_SIZE = 500;

  for (let vi = 0; vi < vehicles.length; vi++) {
    const vehicle = vehicles[vi];
    const districtCode = vehicle.district.code;
    const [baseLat, baseLng, radius] = DISTRICT_GPS[districtCode] || [
      7.0, 80.0, 10,
    ];

    const isStale = vi % 20 === 19;
    const staleDate = new Date(now);
    staleDate.setDate(staleDate.getDate() - 2);

    const isSuspicious = vi % 50 === 49;

    let currentLat = baseLat;
    let currentLng = baseLng;
    const pings = [];

    for (let day = 0; day < 8; day++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + day);

      for (let minuteOffset = 0; minuteOffset <= 960; minuteOffset += 5) {
        const pingTime = new Date(dayStart);
        pingTime.setMinutes(pingTime.getMinutes() + minuteOffset);

        if (isStale && pingTime > staleDate) {
          break;
        }

        if (pingTime > now) {
          break;
        }

        const moveKm = Math.random() < 0.9 ? 0.3 : 1.5;

        if (isSuspicious && Math.random() < 0.1) {
          const [suspiciousLat, suspiciousLng] = moveCoordinate(
            baseLat,
            baseLng,
            radius * 3,
          );
          currentLat = suspiciousLat;
          currentLng = suspiciousLng;
        } else {
          const [newLat, newLng] = moveCoordinate(
            currentLat,
            currentLng,
            moveKm,
          );

          const distFromBase = Math.sqrt(
            Math.pow(newLat - baseLat, 2) + Math.pow(newLng - baseLng, 2),
          );
          const maxDeg = radius / 111;
          if (distFromBase < maxDeg) {
            currentLat = newLat;
            currentLng = newLng;
          } else {
            currentLat = currentLat + (baseLat - currentLat) * 0.1;
            currentLng = currentLng + (baseLng - currentLng) * 0.1;
            currentLat = Math.round(currentLat * 1e6) / 1e6;
            currentLng = Math.round(currentLng * 1e6) / 1e6;
          }
        }

        const speed = generateSpeed(Math.random() < 0.2 ? "highway" : "city");

        pings.push({
          vehicleId: vehicle.id,
          latitude: currentLat,
          longitude: currentLng,
          speed,
          heading: generateHeading(),
          altitude: Math.round(baseLat > 8 ? 10 : 100 + Math.random() * 200),
          accuracy: Math.round(3 + Math.random() * 12),
          timestamp: pingTime,
          createdAt: pingTime,
        });

        if (pings.length >= BATCH_SIZE) {
          await prisma.locationPing.createMany({
            data: pings,
            skipDuplicates: true,
          });
          totalPings += pings.length;
          pings.length = 0;
        }
      }
    }

    if (pings.length > 0) {
      await prisma.locationPing.createMany({
        data: pings,
        skipDuplicates: true,
      });
      totalPings += pings.length;
    }

    // Upsert last known location
    if (!isStale && vehicles[vi]) {
      await prisma.lastKnownLocation.upsert({
        where: { vehicleId: vehicle.id },
        create: {
          vehicleId: vehicle.id,
          latitude: currentLat,
          longitude: currentLng,
          speed: generateSpeed("city"),
          heading: generateHeading(),
          timestamp: now,
        },
        update: {
          latitude: currentLat,
          longitude: currentLng,
          speed: generateSpeed("city"),
          heading: generateHeading(),
          timestamp: now,
        },
      });
    }

    if ((vi + 1) % 20 === 0 || vi + 1 === vehicles.length) {
      console.log(
        `   Vehicle ${vi + 1}/${vehicles.length} done | Total pings so far: ${totalPings.toLocaleString()}`,
      );
    }
  }

  console.log("\n✅ Location history generation complete!");
  console.log(`   📍 Total pings inserted: ${totalPings.toLocaleString()}`);
  console.log(`   🚗 Vehicles processed: ${vehicles.length}`);
  console.log(
    `   📅 Date range: ${startDate.toLocaleDateString()} → ${now.toLocaleDateString()}`,
  );
}

generateHistory()
  .catch((err) => {
    console.error("❌ Simulation failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

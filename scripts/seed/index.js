import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// db seed

const prisma = new PrismaClient();

// Master Data

const PROVINCES = [
  { name: 'Western Province', code: 'WP' },
  { name: 'Central Province', code: 'CP' },
  { name: 'Southern Province', code: 'SP' },
  { name: 'Northern Province', code: 'NP' },
  { name: 'Eastern Province', code: 'EP' },
  { name: 'North Western Province', code: 'NWP' },
  { name: 'North Central Province', code: 'NCP' },
  { name: 'Uva Province', code: 'UP' },
  { name: 'Sabaragamuwa Province', code: 'SGP' },
];

const DISTRICTS = [
  // Western
  { name: 'Colombo', code: 'CMB', provinceCode: 'WP' },
  { name: 'Gampaha', code: 'GMP', provinceCode: 'WP' },
  { name: 'Kalutara', code: 'KLT', provinceCode: 'WP' },
  // Central
  { name: 'Kandy', code: 'KDY', provinceCode: 'CP' },
  { name: 'Matale', code: 'MTL', provinceCode: 'CP' },
  { name: 'Nuwara Eliya', code: 'NWE', provinceCode: 'CP' },
  // Southern
  { name: 'Galle', code: 'GLE', provinceCode: 'SP' },
  { name: 'Matara', code: 'MTR', provinceCode: 'SP' },
  { name: 'Hambantota', code: 'HBT', provinceCode: 'SP' },
  // Northern
  { name: 'Jaffna', code: 'JFN', provinceCode: 'NP' },
  { name: 'Kilinochchi', code: 'KLN', provinceCode: 'NP' },
  { name: 'Mannar', code: 'MNR', provinceCode: 'NP' },
  { name: 'Vavuniya', code: 'VVN', provinceCode: 'NP' },
  { name: 'Mullaitivu', code: 'MLT', provinceCode: 'NP' },
  // Eastern
  { name: 'Trincomalee', code: 'TRM', provinceCode: 'EP' },
  { name: 'Batticaloa', code: 'BTC', provinceCode: 'EP' },
  { name: 'Ampara', code: 'AMP', provinceCode: 'EP' },
  // North Western
  { name: 'Kurunegala', code: 'KRN', provinceCode: 'NWP' },
  { name: 'Puttalam', code: 'PTL', provinceCode: 'NWP' },
  // North Central
  { name: 'Anuradhapura', code: 'ANP', provinceCode: 'NCP' },
  { name: 'Polonnaruwa', code: 'PLN', provinceCode: 'NCP' },
  // Uva
  { name: 'Badulla', code: 'BDL', provinceCode: 'UP' },
  { name: 'Monaragala', code: 'MON', provinceCode: 'UP' },
  // Sabaragamuwa
  { name: 'Ratnapura', code: 'RTN', provinceCode: 'SGP' },
  { name: 'Kegalle', code: 'KGL', provinceCode: 'SGP' },
];

const POLICE_STATIONS = [
  {
    name: 'Colombo Fort Police Station',
    code: 'CMB-FORT',
    districtCode: 'CMB',
    address: 'Bank of Ceylon Mawatha, Colombo 01',
    contact: '+94112421111',
  },
  {
    name: 'Wellampitiya Police Station',
    code: 'CMB-WMP',
    districtCode: 'CMB',
    address: 'Wellampitiya Road, Colombo',
    contact: '+94112537777',
  },
  {
    name: 'Gampaha Police Station',
    code: 'GMP-HQ',
    districtCode: 'GMP',
    address: 'Station Road, Gampaha',
    contact: '+94332222222',
  },
  {
    name: 'Negombo Police Station',
    code: 'GMP-NGM',
    districtCode: 'GMP',
    address: 'Colombo Road, Negombo',
    contact: '+94312227222',
  },
  {
    name: 'Kalutara North Police Station',
    code: 'KLT-N',
    districtCode: 'KLT',
    address: 'Galle Road, Kalutara',
    contact: '+94342222555',
  },
  {
    name: 'Kandy City Police Station',
    code: 'KDY-CTY',
    districtCode: 'KDY',
    address: 'William Gopallawa Mawatha, Kandy',
    contact: '+94812222333',
  },
  {
    name: 'Peradeniya Police Station',
    code: 'KDY-PRD',
    districtCode: 'KDY',
    address: 'Peradeniya Road, Kandy',
    contact: '+94812388001',
  },
  {
    name: 'Matale Police Station',
    code: 'MTL-HQ',
    districtCode: 'MTL',
    address: 'King Street, Matale',
    contact: '+94662222444',
  },
  {
    name: 'Nuwara Eliya Police Station',
    code: 'NWE-HQ',
    districtCode: 'NWE',
    address: 'Park Road, Nuwara Eliya',
    contact: '+94522222555',
  },
  {
    name: 'Galle Fort Police Station',
    code: 'GLE-FORT',
    districtCode: 'GLE',
    address: 'Church Street, Galle Fort',
    contact: '+94912222666',
  },
  {
    name: 'Hikkaduwa Police Station',
    code: 'GLE-HKD',
    districtCode: 'GLE',
    address: 'Galle Road, Hikkaduwa',
    contact: '+94912277007',
  },
  {
    name: 'Matara Police Station',
    code: 'MTR-HQ',
    districtCode: 'MTR',
    address: 'Anagarika Dharmapala Mawatha, Matara',
    contact: '+94412222777',
  },
  {
    name: 'Hambantota Police Station',
    code: 'HBT-HQ',
    districtCode: 'HBT',
    address: 'Tissa Road, Hambantota',
    contact: '+94472222888',
  },
  {
    name: 'Jaffna Police Station',
    code: 'JFN-HQ',
    districtCode: 'JFN',
    address: 'Stanley Road, Jaffna',
    contact: '+94212222999',
  },
  {
    name: 'Kilinochchi Police Station',
    code: 'KLN-HQ',
    districtCode: 'KLN',
    address: 'Main Street, Kilinochchi',
    contact: '+94212284001',
  },
  {
    name: 'Trincomalee Police Station',
    code: 'TRM-HQ',
    districtCode: 'TRM',
    address: 'Inner Harbour Road, Trincomalee',
    contact: '+94262222111',
  },
  {
    name: 'Batticaloa Police Station',
    code: 'BTC-HQ',
    districtCode: 'BTC',
    address: 'Bar Road, Batticaloa',
    contact: '+94652222222',
  },
  {
    name: 'Kurunegala Police Station',
    code: 'KRN-HQ',
    districtCode: 'KRN',
    address: 'Rajapihilla Mawatha, Kurunegala',
    contact: '+94372222333',
  },
  {
    name: 'Puttalam Police Station',
    code: 'PTL-HQ',
    districtCode: 'PTL',
    address: 'Kurunegala Road, Puttalam',
    contact: '+94322222444',
  },
  {
    name: 'Anuradhapura Police Station',
    code: 'ANP-HQ',
    districtCode: 'ANP',
    address: 'Maithripala Senanayaka Mawatha, Anuradhapura',
    contact: '+94252222555',
  },
  {
    name: 'Polonnaruwa Police Station',
    code: 'PLN-HQ',
    districtCode: 'PLN',
    address: 'New Town Road, Polonnaruwa',
    contact: '+94272222666',
  },
  {
    name: 'Badulla Police Station',
    code: 'BDL-HQ',
    districtCode: 'BDL',
    address: 'Badulla Road, Badulla',
    contact: '+94552222777',
  },
  {
    name: 'Monaragala Police Station',
    code: 'MON-HQ',
    districtCode: 'MON',
    address: 'Main Street, Monaragala',
    contact: '+94552284001',
  },
  {
    name: 'Ratnapura Police Station',
    code: 'RTN-HQ',
    districtCode: 'RTN',
    address: 'Getambe Road, Ratnapura',
    contact: '+94452222888',
  },
  {
    name: 'Kegalle Police Station',
    code: 'KGL-HQ',
    districtCode: 'KGL',
    address: 'Colombo Road, Kegalle',
    contact: '+94352222999',
  },
];

const PROVINCE_PREFIXES = {
  WP: ['WP'],
  CP: ['CP'],
  SP: ['SP'],
  NP: ['NP'],
  EP: ['EP'],
  NWP: ['NW'],
  NCP: ['NC'],
  UP: ['UP'],
  SGP: ['SG'],
};

const DRIVER_FIRST_NAMES = [
  'Kamal',
  'Nimal',
  'Amal',
  'Sunil',
  'Ruwan',
  'Pradeep',
  'Chamara',
  'Saman',
  'Nuwan',
  'Asanka',
  'Tharaka',
  'Janaka',
  'Kasun',
  'Malith',
  'Sanjeewa',
  'Udara',
  'Dilshan',
  'Harsha',
  'Roshan',
  'Gayan',
  'Mohamed',
  'Rilwan',
  'Nazar',
  'Faisal',
  'Ahamed',
  'Imran',
  'Thanesh',
  'Selvan',
  'Rajan',
  'Kumar',
];
const DRIVER_LAST_NAMES = [
  'Perera',
  'Silva',
  'Fernando',
  'Jayawardena',
  'Dissanayake',
  'Rajapaksa',
  'Wickramasinghe',
  'Bandara',
  'Gunasekara',
  'Weerasinghe',
  'Pathirana',
  'Kumara',
  'Rathnayake',
  'Amarasinghe',
  'Liyanage',
  'Hussain',
  'Ibrahim',
  'Farook',
  'Thambipillai',
  'Krishnaswamy',
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pad = (n, len = 4) => String(n).padStart(len, '0');

function generateNic(index) {
  const year = rand(1970, 1995);
  const day = rand(1, 366);
  return `${year}${pad(day, 3)}${pad(index % 9999, 4)}V`;
}

function generateRegNumber(provincePrefix, index) {
  const letters = 'ABCDEFGHJKLMNPRSTUVWYZ';
  const l1 = letters[rand(0, letters.length - 1)];
  const l2 = letters[rand(0, letters.length - 1)];
  const l3 = letters[rand(0, letters.length - 1)];
  return `${provincePrefix} ${l1}${l2}${l3}-${pad(index)}`;
}

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // 1. Provinces
  console.log('📍 Seeding provinces...');
  const provinceMap = {};
  for (const p of PROVINCES) {
    const province = await prisma.province.upsert({
      where: { code: p.code },
      update: { name: p.name },
      create: p,
    });
    provinceMap[p.code] = province;
  }
  console.log(`   ✅ ${PROVINCES.length} provinces`);

  // 2. Districts
  console.log('📍 Seeding districts...');
  const districtMap = {};
  for (const d of DISTRICTS) {
    const district = await prisma.district.upsert({
      where: { code: d.code },
      update: { name: d.name, provinceId: provinceMap[d.provinceCode].id },
      create: {
        name: d.name,
        code: d.code,
        provinceId: provinceMap[d.provinceCode].id,
      },
    });
    districtMap[d.code] = district;
  }
  console.log(`   ✅ ${DISTRICTS.length} districts`);

  // 3. Police Stations
  console.log('🏢 Seeding police stations...');
  const stationMap = {};
  for (const s of POLICE_STATIONS) {
    const station = await prisma.policeStation.upsert({
      where: { code: s.code },
      update: { name: s.name, address: s.address, contact: s.contact },
      create: {
        name: s.name,
        code: s.code,
        address: s.address,
        contact: s.contact,
        districtId: districtMap[s.districtCode].id,
      },
    });
    stationMap[s.code] = station;
  }
  console.log(`   ✅ ${POLICE_STATIONS.length} police stations`);

  // 4. Admin Users
  console.log('👮 Seeding admin users...');
  const password = await bcrypt.hash('Admin@1234', 12);
  const devicePassword = await bcrypt.hash('Device@5678', 12);

  const adminUsers = [
    {
      username: 'hq.admin',
      email: 'hq.admin@police.lk',
      fullName: 'HQ Administrator',
      role: 'HQ_ADMIN',
    },
    {
      username: 'wp.admin',
      email: 'wp.admin@police.lk',
      fullName: 'Western Province Admin',
      role: 'PROVINCIAL_ADMIN',
      provinceId: provinceMap['WP'].id,
    },
    {
      username: 'cp.admin',
      email: 'cp.admin@police.lk',
      fullName: 'Central Province Admin',
      role: 'PROVINCIAL_ADMIN',
      provinceId: provinceMap['CP'].id,
    },
    {
      username: 'sp.admin',
      email: 'sp.admin@police.lk',
      fullName: 'Southern Province Admin',
      role: 'PROVINCIAL_ADMIN',
      provinceId: provinceMap['SP'].id,
    },
    {
      username: 'cmb.officer',
      email: 'cmb.officer@police.lk',
      fullName: 'Colombo District Officer',
      role: 'DISTRICT_OFFICER',
      provinceId: provinceMap['WP'].id,
      districtId: districtMap['CMB'].id,
    },
    {
      username: 'kdy.officer',
      email: 'kdy.officer@police.lk',
      fullName: 'Kandy District Officer',
      role: 'DISTRICT_OFFICER',
      provinceId: provinceMap['CP'].id,
      districtId: districtMap['KDY'].id,
    },
    {
      username: 'gle.officer',
      email: 'gle.officer@police.lk',
      fullName: 'Galle District Officer',
      role: 'DISTRICT_OFFICER',
      provinceId: provinceMap['SP'].id,
      districtId: districtMap['GLE'].id,
    },
    {
      username: 'cmb.fort.sgt',
      email: 'cmb.fort.sgt@police.lk',
      fullName: 'Sgt. Nimal Perera',
      role: 'STATION_OFFICER',
      provinceId: provinceMap['WP'].id,
      districtId: districtMap['CMB'].id,
      policeStationId: stationMap['CMB-FORT'].id,
    },
    {
      username: 'kdy.city.sgt',
      email: 'kdy.city.sgt@police.lk',
      fullName: 'Sgt. Kamal Bandara',
      role: 'STATION_OFFICER',
      provinceId: provinceMap['CP'].id,
      districtId: districtMap['KDY'].id,
      policeStationId: stationMap['KDY-CTY'].id,
    },
  ];

  for (const u of adminUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, passwordHash: password },
    });
  }
  console.log(`   ✅ ${adminUsers.length} admin/officer users`);

  // 5. Devices + Vehicles + Device Users
  console.log('🚗 Seeding 200 devices, vehicles, and device users...');

  const districtCodes = Object.keys(districtMap);
  let vehicleCount = 0;

  for (let i = 1; i <= 200; i++) {
    const districtCode = districtCodes[(i - 1) % districtCodes.length];
    const district = districtMap[districtCode];
    const province = Object.values(provinceMap).find((p) => {
      const distObj = DISTRICTS.find((d) => d.code === districtCode);
      return p.code === distObj?.provinceCode;
    });
    const provincePrefix = province
      ? PROVINCE_PREFIXES[province.code]?.[0] || province.code
      : 'WP';

    const serialNumber = `SN-TT-${pad(i, 5)}`;
    const regNumber = generateRegNumber(provincePrefix, i);
    const driverName = `${pick(DRIVER_FIRST_NAMES)} ${pick(DRIVER_LAST_NAMES)}`;
    const driverNic = generateNic(i);
    const deviceUsername = `device.${serialNumber.toLowerCase().replace(/-/g, '.')}`;

    // Check/create device
    let device = await prisma.device.findUnique({ where: { serialNumber } });
    if (!device) {
      device = await prisma.device.create({
        data: {
          serialNumber,
          model: pick([
            'GT06N',
            'TK103B',
            'GL300',
            'Concox AT4',
            'Queclink GV300',
          ]),
          firmwareVersion: `${rand(2, 4)}.${rand(0, 9)}.${rand(0, 9)}`,
          simIccid: `8994101121900${pad(i, 7)}`,
          status: 'UNASSIGNED',
        },
      });
    }

    // Check/create vehicle
    let vehicle = await prisma.vehicle.findUnique({
      where: { registrationNumber: regNumber },
    });
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          registrationNumber: regNumber,
          driverName,
          driverNic,
          driverContact: `+947${rand(10000000, 99999999)}`,
          status: 'ACTIVE',
          districtId: district.id,
        },
      });
    }

    // Assign device to vehicle (if not already)
    if (device.status === 'UNASSIGNED' && !vehicle.deviceId) {
      await prisma.$transaction([
        prisma.device.update({
          where: { id: device.id },
          data: { status: 'ASSIGNED' },
        }),
        prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { deviceId: device.id },
        }),
      ]);
    }

    // Create device user account (username = device serial number)
    await prisma.user.upsert({
      where: { username: deviceUsername },
      update: {},
      create: {
        username: deviceUsername,
        email: `${deviceUsername}@device.police.lk`,
        fullName: `GPS Device ${serialNumber}`,
        passwordHash: devicePassword,
        role: 'DEVICE',
        isActive: true,
      },
    });

    vehicleCount++;
    if (i % 50 === 0) {
      console.log(`   ... ${i}/200 vehicles seeded`);
    }
  }

  console.log(`   ✅ ${vehicleCount} vehicles, devices, and device users`);
  console.log('\n✅ Database seed complete!\n');
  console.log('📋 Default credentials:');
  console.log('   HQ Admin:      hq.admin / Admin@1234');
  console.log('   Province Admin: wp.admin / Admin@1234');
  console.log('   District Off:  cmb.officer / Admin@1234');
  console.log('   Station Off:   cmb.fort.sgt / Admin@1234');
  console.log('   Device users:  device.sn-tt-00001 / Device@5678');
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

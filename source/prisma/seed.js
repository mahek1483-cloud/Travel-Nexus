/**
 * Travel Nexus - Prisma Database Seeder
 * Seeds default administrative accounts, demo boutique listings, and verified reviews.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Travel Nexus database seed...');

  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const hostHash = await bcrypt.hash('host123', salt);
  const travelerHash = await bcrypt.hash('traveler123', salt);

  // 1. Seed Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@travelnexus.app' },
    update: {},
    create: {
      name: 'Platform Administrator',
      email: 'admin@travelnexus.app',
      passwordHash: adminHash,
      role: 'admin'
    }
  });

  const hostSharma = await prisma.user.upsert({
    where: { email: 'sharma.homestays@gmail.com' },
    update: {},
    create: {
      name: 'Tenzing & Meera Sharma',
      email: 'sharma.homestays@gmail.com',
      passwordHash: hostHash,
      role: 'host'
    }
  });

  const hostAmmini = await prisma.user.upsert({
    where: { email: 'ammini.kitchen@gmail.com' },
    update: {},
    create: {
      name: 'Ammini Kurien',
      email: 'ammini.kitchen@gmail.com',
      passwordHash: hostHash,
      role: 'host'
    }
  });

  const travelerUser = await prisma.user.upsert({
    where: { email: 'traveler@travelnexus.app' },
    update: {},
    create: {
      name: 'Aarav Sharma',
      email: 'traveler@travelnexus.app',
      passwordHash: travelerHash,
      role: 'traveler'
    }
  });

  console.log('✅ Seeded users (Admin, Hosts, Traveler)');

  // 2. Seed Listings
  const listing1 = await prisma.listing.upsert({
    where: { id: 'listing-seed-1' },
    update: {},
    create: {
      id: 'listing-seed-1',
      type: 'hotel',
      businessName: 'Kullu Whispering Deodars Estate',
      tagline: 'Eco-sanctuary with heated cedar suites overlooking Solang pass',
      description: 'Nestled in ancient pine groves, our family estate features handcrafted timber suites, solar heating, and farm-to-hearth organic Himachali feasts.',
      address: 'Naggar Road, Kullu Valley, Himachal Pradesh',
      lat: 32.1462,
      lng: 77.1643,
      priceMin: 4500,
      priceMax: 9000,
      specialty: 'Guided alpine foraging hikes & private stargazing deck',
      photos: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?auto=format&fit=crop&w=900&q=80'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      hostId: hostSharma.id,
      hostName: hostSharma.name,
      hostEmail: hostSharma.email,
      status: 'pending'
    }
  });

  const listing2 = await prisma.listing.upsert({
    where: { id: 'listing-seed-2' },
    update: {},
    create: {
      id: 'listing-seed-2',
      type: 'dining',
      businessName: 'Spice Coast Claypot Kitchen',
      tagline: 'Ancestral Malabar seafood curries simmered in earthen handi pots',
      description: 'Overlooking the tranquil backwaters, chef Ammini serves morning-catch Karimeen pollichathu and wood-fired coconut hoppers using 100-year-old family spice masalas.',
      address: 'Vembanad Lakefront, Kumarakom, Kerala',
      lat: 9.6175,
      lng: 76.4301,
      priceMin: 600,
      priceMax: 1500,
      dishes: [
        { name: 'Karimeen Pollichathu in Banana Leaf', price: 650, dietary: 'seafood' },
        { name: 'Alleppey Green Mango Curry', price: 420, dietary: 'vegan' },
        { name: 'Steamed Appams with Cardamom Coconut Milk', price: 280, dietary: 'veg' }
      ],
      photos: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80'
      ],
      videoUrl: '',
      hostId: hostAmmini.id,
      hostName: hostAmmini.name,
      hostEmail: hostAmmini.email,
      status: 'approved'
    }
  });

  console.log('✅ Seeded demo listings');

  // 3. Seed Reviews
  await prisma.review.upsert({
    where: { id: 'rev-seed-1' },
    update: {},
    create: {
      id: 'rev-seed-1',
      listingId: listing1.id,
      author: 'Priya Narayanan',
      rating: 5.0,
      date: 'October 2024',
      verifiedTraveler: true,
      comment: 'Staying here was the highlight of our journey across India. Waking up to organic chai and listening to the host describe the architectural history of the estate was truly unforgettable.',
      photos: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80'],
      hostResponse: 'Dhanyavaad Priya ji! It was our joy to share our family recipes and heritage with you.'
    }
  });

  await prisma.review.upsert({
    where: { id: 'rev-seed-2' },
    update: {},
    create: {
      id: 'rev-seed-2',
      listingId: listing1.id,
      author: 'Marcus Lindholm',
      rating: 4.9,
      date: 'December 2024',
      verifiedTraveler: true,
      comment: '100% authentic Indian hospitality. No corporate hotel feel whatsoever. Direct booking through Travel Nexus saved us nearly 20% compared to typical hotel booking apps.',
      photos: [],
      hostResponse: null
    }
  });

  console.log('✅ Seeded authentic traveler reviews');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

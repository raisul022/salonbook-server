import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { Service } from '../models/Service.js';
import { Appointment } from '../models/Appointment.js';
import { Transaction } from '../models/Transaction.js';

const sampleServices = [
  {
    serviceName: 'Signature Royal Haircut & Beard Grooming',
    category: 'Haircut & Styling',
    description: 'Precision haircut with tailored scissor work, hot towel treatment, soothing scalp massage, and beard sculpt with premium oils.',
    price: 45,
    duration: 50,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.9,
    reviewsCount: 38,
  },
  {
    serviceName: 'Balayage & Dimensional Hair Highlights',
    category: 'Hair Coloring',
    description: 'Bespoke hand-painted balayage highlights delivering radiant, sun-kissed natural tones infused with bond-protecting olaplex treatment.',
    price: 130,
    duration: 120,
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 5.0,
    reviewsCount: 24,
  },
  {
    serviceName: 'Brazilian Keratin Smoothing Therapy',
    category: 'Hair Treatment',
    description: 'Intense anti-frizz smoothing treatment sealing dry cuticles, imparting mirror-like silkiness and lustrous shine that lasts up to 4 months.',
    price: 110,
    duration: 90,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.8,
    reviewsCount: 19,
  },
  {
    serviceName: 'Hydra-Glow Deep Cleansing Facial',
    category: 'Facial & Skincare',
    description: 'Multi-step clinical facial featuring gentle ultrasonic peel, vacuum pore extraction, hyaluronic acid infusion, and cryogenic cooling mask.',
    price: 85,
    duration: 60,
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.9,
    reviewsCount: 42,
  },
  {
    serviceName: 'Bridal Glam & Evening Makeup Artistry',
    category: 'Makeup',
    description: 'Full-glam couture makeup session using luxury water-resistant products, custom silk eyelash application, and luminous setting spray.',
    price: 95,
    duration: 75,
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 5.0,
    reviewsCount: 31,
  },
  {
    serviceName: 'Luxury Gel Manicure & Aroma Pedicure',
    category: 'Manicure & Pedicure',
    description: 'Exfoliating rose-sea-salt scrub, cuticle therapy, relaxing hot stone foot massage, and chip-free organic gel polish with high-gloss finish.',
    price: 65,
    duration: 65,
    image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.7,
    reviewsCount: 29,
  },
  {
    serviceName: 'Aromatherapy Swedish Full Body Massage',
    category: 'Spa & Massage',
    description: 'Deeply relaxing Swedish full body massage using warm organic botanical essential oils to release deep muscle tension and restore serenity.',
    price: 90,
    duration: 60,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 5.0,
    reviewsCount: 56,
  },
  {
    serviceName: 'Collagen Renewal Anti-Aging Eye Treatment',
    category: 'Facial & Skincare',
    description: 'Targeted micro-current peptide infusion and chilled jade roller drainage to eliminate puffiness, dark circles, and fine expression lines.',
    price: 55,
    duration: 40,
    image: 'https://images.unsplash.com/photo-1512290900672-1f5be57dbe33?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.8,
    reviewsCount: 15,
  },
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Create or update Admin User
    const adminEmail = ENV.ADMIN_EMAIL.toLowerCase();
    let admin = await User.findOne({ email: adminEmail });

    const adminSalt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash(ENV.ADMIN_PASSWORD, adminSalt);

    if (!admin) {
      admin = await User.create({
        name: ENV.ADMIN_NAME,
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin',
        isBlocked: false,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        phone: '+1 (555) 019-2834',
      });
      console.log(`✅ Admin account created: ${adminEmail}`);
    } else {
      admin.role = 'admin';
      admin.password = hashedAdminPassword;
      admin.isBlocked = false;
      await admin.save();
      console.log(`✅ Admin account updated: ${adminEmail}`);
    }

    // 2. Create demo Customer
    const customerEmail = 'customer@salonbook.com';
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      const customerSalt = await bcrypt.genSalt(10);
      const hashedCustPassword = await bcrypt.hash('Customer123!', customerSalt);
      customer = await User.create({
        name: 'Jessica Miller',
        email: customerEmail,
        password: hashedCustPassword,
        role: 'customer',
        isBlocked: false,
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        phone: '+1 (555) 234-5678',
      });
      console.log(`✅ Demo customer account created: ${customerEmail}`);
    }

    // 3. Seed Services
    const existingServicesCount = await Service.countDocuments();
    if (existingServicesCount === 0) {
      await Service.insertMany(sampleServices);
      console.log(`✅ Seeded ${sampleServices.length} initial salon services.`);
    } else {
      console.log(`ℹ️ Services collection already has ${existingServicesCount} records.`);
    }

    console.log('\n=======================================');
    console.log('🎉 Seeding successfully completed!');
    console.log(`Admin Email: ${ENV.ADMIN_EMAIL}`);
    console.log(`Admin Password: ${ENV.ADMIN_PASSWORD}`);
    console.log(`Customer Email: customer@salonbook.com`);
    console.log(`Customer Password: Customer123!`);
    console.log('=======================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { Service } from '../models/Service.js';
import { Appointment } from '../models/Appointment.js';
import { Transaction } from '../models/Transaction.js';

const sampleServices = [
  {
    serviceName: 'Executive Royal Haircut & Beard Sculpt',
    category: 'Haircut & Styling',
    description: 'Precision shear & clipper haircut tailored to your head shape, hot towel ritual, soothing scalp massage, and beard sculpt with premium organic oils.',
    price: 45,
    duration: 50,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.9,
    reviewsCount: 48,
  },
  {
    serviceName: 'Men\'s Natural Hair Toning & Grey Blending',
    category: 'Hair Coloring',
    description: 'Subtle, natural demi-permanent grey blending and modern matte toning designed specifically for men to restore a youthful, refined finish.',
    price: 65,
    duration: 45,
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 5.0,
    reviewsCount: 34,
  },
  {
    serviceName: 'Keratin Scalp Therapy & Fade Finish',
    category: 'Hair Treatment',
    description: 'Deep follicle detox with invigorating tea tree scalp scrub, keratin cuticle nourishment, and a clean razor skin-fade taper finish.',
    price: 55,
    duration: 60,
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.8,
    reviewsCount: 29,
  },
  {
    serviceName: 'Gentlemen\'s Charcoal Deep Pore Facial',
    category: 'Facial & Skincare',
    description: 'Targeted clinical facial for men with ultrasonic pore extraction, activated bamboo charcoal mask, beard conditioning, and cold jade roller finish.',
    price: 75,
    duration: 50,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.9,
    reviewsCount: 52,
  },
  {
    serviceName: 'Groom\'s Wedding Day Grooming & Styling Package',
    category: 'Makeup',
    description: 'Complete high-profile photoshoot prep: precision cut, beard alignment, anti-shine HD camera complexion prep, and luxury cologne spray.',
    price: 95,
    duration: 75,
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 5.0,
    reviewsCount: 41,
  },
  {
    serviceName: 'Executive Hand & Foot Reflexology Grooming',
    category: 'Manicure & Pedicure',
    description: 'Therapeutic nail shaping, cuticle conditioning, exfoliating sea-salt foot scrub, and relaxing hot stone calf and hand massage in private lounge.',
    price: 60,
    duration: 55,
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.7,
    reviewsCount: 26,
  },
  {
    serviceName: 'Deep Tissue Swedish Back & Shoulder Massage',
    category: 'Spa & Massage',
    description: 'Intense therapeutic massage focused on releasing upper back tension, stiff neck, and shoulder knots using warm organic eucalyptus oils.',
    price: 85,
    duration: 60,
    image: 'https://images.unsplash.com/photo-1650044252595-cacd425982ff?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 5.0,
    reviewsCount: 63,
  },
  {
    serviceName: 'Royal Hot Towel Straight Razor Shave',
    category: 'Haircut & Styling',
    description: 'Traditional multi-step hot towel treatment with pre-shave badger brush lather, vintage straight razor shave, cold towel pore close, and aftershave balm.',
    price: 40,
    duration: 35,
    image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.9,
    reviewsCount: 57,
  },
  {
    serviceName: 'Artisan Scissor Cut & Signature Blowout',
    category: 'Haircut & Styling',
    description: 'Master styling with sectional shear sculpting, texturizing taper, invigorating scalp wash, and matte clay finish.',
    price: 50,
    duration: 45,
    image: 'https://images.unsplash.com/photo-1593702295094-aea22597af65?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 5.0,
    reviewsCount: 42,
  },
  {
    serviceName: 'Invigorating Tea Tree Scalp Mask & Follicle Detox',
    category: 'Hair Treatment',
    description: 'Clinical exfoliating treatment utilizing cooling organic tea tree extract and botanical peptides to stimulate microcirculation and strengthen roots.',
    price: 65,
    duration: 50,
    image: 'https://images.unsplash.com/photo-1590540179852-2110a54f813a?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.8,
    reviewsCount: 36,
  },
  {
    serviceName: 'Bespoke Texture Sculpt & Razor Precision Lineup',
    category: 'Haircut & Styling',
    description: 'Specialized curly and textured hair sculpting combined with laser-straight hairline razor edging and beard boundary definition.',
    price: 55,
    duration: 50,
    image: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.9,
    reviewsCount: 39,
  },
  {
    serviceName: 'Gentlemen\'s Matte Styling & Clay Grooming Bar',
    category: 'Hair Treatment',
    description: 'Consultation on styling geometry, premium apothecary pomade application, blow-dry volume lift, and finished portrait alignment.',
    price: 35,
    duration: 30,
    image: 'https://images.unsplash.com/photo-1587909209111-5097ee578ec3?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    rating: 4.7,
    reviewsCount: 28,
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
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        phone: '+1 (555) 019-2834',
      });
      console.log(`✅ Admin account created: ${adminEmail}`);
    } else {
      admin.role = 'admin';
      admin.password = hashedAdminPassword;
      admin.isBlocked = false;
      admin.image = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';
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
        name: 'Alexander Hayes',
        email: customerEmail,
        password: hashedCustPassword,
        role: 'customer',
        isBlocked: false,
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        phone: '+1 (555) 234-5678',
      });
      console.log(`✅ Demo customer account created: ${customerEmail}`);
    } else {
      customer.name = 'Alexander Hayes';
      customer.image = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80';
      await customer.save();
    }

    // 3. Refresh Services with Men's Grooming Collection
    await Service.deleteMany({});
    await Service.insertMany(sampleServices);
    console.log(`✅ Seeded ${sampleServices.length} men's grooming & styling services.`);

    console.log('\n=======================================');
    console.log('🎉 Seeding successfully completed!');
    console.log(`Admin Email: ${ENV.ADMIN_EMAIL}`);
    console.log(`Customer Email: customer@salonbook.com`);
    console.log('=======================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();

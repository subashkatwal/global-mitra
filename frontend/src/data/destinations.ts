import type { Place } from '@/types';

export const destinationsData: Place[] = [
  {
    id: '1',
    name: 'Boudhanath Stupa',
    description: 'One of the largest spherical stupas in Nepal and a major center of Tibetan Buddhism. The all-seeing eyes of Buddha watch over the city from this UNESCO World Heritage site.',
    location: {
      country: 'Nepal',
      city: 'Kathmandu',
      coordinates: { lat: 27.7215, lng: 85.3620 }
    },
    images: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.8,
    reviewCount: 3245,
    priceRange: '$',
    bestSeason: 'Oct-Nov',
    avgCostPerDay: 35,
    safetyScore: 9.0,
    crowdLevel: 'moderate',
    weather: { temp: 22, condition: 'Clear' },
    tags: ['buddhism', 'stupa', 'culture', 'spiritual', 'tibetan', 'unesco'],
    isVerified: true,
    verificationCount: 245,
    reports: [],
    createdAt: new Date('2023-01-01')
  },
  {
    id: '2',
    name: 'Swayambhunath Temple',
    description: 'Ancient hilltop temple known as the Monkey Temple, offering panoramic views of Kathmandu Valley. A sacred site for both Buddhists and Hindus with 365 steps to the top.',
    location: {
      country: 'Nepal',
      city: 'Kathmandu',
      coordinates: { lat: 27.7149, lng: 85.2904 }
    },
    images: [
      'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.9,
    reviewCount: 4123,
    priceRange: '$',
    bestSeason: 'Oct-Nov',
    avgCostPerDay: 30,
    safetyScore: 9.2,
    crowdLevel: 'moderate',
    weather: { temp: 23, condition: 'Sunny' },
    tags: ['temple', 'monkey-temple', 'hiking', 'views', 'buddhism', 'hinduism'],
    isVerified: true,
    verificationCount: 312,
    reports: [],
    createdAt: new Date('2023-01-02')
  },
  {
    id: '3',
    name: 'Phewa Lake & Lakeside',
    description: 'Serene freshwater lake with the Tal Barahi Temple on an island. The surrounding Lakeside area is the tourist hub of Pokhara with boating, dining, and stunning Annapurna views.',
    location: {
      country: 'Nepal',
      city: 'Pokhara',
      coordinates: { lat: 28.2154, lng: 83.9453 }
    },
    images: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1516834474-48c0abc2a902?w=800&h=600&fit=crop'
    ],
    category: 'nature',
    rating: 4.8,
    reviewCount: 2890,
    priceRange: '$',
    bestSeason: 'Oct-Apr',
    avgCostPerDay: 45,
    safetyScore: 9.3,
    crowdLevel: 'moderate',
    weather: { temp: 24, condition: 'Partly Cloudy' },
    tags: ['lake', 'boating', 'annapurna', 'relaxation', 'temple', 'views'],
    isVerified: true,
    verificationCount: 278,
    reports: [],
    createdAt: new Date('2023-01-03')
  },
  {
    id: '4',
    name: 'Everest Base Camp',
    description: 'The ultimate trekking destination offering breathtaking Himalayan views and a life-changing adventure for serious hikers. Gateway to the world\'s highest peak.',
    location: {
      country: 'Nepal',
      city: 'Solukhumbu',
      coordinates: { lat: 28.0024, lng: 86.8525 }
    },
    images: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1516834474-48c0abc2a902?w=800&h=600&fit=crop'
    ],
    category: 'mountain',
    rating: 4.9,
    reviewCount: 2156,
    priceRange: '$$',
    bestSeason: 'Mar-May',
    avgCostPerDay: 85,
    safetyScore: 7.5,
    crowdLevel: 'moderate',
    weather: { temp: -5, condition: 'Snow' },
    tags: ['trekking', 'himalaya', 'adventure', 'mountains', 'camping', 'everest'],
    isVerified: true,
    verificationCount: 356,
    reports: [],
    createdAt: new Date('2023-01-04')
  },
  {
    id: '5',
    name: 'Chitwan National Park',
    description: 'UNESCO World Heritage site and one of Asia\'s best wildlife destinations. Home to one-horned rhinos, Bengal tigers, elephants, and over 600 bird species in subtropical jungle.',
    location: {
      country: 'Nepal',
      city: 'Sauraha',
      coordinates: { lat: 27.5291, lng: 84.3542 }
    },
    images: [
      'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&h=600&fit=crop'
    ],
    category: 'nature',
    rating: 4.8,
    reviewCount: 1876,
    priceRange: '$$',
    bestSeason: 'Oct-Mar',
    avgCostPerDay: 95,
    safetyScore: 8.5,
    crowdLevel: 'moderate',
    weather: { temp: 26, condition: 'Sunny' },
    tags: ['safari', 'wildlife', 'jungle', 'rhino', 'tiger', 'unesco', 'birding'],
    isVerified: true,
    verificationCount: 198,
    reports: [],
    createdAt: new Date('2023-01-05')
  },
  {
    id: '6',
    name: 'Pashupatinath Temple',
    description: 'Sacred Hindu temple complex and cremation site on the banks of Bagmati River. One of the most important Shiva temples and a UNESCO World Heritage site.',
    location: {
      country: 'Nepal',
      city: 'Kathmandu',
      coordinates: { lat: 27.7104, lng: 85.3488 }
    },
    images: [
      'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.6,
    reviewCount: 2156,
    priceRange: '$',
    bestSeason: 'Oct-Nov',
    avgCostPerDay: 25,
    safetyScore: 8.5,
    crowdLevel: 'packed',
    weather: { temp: 24, condition: 'Sunny' },
    tags: ['hinduism', 'temple', 'culture', 'spiritual', 'unesco', 'river'],
    isVerified: true,
    verificationCount: 189,
    reports: [],
    createdAt: new Date('2023-01-06')
  },
  {
    id: '7',
    name: 'Annapurna Base Camp',
    description: 'Spectacular trekking destination offering 360-degree views of the Annapurna massif. A bucket-list adventure through diverse landscapes and traditional villages.',
    location: {
      country: 'Nepal',
      city: 'Gandaki',
      coordinates: { lat: 28.5308, lng: 83.8784 }
    },
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1516834474-48c0abc2a902?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
    ],
    category: 'mountain',
    rating: 4.9,
    reviewCount: 3421,
    priceRange: '$$',
    bestSeason: 'Mar-May',
    avgCostPerDay: 65,
    safetyScore: 8.0,
    crowdLevel: 'moderate',
    weather: { temp: 5, condition: 'Clear' },
    tags: ['trekking', 'annapurna', 'mountains', 'sunrise', 'himalaya', 'adventure'],
    isVerified: true,
    verificationCount: 298,
    reports: [],
    createdAt: new Date('2023-01-07')
  },
  {
    id: '8',
    name: 'Bhaktapur Durbar Square',
    description: 'Medieval royal palace complex showcasing the finest Newari architecture. Famous for the 55-Window Palace, Golden Gate, and Nyatapola Temple. UNESCO World Heritage site.',
    location: {
      country: 'Nepal',
      city: 'Bhaktapur',
      coordinates: { lat: 27.6722, lng: 85.4278 }
    },
    images: [
      'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.8,
    reviewCount: 1654,
    priceRange: '$',
    bestSeason: 'Oct-Nov',
    avgCostPerDay: 40,
    safetyScore: 9.1,
    crowdLevel: 'moderate',
    weather: { temp: 23, condition: 'Sunny' },
    tags: ['architecture', 'unesco', 'palace', 'temple', 'newari', 'culture'],
    isVerified: true,
    verificationCount: 167,
    reports: [],
    createdAt: new Date('2023-01-08')
  },
  {
    id: '9',
    name: 'Patan Durbar Square',
    description: 'Ancient royal complex in the heart of Lalitpur featuring exquisite Krishna Mandir and traditional craftsmanship. A masterpiece of Newari art and UNESCO site.',
    location: {
      country: 'Nepal',
      city: 'Lalitpur',
      coordinates: { lat: 27.6733, lng: 85.3252 }
    },
    images: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.7,
    reviewCount: 1432,
    priceRange: '$',
    bestSeason: 'Oct-Nov',
    avgCostPerDay: 35,
    safetyScore: 9.0,
    crowdLevel: 'light',
    weather: { temp: 24, condition: 'Clear' },
    tags: ['architecture', 'museum', 'unesco', 'temple', 'art', 'newari'],
    isVerified: true,
    verificationCount: 134,
    reports: [],
    createdAt: new Date('2023-01-09')
  },
  {
    id: '10',
    name: 'Sarangkot Viewpoint',
    description: 'Popular hilltop viewpoint offering stunning sunrise views over the Annapurna range and Pokhara Valley. The launch site for paragliding adventures.',
    location: {
      country: 'Nepal',
      city: 'Pokhara',
      coordinates: { lat: 28.2006, lng: 83.9596 }
    },
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1516834474-48c0abc2a902?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
    ],
    category: 'mountain',
    rating: 4.8,
    reviewCount: 2341,
    priceRange: '$',
    bestSeason: 'Oct-Apr',
    avgCostPerDay: 50,
    safetyScore: 8.8,
    crowdLevel: 'packed',
    weather: { temp: 18, condition: 'Clear' },
    tags: ['sunrise', 'paragliding', 'annapurna', 'views', 'photography', 'himalaya'],
    isVerified: true,
    verificationCount: 189,
    reports: [],
    createdAt: new Date('2023-01-10')
  },
  {
    id: '11',
    name: 'Nagarkot',
    description: 'Hill station famous for panoramic Himalayan views including Mount Everest on clear days. A peaceful retreat from Kathmandu with hiking trails and sunrise viewpoints.',
    location: {
      country: 'Nepal',
      city: 'Bhaktapur',
      coordinates: { lat: 27.7179, lng: 85.5245 }
    },
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1516834474-48c0abc2a902?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
    ],
    category: 'mountain',
    rating: 4.6,
    reviewCount: 1234,
    priceRange: '$',
    bestSeason: 'Oct-Apr',
    avgCostPerDay: 55,
    safetyScore: 9.2,
    crowdLevel: 'light',
    weather: { temp: 16, condition: 'Misty' },
    tags: ['sunrise', 'everest', 'hiking', 'views', 'resort', 'peaceful'],
    isVerified: true,
    verificationCount: 145,
    reports: [],
    createdAt: new Date('2023-01-11')
  },
  {
    id: '12',
    name: 'World Peace Pagoda',
    description: 'White Buddhist stupa perched on a hill overlooking Phewa Lake and the Annapurna range. Built by Japanese monks, accessible by boat and hike or drive.',
    location: {
      country: 'Nepal',
      city: 'Pokhara',
      coordinates: { lat: 28.2000, lng: 83.9444 }
    },
    images: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.7,
    reviewCount: 1876,
    priceRange: 'free',
    bestSeason: 'Oct-Apr',
    avgCostPerDay: 30,
    safetyScore: 9.3,
    crowdLevel: 'moderate',
    weather: { temp: 22, condition: 'Sunny' },
    tags: ['buddhism', 'stupa', 'views', 'hiking', 'peace', 'photography'],
    isVerified: true,
    verificationCount: 156,
    reports: [],
    createdAt: new Date('2023-01-12')
  },
  {
    id: '13',
    name: 'Langtang Valley',
    description: 'Beautiful trekking region north of Kathmandu offering alpine scenery, Tamang culture, and accessible Himalayan views without the crowds of Everest or Annapurna.',
    location: {
      country: 'Nepal',
      city: 'Rasuwa',
      coordinates: { lat: 28.3323, lng: 85.5142 }
    },
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1516834474-48c0abc2a902?w=800&h=600&fit=crop'
    ],
    category: 'mountain',
    rating: 4.8,
    reviewCount: 876,
    priceRange: '$$',
    bestSeason: 'Mar-May',
    avgCostPerDay: 55,
    safetyScore: 8.2,
    crowdLevel: 'light',
    weather: { temp: 10, condition: 'Partly Cloudy' },
    tags: ['trekking', 'valley', 'culture', 'glaciers', 'tamang', 'nature'],
    isVerified: true,
    verificationCount: 98,
    reports: [],
    createdAt: new Date('2023-01-13')
  },
  {
    id: '14',
    name: 'Kathmandu Durbar Square',
    description: 'Historic royal palace complex in the heart of old Kathmandu. Features the Hanuman Dhoka Palace, Kumari Ghar (Living Goddess), and traditional Newari architecture.',
    location: {
      country: 'Nepal',
      city: 'Kathmandu',
      coordinates: { lat: 27.7041, lng: 85.3066 }
    },
    images: [
      'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.6,
    reviewCount: 2890,
    priceRange: '$',
    bestSeason: 'Oct-Nov',
    avgCostPerDay: 40,
    safetyScore: 8.5,
    crowdLevel: 'packed',
    weather: { temp: 25, condition: 'Sunny' },
    tags: ['palace', 'unesco', 'kumari', 'culture', 'architecture', 'history'],
    isVerified: true,
    verificationCount: 234,
    reports: [],
    createdAt: new Date('2023-01-14')
  },
  {
    id: '15',
    name: 'Rara Lake',
    description: 'Nepal\'s largest lake located in remote northwestern Nepal. Crystal blue waters surrounded by pine forests and snow-capped peaks. A hidden gem for nature lovers.',
    location: {
      country: 'Nepal',
      city: 'Mugu',
      coordinates: { lat: 29.5383, lng: 82.0856 }
    },
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1516834474-48c0abc2a902?w=800&h=600&fit=crop'
    ],
    category: 'nature',
    rating: 4.9,
    reviewCount: 567,
    priceRange: '$$',
    bestSeason: 'Apr-May',
    avgCostPerDay: 75,
    safetyScore: 8.0,
    crowdLevel: 'empty',
    weather: { temp: 15, condition: 'Clear' },
    tags: ['lake', 'remote', 'camping', 'trekking', 'pristine', 'national-park'],
    isVerified: true,
    verificationCount: 67,
    reports: [],
    createdAt: new Date('2023-01-15')
  },
  {
    id: '16',
    name: 'Changu Narayan Temple',
    description: 'One of the oldest Hindu temples in Nepal, dating back to the 4th century. Located on a hilltop near Bhaktapur with intricate wood and stone carvings. UNESCO World Heritage site.',
    location: {
      country: 'Nepal',
      city: 'Bhaktapur',
      coordinates: { lat: 27.7176, lng: 85.4276 }
    },
    images: [
      'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.7,
    reviewCount: 876,
    priceRange: '$',
    bestSeason: 'Oct-Nov',
    avgCostPerDay: 30,
    safetyScore: 9.0,
    crowdLevel: 'light',
    weather: { temp: 22, condition: 'Sunny' },
    tags: ['temple', 'ancient', 'unesco', 'carvings', 'vishnu', 'history'],
    isVerified: true,
    verificationCount: 123,
    reports: [],
    createdAt: new Date('2023-01-16')
  },
  {
    id: '17',
    name: 'Bandipur',
    description: 'Preserved hilltop Newari town with 18th-century architecture and panoramic views of the Himalayas. A living museum of traditional culture without vehicle traffic.',
    location: {
      country: 'Nepal',
      city: 'Tanahun',
      coordinates: { lat: 27.9293, lng: 84.4069 }
    },
    images: [
      'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=600&fit=crop'
    ],
    category: 'city',
    rating: 4.6,
    reviewCount: 987,
    priceRange: '$',
    bestSeason: 'Oct-Apr',
    avgCostPerDay: 45,
    safetyScore: 9.4,
    crowdLevel: 'light',
    weather: { temp: 20, condition: 'Sunny' },
    tags: ['heritage', 'newari', 'views', 'walking', 'culture', 'peaceful'],
    isVerified: true,
    verificationCount: 112,
    reports: [],
    createdAt: new Date('2023-01-17')
  },
  {
    id: '18',
    name: 'Manang Valley',
    description: 'High-altitude valley on the Annapurna Circuit with Tibetan-influenced culture, ancient monasteries, and dramatic mountain scenery. Gateway to Thorong La Pass.',
    location: {
      country: 'Nepal',
      city: 'Manang',
      coordinates: { lat: 28.6667, lng: 84.0167 }
    },
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1516834474-48c0abc2a902?w=800&h=600&fit=crop'
    ],
    category: 'mountain',
    rating: 4.8,
    reviewCount: 654,
    priceRange: '$$',
    bestSeason: 'Mar-May',
    avgCostPerDay: 60,
    safetyScore: 7.8,
    crowdLevel: 'light',
    weather: { temp: 5, condition: 'Cold' },
    tags: ['trekking', 'tibetan', 'monastery', 'annapurna-circuit', 'mountains', 'culture'],
    isVerified: true,
    verificationCount: 89,
    reports: [],
    createdAt: new Date('2023-01-18')
  },
  {
    id: '19',
    name: 'Gosaikunda Lake',
    description: 'Sacred alpine lake at 4,380m altitude, important pilgrimage site for Hindus and Buddhists. Surrounded by rugged peaks and accessible via trekking from Dhunche.',
    location: {
      country: 'Nepal',
      city: 'Rasuwa',
      coordinates: { lat: 28.0833, lng: 85.4167 }
    },
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1516834474-48c0abc2a902?w=800&h=600&fit=crop'
    ],
    category: 'nature',
    rating: 4.9,
    reviewCount: 432,
    priceRange: '$$',
    bestSeason: 'Apr-May',
    avgCostPerDay: 50,
    safetyScore: 7.5,
    crowdLevel: 'light',
    weather: { temp: 2, condition: 'Cold' },
    tags: ['sacred', 'lake', 'pilgrimage', 'trekking', 'high-altitude', 'shiva'],
    isVerified: true,
    verificationCount: 76,
    reports: [],
    createdAt: new Date('2023-01-19')
  },
  {
    id: '20',
    name: 'Lumbini',
    description: 'Birthplace of Lord Buddha and UNESCO World Heritage site. Sacred garden with the Maya Devi Temple, ancient ruins, and monasteries built by Buddhist communities worldwide.',
    location: {
      country: 'Nepal',
      city: 'Lumbini',
      coordinates: { lat: 27.4696, lng: 83.2759 }
    },
    images: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.7,
    reviewCount: 1567,
    priceRange: '$',
    bestSeason: 'Oct-Mar',
    avgCostPerDay: 35,
    safetyScore: 9.1,
    crowdLevel: 'moderate',
    weather: { temp: 28, condition: 'Sunny' },
    tags: ['buddhism', 'pilgrimage', 'unesco', 'temple', 'spiritual', 'history'],
    isVerified: true,
    verificationCount: 198,
    reports: [],
    createdAt: new Date('2023-01-20')
  }
];

export const getPlaceById = (id: string): Place | undefined => {
  return destinationsData.find(place => place.id === id);
};

export const getTrendingPlaces = (limit: number = 6): Place[] => {
  return destinationsData
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit);
};

export const getPlacesByCategory = (category: string): Place[] => {
  return destinationsData.filter(place => place.category === category);
};

export const getHiddenGems = (limit: number = 4): Place[] => {
  return destinationsData
    .filter(place => place.crowdLevel === 'light' || place.crowdLevel === 'empty')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};
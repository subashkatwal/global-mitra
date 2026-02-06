import type { Place } from '@/types';

export const destinationsData: Place[] = [
  {
    id: '1',
    name: 'Tanah Lot Temple',
    description: 'Ancient sea temple perched on a rock formation, famous for its stunning sunset views and cultural significance in Balinese Hinduism.',
    location: {
      country: 'Indonesia',
      city: 'Bali',
      coordinates: { lat: -8.6215, lng: 115.0865 }
    },
    images: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.8,
    reviewCount: 2847,
    priceRange: '$',
    bestSeason: 'Apr-Oct',
    avgCostPerDay: 45,
    safetyScore: 9.2,
    crowdLevel: 'moderate',
    weather: { temp: 28, condition: 'Sunny' },
    tags: ['temple', 'sunset', 'culture', 'photography', 'hindu'],
    isVerified: true,
    verificationCount: 156,
    reports: [],
    createdAt: new Date('2023-01-01')
  },
  {
    id: '2',
    name: 'Fushimi Inari Shrine',
    description: 'Famous shrine known for its thousands of vermilion torii gates leading up Mount Inari. A must-visit for photographers and culture enthusiasts.',
    location: {
      country: 'Japan',
      city: 'Kyoto',
      coordinates: { lat: 34.9671, lng: 135.7727 }
    },
    images: [
      'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.9,
    reviewCount: 3421,
    priceRange: 'free',
    bestSeason: 'Mar-May',
    avgCostPerDay: 80,
    safetyScore: 9.8,
    crowdLevel: 'packed',
    weather: { temp: 18, condition: 'Partly Cloudy' },
    tags: ['shrine', 'hiking', 'culture', 'photography', 'torii-gates'],
    isVerified: true,
    verificationCount: 203,
    reports: [],
    createdAt: new Date('2023-01-02')
  },
  {
    id: '3',
    name: 'Oia Village',
    description: 'Iconic white-washed buildings with blue domes perched on volcanic cliffs. The most photographed spot in Santorini for its breathtaking sunsets.',
    location: {
      country: 'Greece',
      city: 'Santorini',
      coordinates: { lat: 36.4618, lng: 25.3753 }
    },
    images: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1613395877344-13d4c79e4284?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=600&fit=crop'
    ],
    category: 'beach',
    rating: 4.7,
    reviewCount: 2156,
    priceRange: '$$$',
    bestSeason: 'May-Oct',
    avgCostPerDay: 200,
    safetyScore: 9.5,
    crowdLevel: 'packed',
    weather: { temp: 24, condition: 'Sunny' },
    tags: ['sunset', 'romantic', 'views', 'photography', 'luxury'],
    isVerified: true,
    verificationCount: 178,
    reports: [],
    createdAt: new Date('2023-01-03')
  },
  {
    id: '4',
    name: 'Machu Picchu',
    description: 'Ancient Incan citadel set high in the Andes Mountains. One of the New Seven Wonders of the World and a bucket-list destination for adventurers.',
    location: {
      country: 'Peru',
      city: 'Cusco Region',
      coordinates: { lat: -13.1631, lng: -72.5450 }
    },
    images: [
      'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1509216242873-7786f446f465?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.9,
    reviewCount: 4521,
    priceRange: '$$',
    bestSeason: 'May-Sep',
    avgCostPerDay: 120,
    safetyScore: 8.8,
    crowdLevel: 'packed',
    weather: { temp: 16, condition: 'Cloudy' },
    tags: ['inca', 'hiking', 'history', 'wonder', 'mountains'],
    isVerified: true,
    verificationCount: 312,
    reports: [],
    createdAt: new Date('2023-01-04')
  },
  {
    id: '5',
    name: 'Everest Base Camp',
    description: 'The ultimate trekking destination offering breathtaking Himalayan views and a life-changing adventure for serious hikers.',
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
    rating: 4.8,
    reviewCount: 1876,
    priceRange: '$$',
    bestSeason: 'Mar-May',
    avgCostPerDay: 85,
    safetyScore: 7.5,
    crowdLevel: 'moderate',
    weather: { temp: -5, condition: 'Snow' },
    tags: ['trekking', 'himalaya', 'adventure', 'mountains', 'camping'],
    isVerified: true,
    verificationCount: 245,
    reports: [],
    createdAt: new Date('2023-01-05')
  },
  {
    id: '6',
    name: 'Table Mountain',
    description: 'Flat-topped mountain offering panoramic views of Cape Town and the Atlantic Ocean. A natural wonder and UNESCO World Heritage site.',
    location: {
      country: 'South Africa',
      city: 'Cape Town',
      coordinates: { lat: -33.9628, lng: 18.4098 }
    },
    images: [
      'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&h=600&fit=crop'
    ],
    category: 'nature',
    rating: 4.8,
    reviewCount: 2341,
    priceRange: '$',
    bestSeason: 'Oct-Mar',
    avgCostPerDay: 65,
    safetyScore: 8.5,
    crowdLevel: 'moderate',
    weather: { temp: 22, condition: 'Windy' },
    tags: ['views', 'hiking', 'cable-car', 'nature', 'photography'],
    isVerified: true,
    verificationCount: 189,
    reports: [],
    createdAt: new Date('2023-01-06')
  },
  {
    id: '7',
    name: 'Blue Lagoon',
    description: 'Geothermal spa with milky-blue mineral-rich waters surrounded by lava fields. The perfect relaxation spot in Iceland.',
    location: {
      country: 'Iceland',
      city: 'Grindavik',
      coordinates: { lat: 63.8804, lng: -22.4495 }
    },
    images: [
      'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1520769945061-0a448c463865?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&h=600&fit=crop'
    ],
    category: 'nature',
    rating: 4.6,
    reviewCount: 3124,
    priceRange: '$$$',
    bestSeason: 'Year-round',
    avgCostPerDay: 250,
    safetyScore: 9.5,
    crowdLevel: 'packed',
    weather: { temp: 5, condition: 'Misty' },
    tags: ['spa', 'geothermal', 'relaxation', 'luxury', 'wellness'],
    isVerified: true,
    verificationCount: 167,
    reports: [],
    createdAt: new Date('2023-01-07')
  },
  {
    id: '8',
    name: 'Jemaa el-Fnaa',
    description: 'Vibrant main square in Marrakech filled with food stalls, storytellers, musicians, and snake charmers. A sensory overload in the best way.',
    location: {
      country: 'Morocco',
      city: 'Marrakech',
      coordinates: { lat: 31.6258, lng: -7.9891 }
    },
    images: [
      'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1512958789358-4dac0f0a68f4?w=800&h=600&fit=crop'
    ],
    category: 'city',
    rating: 4.5,
    reviewCount: 2876,
    priceRange: '$',
    bestSeason: 'Mar-May',
    avgCostPerDay: 50,
    safetyScore: 7.8,
    crowdLevel: 'packed',
    weather: { temp: 25, condition: 'Sunny' },
    tags: ['market', 'food', 'culture', 'nightlife', 'shopping'],
    isVerified: true,
    verificationCount: 134,
    reports: [],
    createdAt: new Date('2023-01-08')
  },
  {
    id: '9',
    name: 'Milford Sound',
    description: 'Stunning fjord with towering cliffs, waterfalls, and wildlife. Rudyard Kipling called it the eighth wonder of the world.',
    location: {
      country: 'New Zealand',
      city: 'Fiordland',
      coordinates: { lat: -44.6414, lng: 167.8974 }
    },
    images: [
      'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1469521669194-babb45599def?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=600&fit=crop'
    ],
    category: 'nature',
    rating: 4.9,
    reviewCount: 1567,
    priceRange: '$$',
    bestSeason: 'Nov-Mar',
    avgCostPerDay: 150,
    safetyScore: 9.0,
    crowdLevel: 'light',
    weather: { temp: 12, condition: 'Rainy' },
    tags: ['fjord', 'cruise', 'wildlife', 'waterfalls', 'scenic'],
    isVerified: true,
    verificationCount: 98,
    reports: [],
    createdAt: new Date('2023-01-09')
  },
  {
    id: '10',
    name: 'Boudhanath Stupa',
    description: 'One of the largest spherical stupas in Nepal and a major center of Tibetan Buddhism. The eyes of Buddha watch over the city.',
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
    rating: 4.7,
    reviewCount: 1234,
    priceRange: '$',
    bestSeason: 'Oct-Nov',
    avgCostPerDay: 35,
    safetyScore: 8.8,
    crowdLevel: 'moderate',
    weather: { temp: 20, condition: 'Clear' },
    tags: ['buddhism', 'stupa', 'culture', 'spiritual', 'tibetan'],
    isVerified: true,
    verificationCount: 145,
    reports: [],
    createdAt: new Date('2023-01-10')
  },
  {
    id: '11',
    name: 'Alfama District',
    description: 'Lisbon\'s oldest neighborhood with narrow winding streets, traditional Fado music, and stunning viewpoints over the Tagus River.',
    location: {
      country: 'Portugal',
      city: 'Lisbon',
      coordinates: { lat: 38.7127, lng: -9.1303 }
    },
    images: [
      'https://images.unsplash.com/photo-1559563362-c667ba5f5480?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1585208798174-6ced315ddc7a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1513737567531-bc431c8e5e91?w=800&h=600&fit=crop'
    ],
    category: 'city',
    rating: 4.8,
    reviewCount: 2134,
    priceRange: '$',
    bestSeason: 'Mar-May',
    avgCostPerDay: 70,
    safetyScore: 9.0,
    crowdLevel: 'moderate',
    weather: { temp: 22, condition: 'Sunny' },
    tags: ['history', 'fado', 'views', 'walking', 'culture'],
    isVerified: true,
    verificationCount: 178,
    reports: [],
    createdAt: new Date('2023-01-11')
  },
  {
    id: '12',
    name: 'Ha Long Bay',
    description: 'UNESCO World Heritage site with thousands of limestone karsts rising from emerald waters. An otherworldly seascape.',
    location: {
      country: 'Vietnam',
      city: 'Quang Ninh',
      coordinates: { lat: 20.9101, lng: 107.1839 }
    },
    images: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=600&fit=crop'
    ],
    category: 'nature',
    rating: 4.7,
    reviewCount: 2890,
    priceRange: '$$',
    bestSeason: 'Mar-Apr',
    avgCostPerDay: 95,
    safetyScore: 8.5,
    crowdLevel: 'moderate',
    weather: { temp: 26, condition: 'Humid' },
    tags: ['cruise', 'limestone', 'kayaking', 'caves', 'unesco'],
    isVerified: true,
    verificationCount: 156,
    reports: [],
    createdAt: new Date('2023-01-12')
  },
  {
    id: '13',
    name: 'Torres del Paine',
    description: 'Patagonia\'s crown jewel with granite towers, glaciers, and pristine lakes. A paradise for trekkers and nature lovers.',
    location: {
      country: 'Chile',
      city: 'Magallanes',
      coordinates: { lat: -50.9423, lng: -73.4068 }
    },
    images: [
      'https://images.unsplash.com/photo-1518182170546-0766bc6f9213?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
    ],
    category: 'mountain',
    rating: 4.9,
    reviewCount: 1456,
    priceRange: '$$',
    bestSeason: 'Dec-Feb',
    avgCostPerDay: 110,
    safetyScore: 8.2,
    crowdLevel: 'light',
    weather: { temp: 8, condition: 'Windy' },
    tags: ['trekking', 'patagonia', 'glaciers', 'wildlife', 'camping'],
    isVerified: true,
    verificationCount: 87,
    reports: [],
    createdAt: new Date('2023-01-13')
  },
  {
    id: '14',
    name: 'Old Town Walls',
    description: 'Ancient city walls surrounding the historic center of Dubrovnik. Walk the ramparts for stunning Adriatic Sea views.',
    location: {
      country: 'Croatia',
      city: 'Dubrovnik',
      coordinates: { lat: 42.6411, lng: 18.1100 }
    },
    images: [
      'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544144433-d50aff500b91?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.8,
    reviewCount: 1987,
    priceRange: '$$',
    bestSeason: 'May-Sep',
    avgCostPerDay: 130,
    safetyScore: 9.3,
    crowdLevel: 'packed',
    weather: { temp: 26, condition: 'Sunny' },
    tags: ['walls', 'history', 'views', 'game-of-thrones', 'adriatic'],
    isVerified: true,
    verificationCount: 134,
    reports: [],
    createdAt: new Date('2023-01-14')
  },
  {
    id: '15',
    name: 'Doi Inthanon',
    description: 'Thailand\'s highest peak with stunning waterfalls, pagodas, and cool mountain air. A refreshing escape from the heat.',
    location: {
      country: 'Thailand',
      city: 'Chiang Mai',
      coordinates: { lat: 18.5888, lng: 98.4866 }
    },
    images: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=800&h=600&fit=crop'
    ],
    category: 'mountain',
    rating: 4.6,
    reviewCount: 1234,
    priceRange: '$',
    bestSeason: 'Nov-Feb',
    avgCostPerDay: 40,
    safetyScore: 9.0,
    crowdLevel: 'moderate',
    weather: { temp: 15, condition: 'Misty' },
    tags: ['hiking', 'waterfalls', 'pagodas', 'nature', 'cool-weather'],
    isVerified: true,
    verificationCount: 112,
    reports: [],
    createdAt: new Date('2023-01-15')
  },
  {
    id: '16',
    name: 'Positano',
    description: 'Colorful cliffside village on the Amalfi Coast. Pastel houses cascade down to the turquoise Mediterranean Sea.',
    location: {
      country: 'Italy',
      city: 'Amalfi Coast',
      coordinates: { lat: 40.6281, lng: 14.4850 }
    },
    images: [
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?w=800&h=600&fit=crop'
    ],
    category: 'beach',
    rating: 4.8,
    reviewCount: 2341,
    priceRange: '$$$',
    bestSeason: 'May-Sep',
    avgCostPerDay: 220,
    safetyScore: 9.2,
    crowdLevel: 'packed',
    weather: { temp: 28, condition: 'Sunny' },
    tags: ['coast', 'luxury', 'views', 'beach', 'romantic'],
    isVerified: true,
    verificationCount: 167,
    reports: [],
    createdAt: new Date('2023-01-16')
  },
  {
    id: '17',
    name: 'Petra',
    description: 'Ancient rose-red city carved into rock cliffs. The Treasury is one of the most iconic archaeological sites in the world.',
    location: {
      country: 'Jordan',
      city: 'Ma\'an',
      coordinates: { lat: 30.3285, lng: 35.4444 }
    },
    images: [
      'https://images.unsplash.com/photo-1501232060322-aa87215ab531?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1579606038888-82c0f02f7f89?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1548783307-f63adc3f1b2d?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.9,
    reviewCount: 3124,
    priceRange: '$$',
    bestSeason: 'Mar-May',
    avgCostPerDay: 100,
    safetyScore: 8.5,
    crowdLevel: 'moderate',
    weather: { temp: 20, condition: 'Sunny' },
    tags: ['nabatean', 'archaeology', 'desert', 'wonder', 'hiking'],
    isVerified: true,
    verificationCount: 198,
    reports: [],
    createdAt: new Date('2023-01-17')
  },
  {
    id: '18',
    name: 'Tegalalang Rice Terrace',
    description: 'Iconic layered rice paddies carved into the hillside. A masterpiece of traditional Balinese irrigation called subak.',
    location: {
      country: 'Indonesia',
      city: 'Ubud, Bali',
      coordinates: { lat: -8.4312, lng: 115.2790 }
    },
    images: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518548419970-58e0d94add1?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&h=600&fit=crop'
    ],
    category: 'nature',
    rating: 4.7,
    reviewCount: 1876,
    priceRange: 'free',
    bestSeason: 'Apr-Oct',
    avgCostPerDay: 40,
    safetyScore: 9.0,
    crowdLevel: 'moderate',
    weather: { temp: 27, condition: 'Sunny' },
    tags: ['rice-terrace', 'ubud', 'photography', 'nature', 'culture'],
    isVerified: true,
    verificationCount: 145,
    reports: [],
    createdAt: new Date('2023-01-18')
  },
  {
    id: '19',
    name: 'Angel Falls',
    description: 'The world\'s highest uninterrupted waterfall at 979 meters. A remote natural wonder in the heart of the Amazon.',
    location: {
      country: 'Venezuela',
      city: 'Bolivar',
      coordinates: { lat: 5.9701, lng: -62.5365 }
    },
    images: [
      'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
    ],
    category: 'nature',
    rating: 4.9,
    reviewCount: 567,
    priceRange: '$$',
    bestSeason: 'Jun-Nov',
    avgCostPerDay: 150,
    safetyScore: 7.0,
    crowdLevel: 'empty',
    weather: { temp: 30, condition: 'Humid' },
    tags: ['waterfall', 'jungle', 'adventure', 'remote', 'highest'],
    isVerified: true,
    verificationCount: 45,
    reports: [],
    createdAt: new Date('2023-01-19')
  },
  {
    id: '20',
    name: 'Sagrada Familia',
    description: 'Gaudi\'s unfinished masterpiece. A breathtaking basilica combining Gothic and Art Nouveau elements in Barcelona.',
    location: {
      country: 'Spain',
      city: 'Barcelona',
      coordinates: { lat: 41.4036, lng: 2.1744 }
    },
    images: [
      'https://images.unsplash.com/photo-1384921141328-85b2c736a2b6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1511527661048-f6ad7388b519?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565622871630-8e453c4b6ed9?w=800&h=600&fit=crop'
    ],
    category: 'historical',
    rating: 4.8,
    reviewCount: 4521,
    priceRange: '$$',
    bestSeason: 'Mar-May',
    avgCostPerDay: 120,
    safetyScore: 9.0,
    crowdLevel: 'packed',
    weather: { temp: 20, condition: 'Partly Cloudy' },
    tags: ['gaudi', 'architecture', 'church', 'unesco', 'art'],
    isVerified: true,
    verificationCount: 234,
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

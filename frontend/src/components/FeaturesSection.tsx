import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, Users, Clock, BarChart3, CheckCircle, TrendingUp } from 'lucide-react';

const features = [
  {
    id: 1,
    icon: Shield,
    title: 'GPS-Verified Reports',
    description: 'Every report is location-verified, ensuring you get accurate, trustworthy information from real travelers at real places.',
    stat: '98.7%',
    statLabel: 'accuracy rate',
    color: '#2ECC71',
    bgColor: 'rgba(46, 204, 113, 0.1)'
  },
  {
    id: 2,
    icon: Users,
    title: 'Community-Powered',
    description: 'Join 50,000+ travelers sharing experiences, tips, and hidden gems. Build connections that last beyond the journey.',
    stat: '50K+',
    statLabel: 'active members',
    color: '#FF6B35',
    bgColor: 'rgba(255, 107, 53, 0.1)'
  },
  {
    id: 3,
    icon: Clock,
    title: 'Real-Time Updates',
    description: 'Get instant notifications about place conditions, crowds, and safety alerts from travelers on the ground.',
    stat: '< 4h',
    statLabel: 'avg. verification',
    color: '#F7B801',
    bgColor: 'rgba(247, 184, 1, 0.1)'
  },
  {
    id: 4,
    icon: BarChart3,
    title: 'Smart Comparison Tool',
    description: 'Compare up to 4 destinations side-by-side with ratings, costs, weather, and traveler reviews in one view.',
    stat: '2-4',
    statLabel: 'places instantly',
    color: '#004E89',
    bgColor: 'rgba(0, 78, 137, 0.1)'
  }
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-white"
    >
      <div className="section-padding">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-[#FF6B35]/10 text-[#FF6B35] text-sm font-medium rounded-full mb-4">
              Why Choose Us
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-[#2C3E50] mb-4">
              The Global Mitra Difference
            </h2>
            <p className="text-[#7F8C8D] text-lg max-w-2xl mx-auto">
              Built by travelers, for travelers. Every feature designed for authentic experiences.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative p-8 rounded-3xl border-2 border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-500"
                >
                  {/* Glow Effect on Hover */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ 
                      background: `linear-gradient(135deg, ${feature.bgColor} 0%, transparent 100%)`
                    }}
                  />

                  <div className="relative z-10">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                      style={{ backgroundColor: feature.bgColor }}
                    >
                      <Icon 
                        className="w-8 h-8" 
                        style={{ color: feature.color }}
                      />
                    </motion.div>

                    {/* Content */}
                    <h3 className="font-heading text-xl font-bold text-[#2C3E50] mb-3 group-hover:text-[#FF6B35] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-[#7F8C8D] mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Stat */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <span 
                        className="text-3xl font-bold"
                        style={{ color: feature.color }}
                      >
                        {feature.stat}
                      </span>
                      <span className="text-sm text-[#7F8C8D]">
                        {feature.statLabel}
                      </span>
                    </div>
                  </div>

                  {/* Corner Decoration */}
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at top right, ${feature.bgColor} 0%, transparent 70%)`
                    }}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { value: '100%', label: 'Verified Reports', icon: CheckCircle },
              { value: '24/7', label: 'Community Support', icon: Users },
              { value: '150+', label: 'Countries Covered', icon: TrendingUp },
              { value: '4.9★', label: 'App Store Rating', icon: TrendingUp }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="text-center p-6 rounded-2xl bg-[#FDF8F3]"
                >
                  <Icon className="w-6 h-6 text-[#FF6B35] mx-auto mb-2" />
                  <div className="text-2xl font-bold text-[#2C3E50]">{stat.value}</div>
                  <div className="text-sm text-[#7F8C8D]">{stat.label}</div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

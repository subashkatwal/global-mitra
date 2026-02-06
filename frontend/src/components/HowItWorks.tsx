import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Search, Camera, Users, CheckCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: Search,
    title: 'Discover Places',
    subtitle: 'Explore Verified Destinations',
    description: 'Browse thousands of community-verified places with real-time updates from travelers like you. Filter by interests, budget, and travel style.',
    features: ['Smart recommendations', 'Real-time conditions', 'Authentic reviews'],
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop',
    color: '#FF6B35'
  },
  {
    id: 2,
    icon: Camera,
    title: 'Share Experience',
    subtitle: 'Share Your Journey',
    description: 'Submit GPS-verified reports, photos, and tips. Help fellow travelers with accurate, up-to-date information.',
    features: ['GPS verification', 'Photo uploads', 'Earn rewards'],
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
    color: '#F7B801'
  },
  {
    id: 3,
    icon: Users,
    title: 'Connect Community',
    subtitle: 'Join the Community',
    description: 'Connect with fellow travelers, get advice from local guides, and build your travel reputation.',
    features: ['Meet travelers', 'Expert guides', 'Build reputation'],
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop',
    color: '#004E89'
  }
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(1);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section 
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
    >
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,78,137,0.1) 0%, transparent 70%)' }}
        />
      </div>

      <div className="section-padding relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-[#004E89]/10 text-[#004E89] text-sm font-medium rounded-full mb-4">
              How It Works
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-[#2C3E50] mb-4">
              Your Journey in 3 Simple Steps
            </h2>
            <p className="text-[#7F8C8D] text-lg max-w-2xl mx-auto">
              From discovery to sharing, we&apos;ve made travel planning seamless
            </p>
          </motion.div>

          {/* Steps Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Step Indicators */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    onClick={() => setActiveStep(step.id)}
                    className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                      isActive 
                        ? 'bg-white shadow-xl border-2 border-[#FF6B35]' 
                        : 'bg-white/50 border-2 border-transparent hover:bg-white hover:shadow-lg'
                    }`}
                  >
                    {/* Progress Line */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-10 top-full w-0.5 h-6 bg-gray-200" />
                    )}

                    <div className="flex items-start gap-4">
                      {/* Step Number */}
                      <div 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          isActive 
                            ? 'gradient-primary text-white scale-110' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="text-sm font-medium"
                            style={{ color: isActive ? step.color : '#7F8C8D' }}
                          >
                            Step 0{step.id}
                          </span>
                          {isActive && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-[#2ECC71]"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </motion.span>
                          )}
                        </div>
                        <h3 className={`font-bold text-lg mb-1 transition-colors ${
                          isActive ? 'text-[#2C3E50]' : 'text-[#7F8C8D]'
                        }`}>
                          {step.subtitle}
                        </h3>
                        <p className={`text-sm transition-colors ${
                          isActive ? 'text-[#7F8C8D]' : 'text-gray-400'
                        }`}>
                          {step.description}
                        </p>

                        {/* Features */}
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="flex flex-wrap gap-2 mt-4"
                          >
                            {step.features.map((feature) => (
                              <span
                                key={feature}
                                className="px-3 py-1 bg-gray-100 text-[#7F8C8D] text-xs rounded-full"
                              >
                                {feature}
                              </span>
                            ))}
                          </motion.div>
                        )}
                      </div>

                      {/* Arrow */}
                      <ArrowRight 
                        className={`w-5 h-5 transition-all ${
                          isActive 
                            ? 'text-[#FF6B35] translate-x-1' 
                            : 'text-gray-300'
                        }`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Right - Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                {steps.map((step) => (
                  <motion.div
                    key={step.id}
                    initial={false}
                    animate={{
                      opacity: activeStep === step.id ? 1 : 0,
                      scale: activeStep === step.id ? 1 : 1.1
                    }}
                    transition={{ duration: 0.5 }}
                    className={`${activeStep === step.id ? 'relative' : 'absolute inset-0'}`}
                  >
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-[500px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    
                    {/* Overlay Content */}
                    <div className="absolute bottom-8 left-8 right-8">
                      <div 
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium mb-4"
                        style={{ backgroundColor: step.color }}
                      >
                        <step.icon className="w-4 h-4" />
                        {step.title}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#FF6B35]/10 rounded-full blur-2xl" />
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#F7B801]/10 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

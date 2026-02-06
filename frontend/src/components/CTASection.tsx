import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle, MapPin, Camera, Users } from 'lucide-react';

interface CTASectionProps {
  onJoinClick: () => void;
}

export function CTASection({ onJoinClick }: CTASectionProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        onJoinClick();
      }, 1500);
    }
  };

  const features = [
    { icon: CheckCircle, text: 'Free forever' },
    { icon: CheckCircle, text: 'No credit card required' },
    { icon: CheckCircle, text: 'Cancel anytime' }
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
    >
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 gradient-animated" />
      
      {/* Overlay Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="section-padding relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Ready to Start Your Adventure?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-lg">
                Join 50,000+ travelers discovering the world through verified experiences and authentic connections.
              </p>

              {/* Email Form */}
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="mb-8">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-[#2C3E50] placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-white/30 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-8 py-4 rounded-xl bg-[#2C3E50] text-white font-semibold hover:bg-[#1a252f] transition-colors flex items-center justify-center gap-2"
                    >
                      Get Started Free
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-8 p-6 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center gap-3"
                >
                  <CheckCircle className="w-6 h-6 text-[#2ECC71]" />
                  <span>Thanks! Redirecting you to sign up...</span>
                </motion.div>
              )}

              {/* Trust Points */}
              <div className="flex flex-wrap gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-2 text-white/90"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{feature.text}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right Content - Floating Cards */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative h-[500px]">
                {/* Phone Mockup */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72"
                >
                  <div className="bg-white rounded-[2.5rem] p-3 shadow-2xl">
                    <div className="bg-[#FDF8F3] rounded-[2rem] overflow-hidden">
                      {/* Mock Header */}
                      <div className="bg-gradient-to-r from-[#FF6B35] to-[#F7B801] p-4 text-white">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-white/20" />
                          <div>
                            <div className="text-sm font-semibold">Global Mitra</div>
                            <div className="text-xs opacity-80">Travel Verified</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Mock Content */}
                      <div className="p-4 space-y-3">
                        <div className="h-32 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300" />
                        <div className="h-4 w-3/4 rounded bg-gray-200" />
                        <div className="h-4 w-1/2 rounded bg-gray-200" />
                        <div className="flex gap-2">
                          <div className="h-8 w-20 rounded-full bg-[#FF6B35]" />
                          <div className="h-8 w-20 rounded-full bg-gray-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Cards */}
                <motion.div
                  animate={{ y: [0, 10, 0], rotate: [0, 3, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-8 right-0 bg-white rounded-2xl p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2ECC71]/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#2ECC71]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#2C3E50]">New Report</div>
                      <div className="text-xs text-[#7F8C8D]">Bali, Indonesia</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, -3, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute bottom-20 left-0 bg-white rounded-2xl p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-[#FF6B35]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#2C3E50]">Photo Shared</div>
                      <div className="text-xs text-[#7F8C8D]">+24 likes</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-8 right-8 bg-white rounded-2xl p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#004E89]/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#004E89]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#2C3E50]">New Follower</div>
                      <div className="text-xs text-[#7F8C8D]">Sarah joined</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

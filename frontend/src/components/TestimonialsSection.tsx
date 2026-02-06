import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Solo Traveler',
    location: 'San Francisco, CA',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    rating: 5,
    quote: 'Global Mitra transformed how I travel solo. The verified reports gave me confidence to explore places I\'d never consider before. Met amazing people through the community!'
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'Adventure Seeker',
    location: 'London, UK',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    rating: 5,
    quote: 'The GPS verification is genius. I know I\'m getting real info from someone who was actually there. Saved me from a closed trail in Nepal!'
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    role: 'Family Traveler',
    location: 'Barcelona, Spain',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    rating: 5,
    quote: 'Planning family trips used to be stressful. Now I get real-time updates on crowd levels and kid-friendly spots. Game changer for our vacations!'
  },
  {
    id: 4,
    name: 'Yuki Tanaka',
    role: 'Photography Enthusiast',
    location: 'Tokyo, Japan',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    rating: 5,
    quote: 'Found the most incredible hidden photo spots through this community. The comparison tool helped me plan my entire Asia photography tour efficiently.'
  }
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-white relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#FF6B35]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-[#004E89]/5 rounded-full blur-3xl" />
      </div>

      <div className="section-padding relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-[#2ECC71]/10 text-[#2ECC71] text-sm font-medium rounded-full mb-4">
              Testimonials
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-[#2C3E50] mb-4">
              What Our Travelers Say
            </h2>
            <p className="text-[#7F8C8D] text-lg max-w-2xl mx-auto">
              Real stories from real adventurers around the world
            </p>
          </motion.div>

          {/* Testimonials Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Main Card */}
            <div className="relative bg-[#FDF8F3] rounded-3xl p-8 md:p-12">
              {/* Quote Icon */}
              <div className="absolute -top-6 left-8 md:left-12">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Quote className="w-6 h-6 text-white" />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="pt-6"
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star className="w-5 h-5 text-[#F7B801] fill-[#F7B801]" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-xl md:text-2xl text-[#2C3E50] leading-relaxed mb-8 font-light">
                    &ldquo;{testimonials[activeIndex].quote}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonials[activeIndex].avatar}
                      alt={testimonials[activeIndex].name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <div>
                      <h4 className="font-bold text-[#2C3E50]">
                        {testimonials[activeIndex].name}
                      </h4>
                      <p className="text-sm text-[#7F8C8D]">
                        {testimonials[activeIndex].role} • {testimonials[activeIndex].location}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === activeIndex
                        ? 'w-8 bg-[#FF6B35]'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              {/* Arrows */}
              <div className="flex gap-3">
                <button
                  onClick={prevTestimonial}
                  className="p-3 rounded-full bg-white border border-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="p-3 rounded-full bg-white border border-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { value: '4.9★', label: 'Average Rating' },
              { value: '50K+', label: 'Happy Travelers' },
              { value: '12K+', label: 'Reviews' },
              { value: '98%', label: 'Would Recommend' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#FF6B35] mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-[#7F8C8D]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

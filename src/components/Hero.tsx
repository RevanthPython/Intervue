import React from 'react';
import { motion } from 'framer-motion';
import { Video, Star, Shield, Users, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-white pt-24 pb-16 lg:pt-32 lg:pb-24">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-50 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 mb-6">
                <Star className="w-4 h-4 mr-2 fill-indigo-700" />
                Trusted by 500+ Top Companies
              </span>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
                Record Once. <br />
                <span className="text-indigo-600">Apply Anywhere.</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl">
                The professional platform where candidates record interviews once, get rated by experts, and share their "Interview Portfolio" with global recruiters.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
                >
                  Get Started as Candidate
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link 
                  to="/search"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-lg font-semibold text-gray-700 bg-white border-2 border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all"
                >
                  Hire Top Talent
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-bold text-gray-900">10k+</div>
                  <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Candidates</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Experts</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">2k+</div>
                  <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Placements</div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-5 mt-16 lg:mt-0 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative z-10"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="aspect-video bg-gray-900 relative flex items-center justify-center group cursor-pointer">
                  <img 
                    src="https://picsum.photos/seed/interview/800/450" 
                    alt="Interview Preview" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-indigo-600 fill-indigo-600 ml-1" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium">
                      Live Technical Interview
                    </div>
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-8 h-8 rounded-full border-2 border-white" alt="" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Sarah Johnson</h3>
                    <div className="flex items-center text-emerald-600 font-bold">
                      <Star className="w-4 h-4 mr-1 fill-emerald-600" />
                      9.4/10
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'Node.js', 'System Design'].map(skill => (
                      <span key={skill} className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-600 rounded-2xl -z-10 rotate-12 opacity-20" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-emerald-500 rounded-full -z-10 opacity-10" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;

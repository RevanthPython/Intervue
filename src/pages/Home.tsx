import React from 'react';
import Hero from '../components/Hero';
import { motion } from 'framer-motion';
import { Shield, Video, Users, Zap, CheckCircle } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div>
      <Hero />
      
      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">How it works</h2>
            <p className="mt-4 text-xl text-gray-600">The most efficient way to showcase your skills to top employers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Record Once",
                desc: "Complete a professional interview with an industry expert on your own schedule.",
                icon: Video,
                color: "bg-blue-500"
              },
              {
                title: "Get Rated",
                desc: "Receive a verified rating and AI-powered feedback summary for your performance.",
                icon: Zap,
                color: "bg-indigo-500"
              },
              {
                title: "Share Portfolio",
                desc: "Send your verified interview link to companies or let them find you in our talent pool.",
                icon: Users,
                color: "bg-emerald-500"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                  <feature.icon className="text-white w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-900 rounded-[3rem] p-12 lg:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <div className="relative z-10 lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                  Verified by Experts. <br />
                  Trusted by Recruiters.
                </h2>
                <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                  We bridge the gap between talent and opportunity by providing a verified layer of trust. No more repetitive screening calls.
                </p>
                <div className="space-y-4">
                  {[
                    "AI-Powered performance analysis",
                    "Industry expert interviewers",
                    "Verified skill badges",
                    "Secure video hosting"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center text-white font-medium">
                      <CheckCircle className="w-5 h-5 mr-3 text-emerald-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-12 lg:mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">98%</div>
                    <div className="text-indigo-200 text-sm">Placement Rate</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">40%</div>
                    <div className="text-indigo-200 text-sm">Faster Hiring</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">5k+</div>
                    <div className="text-indigo-200 text-sm">Interviews Monthly</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                    <div className="text-3xl font-bold text-white mb-1">150+</div>
                    <div className="text-indigo-200 text-sm">Partner Companies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

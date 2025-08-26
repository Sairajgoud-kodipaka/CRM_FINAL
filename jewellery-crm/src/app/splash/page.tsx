'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Crown, Building2, Store, Users, BarChart3, Phone } from 'lucide-react';

export default function SplashPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    {
      title: 'Welcome to Jewellery CRM',
      description: 'Your complete solution for jewellery business management',
      icon: Sparkles,
      color: 'text-purple-600',
    },
    {
      title: 'Platform Admin',
      description: 'Manage the entire CRM platform and oversee all operations',
      icon: Crown,
      color: 'text-purple-600',
    },
    {
      title: 'Business Admin',
      description: 'Manage your jewellery business with comprehensive tools',
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      title: 'Store Manager',
      description: 'Oversee store operations and team management',
      icon: Store,
      color: 'text-green-600',
    },
    {
      title: 'Sales Team',
      description: 'Handle customers and drive sales growth',
      icon: Users,
      color: 'text-orange-600',
    },
    {
      title: 'Marketing Team',
      description: 'Create campaigns and manage promotions',
      icon: BarChart3,
      color: 'text-pink-600',
    },
    {
      title: 'Tele-caller',
      description: 'Handle customer calls and lead management',
      icon: Phone,
      color: 'text-indigo-600',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          // Redirect to login after showing all steps
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          return prev;
        }
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Jewellery CRM</h1>
          <p className="text-gray-600">Your complete business solution</p>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border-0">
          <div className="mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${currentStepData.color.replace('text-', 'bg-')} bg-opacity-10`}>
              <IconComponent className={`w-8 h-8 ${currentStepData.color}`} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStepData.title}</h2>
            <p className="text-gray-600">{currentStepData.description}</p>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Loading Text */}
        <div className="mt-6">
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    </div>
  );
} 
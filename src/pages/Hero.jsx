import React, { useState } from 'react';
import { Button } from 'antd';
import backgroundImage from '../assets/background.jpg';
import RegisterModal from '../components/RegisterModal';
import LoginModal from '../components/LoginModal';

const Hero = () => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleSwitchToRegister = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  return (
    <>
      <div 
        className="relative h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black opacity-50"></div>
        
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Study Smarter, Stress Less
          </h1>
          
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Join a community of students sharing study strategies, stress-relief tips, 
            and mutual support to conquer exams together.
          </p>

          <div className="space-x-4">
            <Button 
              type="primary" 
              size="large"
              className="hover:scale-105 transition-transform"
              onClick={() => setIsRegisterModalOpen(true)}
            >
              Get Started
            </Button>
            
            <Button 
              type="default" 
              size="large"
              className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white border-white hover:scale-105 transition-transform"
              onClick={() => setIsLoginModalOpen(true)}
            >
              Login
            </Button>
          </div>

          <p className="mt-8 text-sm md:text-base opacity-90">
            Already part of our community? Share your study hack today!
          </p>
        </div>
      </div>

      {/* Modals */}
      <RegisterModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
      
      <LoginModal
        open={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />
    </>
  );
};

export default Hero;
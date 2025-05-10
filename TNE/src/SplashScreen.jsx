import { useEffect } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.3,
        duration: 0.6 
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.8 }
    }
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.7,
        ease: "easeInOut"
      }
    }
  };

  const eyeVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.05
      }
    }
  };

  const flashVariant = {
    hidden: { opacity: 0, scale: 0 },
    visible: { 
      opacity: [0, 0.8, 0],
      scale: [0, 1, 1.2],
      transition: { 
        duration: 0.6, 
        times: [0, 0.5, 1],
        delay: 2.2
      }
    }
  };

  return (
    <motion.div 
      className="splash-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="splash-container">
        <motion.div 
          className="logo-wrapper"
          variants={logoVariants}
        >
          <motion.img 
            src="/The Noticing Eye.svg" 
            alt="The Noticing Eye" 
            className="splash-logo"
          />
          
          <motion.div 
            className="camera-flash"
            variants={flashVariant}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;

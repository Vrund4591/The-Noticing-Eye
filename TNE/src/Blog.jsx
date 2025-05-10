import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllPhotos } from './services/api';

const Blog = () => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      const data = await getAllPhotos();
      setPhotos(data);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setError('Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleImage = (photo) => {
    setSelectedPhoto(photo);
    setIsImageOpen(!isImageOpen);
  };

  const formatDate = (photoDate, photoDay) => {
    // Handle date formatting for display
    try {
      // Check if we have a date string in dd/month/yyyy format
      if (photoDate.includes('/')) {
        const [day, month, year] = photoDate.split('/');
        return { day, month, year, weekday: photoDay };
      }
      
      // Otherwise parse as ISO date
      const date = new Date(photoDate);
      const day = date.getDate();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      
      return { day, month, year, weekday: photoDay || getWeekday(date) };
    } catch (e) {
      console.error('Error formatting date:', e);
      return { day: '', month: '', year: '', weekday: photoDay || '' };
    }
  };
  
  const getWeekday = (date) => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[date.getDay()];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        {error}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No photos available yet.
      </div>
    );
  }

  return (
    <>
      {photos.map((photo) => {
        const { day, month, year, weekday } = formatDate(photo.date, photo.day);
        
        return (
          <div key={photo.id} className="space-y-4 px-8 py-16 border-b-1 pb-6 border-gray-300 md:px-32 sm:px-8">
            <div className="flex space-x-1 dm-serif-display-regular text-2xl">
              <div className="flex items-center">
                {photo.day || weekday || 'Day'}
              </div>
              <div className="flex items-center">,</div>
              <div className="flex items-center">{day}</div>
              <div className="flex items-center">{month}</div>
              <div className="flex items-center">{year}</div>
            </div>
            
            <div className="flex">
              <img 
                src={photo.imageUrl} 
                className="h-96 cursor-pointer hover:opacity-95 transition-opacity" 
                onClick={() => toggleImage(photo)}
                alt={photo.title}
              />
            </div>
            
            <div className="flex">
              <div className="text-4xl font-bold dm-serif-display-regular">"{photo.title}"</div>
            </div>
            
            <div className="flex justify-center items-center text-justify"> 
              <div className="text-sm space-grotesk-regular">{photo.description}</div>
            </div>
          </div>
        );
      })}
      
      {/* Image Modal */}
      <AnimatePresence>
        {isImageOpen && selectedPhoto && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleImage(null)}
          >
            <motion.div
              className="relative max-w-5xl max-h-[90vh]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedPhoto.imageUrl} 
                className="max-h-[90vh] max-w-full object-contain shadow-2xl" 
                alt={selectedPhoto.title} 
              />
              <button 
                className="absolute top-[-10%] md:top-0 right-[0%] md:right-[-70%] w-10 h-10 bg-white bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-300"
                onClick={() => toggleImage(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Blog;
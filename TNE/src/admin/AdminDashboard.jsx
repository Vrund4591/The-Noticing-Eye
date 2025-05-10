import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPhotos, uploadPhoto, deletePhoto, updatePhoto } from '../services/api';
import PhotoForm from './PhotoForm';

const AdminDashboard = () => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      const data = await getAllPhotos();
      setPhotos(data);
      setError('');
    } catch (error) {
      console.error('Error fetching photos:', error);
      setError('Failed to load photos. Please try again.');
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const handleAddPhoto = () => {
    setSelectedPhoto(null);
    setShowForm(true);
  };

  const handleEditPhoto = (photo) => {
    setSelectedPhoto(photo);
    setShowForm(true);
  };

  const handleDeletePhoto = async (id) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        await deletePhoto(id);
        setPhotos(photos.filter(photo => photo.id !== id));
      } catch (error) {
        console.error('Error deleting photo:', error);
        setError('Failed to delete photo. Please try again.');
      }
    }
  };

  const handlePhotoSubmit = async (photoData) => {
    try {
      if (selectedPhoto) {
        // Update existing photo
        const updated = await updatePhoto(selectedPhoto.id, photoData);
        setPhotos(photos.map(p => p.id === selectedPhoto.id ? updated.photo : p));
      } else {
        // Upload new photo
        await uploadPhoto(photoData);
      }
      
      setShowForm(false);
      fetchPhotos();
    } catch (error) {
      console.error('Error saving photo:', error);
      setError('Failed to save photo. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    // For UI display, we want to show the date nicely
    try {
      // Handle both ISO format from DB and dd/month/yyyy format
      let date;
      if (dateString.includes('/')) {
        // Already in our display format
        return dateString;
      } else {
        // Convert from ISO format
        date = new Date(dateString);
        const day = date.getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      console.error('Date formatting error:', e);
      return dateString; // Return as is if there's an error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src="/The Noticing Eye.svg" alt="The Noticing Eye" className="h-12 w-12" />
              <h1 className="ml-2 text-xl font-bold dm-serif-display-regular">Admin Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button 
                onClick={handleLogout}
                className="bg-black hover:bg-gray-800 text-white py-2 px-4 rounded space-grotesk-regular"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dm-serif-display-regular">Photo Collection</h2>
          <button 
            onClick={handleAddPhoto}
            className="bg-black hover:bg-gray-800 text-white py-2 px-4 rounded space-grotesk-regular"
          >
            Add New Photo
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map(photo => (
              <div key={photo.id} className="bg-white rounded-lg shadow overflow-hidden">
                <img 
                  src={photo.imageUrl} 
                  alt={photo.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold dm-serif-display-regular">{photo.title}</h3>
                    <span className="text-sm text-gray-500 space-grotesk-regular">
                      {photo.day}, {formatDate(photo.date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 space-grotesk-regular mb-4 line-clamp-3">
                    {photo.description}
                  </p>
                  <div className="flex justify-between">
                    <button 
                      onClick={() => handleEditPhoto(photo)}
                      className="text-blue-600 hover:text-blue-800 space-grotesk-regular text-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="text-red-600 hover:text-red-800 space-grotesk-regular text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {photos.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 space-grotesk-regular">
                No photos found. Add your first photo to get started.
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold dm-serif-display-regular">
                {selectedPhoto ? 'Edit Photo' : 'Add New Photo'}
              </h3>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <PhotoForm 
              photo={selectedPhoto} 
              onSubmit={handlePhotoSubmit} 
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

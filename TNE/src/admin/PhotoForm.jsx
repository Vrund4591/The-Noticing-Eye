import { useState, useEffect } from 'react';

const PhotoForm = ({ photo, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    day: '',
    photo: null
  });
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (photo) {
      // Format date for display and set initial data
      let formattedDate;
      try {
        if (photo.date.includes('/')) {
          // Already in our display format
          formattedDate = photo.date;
        } else {
          // Convert from ISO format
          const date = new Date(photo.date);
          const day = date.getDate();
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
          const month = monthNames[date.getMonth()];
          const year = date.getFullYear();
          formattedDate = `${day}/${month}/${year}`;
        }
      } catch (e) {
        console.error('Date formatting error:', e);
        formattedDate = '';  // Set empty if error
      }
      
      setFormData({
        title: photo.title || '',
        description: photo.description || '',
        date: formattedDate || '',
        day: photo.day || '',
        photo: null
      });
      
      setPreview(photo.imageUrl);
    }
  }, [photo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-determine day from date when date changes
      if (name === 'date') {
        try {
          // Extract day from dd/month/yyyy format
          const dateParts = value.split('/');
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0], 10);
            const monthStr = dateParts[1];
            const year = parseInt(dateParts[2], 10);
            
            // Convert month name to month number (0-11)
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                             'July', 'August', 'September', 'October', 'November', 'December'];
            const month = monthNames.findIndex(m => 
              m.toLowerCase() === monthStr.toLowerCase()
            );
            
            if (!isNaN(day) && month !== -1 && !isNaN(year)) {
              // Create date object and get day of week
              const dateObj = new Date(year, month, day);
              newData.day = weekdays[dateObj.getDay()];
            }
          }
        } catch (err) {
          console.error('Error parsing date:', err);
          // Don't change day on error
        }
      }
      
      return newData;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    
    if (!formData.date.trim()) {
      setError('Date is required');
      return false;
    }
    
    // Date format validation (dd/month/yyyy)
    const dateRegex = /^\d{1,2}\/(January|February|March|April|May|June|July|August|September|October|November|December)\/\d{4}$/i;
    if (!dateRegex.test(formData.date)) {
      setError('Date must be in format: dd/month/yyyy (e.g., 15/May/2024)');
      return false;
    }
    
    if (!formData.day) {
      setError('Day of week could not be determined from date');
      return false;
    }
    
    if (!photo && !formData.photo) {
      setError('Please select an image');
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2 space-grotesk-regular">
          Photo
        </label>
        {preview && (
          <div className="mb-2">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full py-2 space-grotesk-regular"
          required={!photo}
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2 space-grotesk-regular">
          Title
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2 space-grotesk-regular">
          Date (dd/month/yyyy)
        </label>
        <input
          type="text"
          name="date"
          value={formData.date}
          onChange={handleChange}
          placeholder="e.g., 15/May/2024"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2 space-grotesk-regular">
          Day of Week (auto-determined)
        </label>
        <input
          type="text"
          name="day"
          value={formData.day}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100"
          readOnly
        />
        <p className="text-xs text-gray-500 mt-1">This field is automatically determined from the date</p>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2 space-grotesk-regular">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          required
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded space-grotesk-regular"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded space-grotesk-regular"
        >
          {photo ? 'Update Photo' : 'Upload Photo'}
        </button>
      </div>
    </form>
  );
};

export default PhotoForm;

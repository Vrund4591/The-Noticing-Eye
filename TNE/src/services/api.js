import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const login = async (credentials) => {
  const response = await apiClient.post('/login', credentials);
  return response.data;
};

export const verifyToken = async () => {
  // Since there's no specific verify endpoint, we'll check authentication
  // by making a request to a protected endpoint
  try {
    await apiClient.get('/photos');
    return { valid: true };
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Photo services
export const getAllPhotos = async () => {
  const response = await apiClient.get('/photos');
  return response.data; // The backend returns the photos array directly
};

export const getPhotoById = async (id) => {
  const response = await apiClient.get(`/photos/${id}`);
  return response.data; // The backend returns the photo object directly
};

export const uploadPhoto = async (photoData) => {
  const formData = new FormData();
  formData.append('photo', photoData.photo);
  formData.append('title', photoData.title);
  formData.append('description', photoData.description);
  formData.append('day', photoData.day);
  formData.append('date', photoData.date);

  const response = await apiClient.post('/photos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const updatePhoto = async (id, photoData) => {
  const response = await apiClient.put(`/photos/${id}`, {
    title: photoData.title,
    description: photoData.description,
    day: photoData.day,
    date: photoData.date
  });
  return response.data;
};

export const deletePhoto = async (id) => {
  const response = await apiClient.delete(`/photos/${id}`);
  return response.data;
};

// Helper function to extract day name from date
function parseDay(dateString) {
  const dateParts = dateString.split('/');
  if (dateParts.length !== 3) return '';
  
  const day = parseInt(dateParts[0], 10);
  const month = getMonthNumber(dateParts[1]);
  const year = parseInt(dateParts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
  
  const date = new Date(year, month, day);
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return weekdays[date.getDay()];
}

// Helper function to convert month name to month number (0-11)
function getMonthNumber(month) {
  const months = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
    'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
  };
  return months[month.toLowerCase()];
}

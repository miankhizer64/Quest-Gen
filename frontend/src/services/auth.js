import axios from 'axios';

export const login = (data) => axios.post('/api/login', data);
export const signup = (data) => axios.post('/api/signup', data);
export const forgotPassword = (data) => axios.post('/api/forgot-password', data);

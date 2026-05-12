/**
 * NMS School API Utility
 * Handles communication with the PHP/MySQL backend
 */

const API_BASE = '/api/index.php';

export const api = {
  async get(type, session = 'global') {
    try {
      const response = await fetch(`${API_BASE}?action=get&type=${type}&session=${session}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      // Fallback to localStorage if API fails (useful for local dev or offline)
      const local = localStorage.getItem(`nms_${type}_${session}`);
      return local ? JSON.parse(local) : [];
    }
  },

  async save(type, data, session = 'global') {
    // Also save to localStorage as a cache/backup
    localStorage.setItem(`nms_${type}_${session}`, JSON.stringify(data));

    try {
      const response = await fetch(`${API_BASE}?action=save&type=${type}&session=${session}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      return { error: error.message };
    }
  }
};

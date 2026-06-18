export const fetchWeatherGrid = async (layer: string, date: string) => {
  const response = await fetch(`/api/weather-grid?layer=${layer}&date=${date}`);
  if (!response.ok) throw new Error('Failed to fetch weather data');
  return response.json();
};

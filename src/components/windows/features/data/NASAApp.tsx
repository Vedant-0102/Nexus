import React, { useState } from 'react';
import { Rocket, Image as ImageIcon, Calendar } from 'lucide-react';

export const NASAApp: React.FC = () => {
  const [apod] = useState({
    title: 'Horsehead Nebula',
    date: '2024-12-05',
    explanation: 'The Horsehead Nebula is one of the most identifiable nebulae in the sky. It is visible as the dark indentation to the red emission nebula in the center of the above photograph. The bright star on the left is located in the belt of the familiar constellation of Orion.',
    url: 'https://apod.nasa.gov/apod/image/2312/Horsehead_Hanson_960.jpg',
    hdurl: 'https://apod.nasa.gov/apod/image/2312/Horsehead_Hanson_2604.jpg'
  });

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      <div className="p-4 bg-black/30 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold">NASA - Astronomy Picture of the Day</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2 text-blue-300">
              <Calendar className="h-5 w-5" />
              <span className="font-semibold">{apod.date}</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-6">{apod.title}</h1>
          
          <div className="relative rounded-xl overflow-hidden shadow-2xl mb-6">
            <img
              src={apod.url}
              alt={apod.title}
              className="w-full h-auto"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/800x600/1a1a2e/ffffff?text=NASA+APOD';
              }}
            />
            <div className="absolute top-4 right-4">
              <ImageIcon className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3">Explanation</h3>
            <p className="text-gray-200 leading-relaxed">{apod.explanation}</p>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4">
            {['Mars Rover', 'Earth Imagery', 'ISS Tracker'].map(feature => (
              <div
                key={feature}
                className="bg-white/5 backdrop-blur rounded-lg p-4 text-center hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Rocket className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                <p className="text-sm font-semibold">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

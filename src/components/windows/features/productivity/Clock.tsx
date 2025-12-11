
import React, { useState, useEffect } from 'react';

export const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="p-4 h-full">
      <h2 className="text-2xl font-semibold mb-4">Clock</h2>
      <div className="flex flex-col items-center justify-center h-[300px]">
        <div className="text-5xl font-semibold">
          {time.toLocaleTimeString()}
        </div>
        <div className="text-xl mt-4">
          {time.toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

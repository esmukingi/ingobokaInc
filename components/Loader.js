"use client";

import React from "react";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Circular loader */}
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>

        {/* Optional subtle text */}
        <p className="text-gray-700 text-sm font-medium">
          Loading...
        </p>
      </div>
    </div>
  );
};

export default Loader;

// components/PasswordGenerator.tsx
"use client";
import React, { useState } from "react";

const lookalikes = "Il1O0";

function randomFrom(str: string) {
  return str[Math.floor(Math.random() * str.length)];
}

export default function PasswordGenerator({ onGenerate }: { onGenerate: (pwd: string) => void }) {
  const [length, setLength] = useState(16);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeLookAlikes, setExcludeLookAlikes] = useState(true);

  function generate() {
    let pool = "";
    if (useLower) pool += "abcdefghijklmnopqrstuvwxyz";
    if (useUpper) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useNumbers) pool += "0123456789";
    if (useSymbols) pool += "!@#$%^&*()-_=+[]{};:,.<>/?";
    if (excludeLookAlikes) pool = pool.split("").filter(c => !lookalikes.includes(c)).join("");

    if (!pool.length) return onGenerate("");

    let res = "";
    for (let i = 0; i < length; i++) res += randomFrom(pool);
    onGenerate(res);
  }

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Length Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">Password Length</label>
          <span className="text-sm font-semibold text-gray-900">{length}</span>
        </div>
        <input
          type="range"
          min={8}
          max={64}
          value={length}
          onChange={e => setLength(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>8</span>
          <span>64</span>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 mb-3">Character Types</p>
        
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={useLower}
            onChange={() => setUseLower(!useLower)}
            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900 cursor-pointer"
          />
          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
            Lowercase letters (a-z)
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={useUpper}
            onChange={() => setUseUpper(!useUpper)}
            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900 cursor-pointer"
          />
          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
            Uppercase letters (A-Z)
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={useNumbers}
            onChange={() => setUseNumbers(!useNumbers)}
            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900 cursor-pointer"
          />
          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
            Numbers (0-9)
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={useSymbols}
            onChange={() => setUseSymbols(!useSymbols)}
            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900 cursor-pointer"
          />
          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
            Symbols (!@#$%^&*)
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={excludeLookAlikes}
            onChange={() => setExcludeLookAlikes(!excludeLookAlikes)}
            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900 cursor-pointer"
          />
          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
            Exclude look-alikes (Il1O0)
          </span>
        </label>
      </div>

      {/* Generate Button */}
      <button
        onClick={generate}
        className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 font-medium"
      >
        Generate Password
      </button>
    </div>
  );
}
"use client";
import React, { useState } from "react";

export default function DataSettings() {
  const [autosave, setAutosave] = useState(true);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background">
      <p>TODO:REMAKE!!</p>
      <div className="bg-background p-10 rounded-xl size-full py-12 flex flex-col justify-between">
        <div className="flex justify-between gap-4">
          <div className="flex-1 bg-primary rounded-lg shadow-sm flex items-center justify-center gap-3 h-40 cursor-pointer transition hover:bg-secondary">
            <span className="text-title text-lg font-medium text-center">
              Export
              <br />
              Data
            </span>
          </div>
          <div className="flex-1 bg-primary rounded-lg shadow-sm flex items-center justify-center h-40 cursor-pointer transition hover:bg-secondary">
            <span className="text-title  text-lg font-medium text-center">
              Import
              <br />
              Data
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-blue-600">Autosave</span>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autosave}
              onChange={() => setAutosave(!autosave)}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 bg-green-400 rounded-full p-1 transition ${
                autosave ? "bg-green-400" : "bg-gray-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                  autosave ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

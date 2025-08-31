import React from 'react';

export const SessionManager = ({ session }: any) => {
  return (
    <div className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2">
      <div className="text-sm text-gray-700">User: <span className="font-bold">{session?.userId ?? ""}</span></div>
      <div className="text-xs text-gray-500">Session Active</div>
    </div>
  );
};

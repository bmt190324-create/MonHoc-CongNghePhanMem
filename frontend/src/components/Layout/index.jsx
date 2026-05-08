import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
        <Header setMobileOpen={setMobileOpen} />
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
                <Outlet />
            </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-lg font-semibold">Total Products</h2>
          <p className="text-2xl">100</p>
        </div>
        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-lg font-semibold">Total Orders</h2>
          <p className="text-2xl">50</p>
        </div>
        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-lg font-semibold">Total Revenue</h2>
          <p className="text-2xl">$5000</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 
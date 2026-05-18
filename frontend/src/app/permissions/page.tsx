'use client';

import React from 'react';
import Layout from '../../components/Layout';
import PermissionManager from '../../components/PermissionManager';

const PermissionsPage: React.FC = () => {
  return (
    <Layout>
      <PermissionManager />
    </Layout>
  );
};

export default PermissionsPage;
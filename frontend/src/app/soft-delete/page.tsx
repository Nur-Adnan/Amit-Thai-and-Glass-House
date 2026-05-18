'use client';

import React from 'react';
import Layout from '../../components/Layout';
import SoftDeleteManager from '../../components/SoftDeleteManager';

const SoftDeletePage: React.FC = () => {
  return (
    <Layout>
      <SoftDeleteManager />
    </Layout>
  );
};

export default SoftDeletePage;
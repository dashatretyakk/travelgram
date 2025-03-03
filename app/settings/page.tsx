import Layout from "@/components/layout";
import SettingsPage from "@/components/pages/homepage/settings";
import ProtectedRoute from "@/components/ProtectedRoute";
import React from "react";

const Settings = () => {
  return (
    <Layout>
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    </Layout>
  );
};

export default Settings;

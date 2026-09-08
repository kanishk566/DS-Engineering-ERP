function Settings() {
  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>
            Manage your ERP system settings and preferences.
          </p>
        </div>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <div>
            <h3>System Settings</h3>
            <p>Configure your application settings</p>
          </div>
        </div>

        <div className="empty-state">
          <div className="empty-state-icon">
            ⚙
          </div>

          <h3>Settings</h3>

          <p>
            System configuration options will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
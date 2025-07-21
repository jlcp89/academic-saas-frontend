'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  Bell, 
  Shield, 
  Moon,
  Globe,
  Lock,
  Eye,
  Download,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';
import { useNotificationStore } from '@/lib/stores/notification-store';

export default function SettingsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [settings, setSettings] = useState({
    // General Settings
    language: 'en',
    timezone: 'UTC',
    theme: 'light',
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    gradeNotifications: true,
    systemUpdates: false,
    
    // Privacy Settings
    profileVisibility: 'school',
    showEmail: false,
    showPhone: false,
    
    // Security Settings
    twoFactorEnabled: false,
    sessionTimeout: 30,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      addNotification({
        title: 'Settings Updated',
        message: 'Your settings have been successfully saved.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      addNotification({
        title: 'Update Failed',
        message: 'Failed to update your settings. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    // TODO: Implement password change functionality
    addNotification({
      title: 'Password Change',
      message: 'Password change functionality will be available soon.',
      type: 'info'
    });
  };

  const handleExportData = async () => {
    // TODO: Implement data export functionality
    addNotification({
      title: 'Data Export',
      message: 'Data export functionality will be available soon.',
      type: 'info'
    });
  };

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion functionality
    addNotification({
      title: 'Account Deletion',
      message: 'Account deletion functionality will be available soon.',
      type: 'info'
    });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const TabButton = ({ tab }: { tab: typeof tabs[0] }) => (
    <button
      onClick={() => setActiveTab(tab.id)}
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-left w-full transition-colors ${
        activeTab === tab.id
          ? 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <tab.icon className="w-4 h-4" />
      <span>{tab.label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Settings" subtitle="Manage your account preferences" />
      
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tabs.map((tab) => (
                <TabButton key={tab.id} tab={tab} />
              ))}
            </CardContent>
          </Card>

          {/* Content */}
          <Card className="md:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {tabs.find(tab => tab.id === activeTab)?.label} Settings
                </CardTitle>
                <Button onClick={handleSaveSettings} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Display & Language</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select 
                          value={settings.language} 
                          onValueChange={(value) => handleSettingChange('language', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select 
                          value={settings.timezone} 
                          onValueChange={(value) => handleSettingChange('timezone', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                            <SelectItem value="EST">Eastern Time (GMT-5)</SelectItem>
                            <SelectItem value="PST">Pacific Time (GMT-8)</SelectItem>
                            <SelectItem value="CET">Central European Time (GMT+1)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select 
                        value={settings.theme} 
                        onValueChange={(value) => handleSettingChange('theme', value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Preferences</h3>
                    
                    <div className="space-y-4">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                        { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications' },
                        { key: 'assignmentReminders', label: 'Assignment Reminders', description: 'Get reminded about upcoming assignments' },
                        { key: 'gradeNotifications', label: 'Grade Notifications', description: 'Get notified when grades are posted' },
                        { key: 'systemUpdates', label: 'System Updates', description: 'Receive notifications about system maintenance' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">{item.label}</div>
                            <div className="text-sm text-gray-600">{item.description}</div>
                          </div>
                          <button
                            onClick={() => handleSettingChange(item.key, !settings[item.key as keyof typeof settings])}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              settings[item.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Privacy Controls</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="profileVisibility">Profile Visibility</Label>
                        <Select 
                          value={settings.profileVisibility} 
                          onValueChange={(value) => handleSettingChange('profileVisibility', value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="school">School Only</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {[
                        { key: 'showEmail', label: 'Show Email Address', description: 'Allow others to see your email address' },
                        { key: 'showPhone', label: 'Show Phone Number', description: 'Allow others to see your phone number' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">{item.label}</div>
                            <div className="text-sm text-gray-600">{item.description}</div>
                          </div>
                          <button
                            onClick={() => handleSettingChange(item.key, !settings[item.key as keyof typeof settings])}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              settings[item.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Security</h3>
                    
                    <div className="space-y-4">
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">Password</div>
                            <div className="text-sm text-gray-600">Last changed 30 days ago</div>
                          </div>
                          <Button variant="outline" onClick={handlePasswordChange}>
                            <Lock className="w-4 h-4 mr-2" />
                            Change Password
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                            <div className="text-sm text-gray-600">
                              {settings.twoFactorEnabled ? 'Enabled' : 'Add an extra layer of security'}
                            </div>
                          </div>
                          <Button 
                            variant={settings.twoFactorEnabled ? "destructive" : "default"}
                            onClick={() => handleSettingChange('twoFactorEnabled', !settings.twoFactorEnabled)}
                          >
                            {settings.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                        <Select 
                          value={settings.sessionTimeout.toString()} 
                          onValueChange={(value) => handleSettingChange('sessionTimeout', parseInt(value))}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="0">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium">Data Management</h3>
                    
                    <div className="space-y-3">
                      <Button variant="outline" onClick={handleExportData} className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Export My Data
                      </Button>
                      
                      <Button variant="destructive" onClick={handleDeleteAccount} className="w-full justify-start">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-800">
                          <div className="font-medium">Warning</div>
                          <div>Deleting your account is permanent and cannot be undone. All your data will be permanently removed.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { Copy, Wifi, Tv, AlertCircle } from 'lucide-react';

const SetupPage: React.FC = () => {
  const [localIP, setLocalIP] = useState<string>('');
  const [copied, setCopied] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    
    // Get the actual local IP address
    const getLocalIP = async () => {
      try {
        // Method 1: Check window.location
        let hostname = window.location.hostname;
        
        // If localhost, try to get the actual IP
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          // Try to detect from API
          try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            // This gives public IP, but we need local IP
            // So we'll fall back to manual entry
          } catch (e) {
            // Silently fail
          }
          
          // Use a fallback approach
          hostname = window.location.hostname;
        }
        
        const port = window.location.port || '3000';
        setLocalIP(`${hostname}:${port}`);
      } catch (error) {
        console.error('Failed to get IP:', error);
        setLocalIP('localhost:3000');
      } finally {
        setLoading(false);
      }
    };

    getLocalIP();
  }, []);

  const appURL = `http://${localIP}/dashboard`;
  const tvURL = `http://${localIP}/tv`;
  const setupURL = `http://${localIP}/setup`;

  const generateQRCode = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  if (!isClient || loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">HealthQueue Setup</h1>
          <p className="text-xl text-gray-600">Access your application from any device on the network</p>
        </div>

        {/* Connection Issue Alert */}
        {(localIP === 'localhost:3000' || localIP === '127.0.0.1:3000') && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-12 flex gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-900 mb-2">Address Unreachable</h3>
              <p className="text-red-800 text-sm mb-3">
                Your system is showing localhost/127.0.0.1. Other devices can't reach this address.
              </p>
              <p className="text-red-800 text-sm font-mono bg-white p-2 rounded border border-red-200">
                <strong>Solution:</strong> Replace the IP above with your computer's local network IP (e.g., 192.168.x.x)
              </p>
            </div>
          </div>
        )}

        {/* Local IP Display */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Wifi className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Your Network Address</h2>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <div className="mb-3">
              <label className="text-sm text-gray-600 font-semibold">Current Address:</label>
              <div className="flex items-center justify-between mt-2">
                <code className="text-2xl font-mono text-gray-900">{localIP}</code>
                <button
                  onClick={() => copyToClipboard(localIP)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied === localIP ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
            <p className="text-yellow-900 text-sm font-semibold mb-2">📋 If the address above doesn't work:</p>
            <p className="text-yellow-800 text-sm mb-3">Find your actual local IP address:</p>
            
            <div className="space-y-2 text-sm text-yellow-800">
              <div>
                <strong>Windows (Command Prompt):</strong>
                <code className="block bg-white p-2 rounded mt-1 font-mono">ipconfig</code>
                <p className="text-xs mt-1">Look for "IPv4 Address" (usually 192.168.x.x)</p>
              </div>
              
              <div className="mt-3">
                <strong>Mac/Linux (Terminal):</strong>
                <code className="block bg-white p-2 rounded mt-1 font-mono">ifconfig | grep inet</code>
              </div>

              <div className="mt-3">
                <strong>Then use:</strong>
                <code className="block bg-white p-2 rounded mt-1 font-mono">http://YOUR_IP:3000/setup</code>
                <p className="text-xs mt-1">Example: http://192.168.1.100:3000/setup</p>
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-sm">
            This address should work for all devices on your WiFi network
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Admin Dashboard */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <h3 className="text-2xl font-bold text-white">Admin Dashboard</h3>
              <p className="text-blue-100 mt-1">Manage patients and queue</p>
            </div>
            
            <div className="p-8">
              <div className="flex justify-center mb-8">
                <img 
                  src={generateQRCode(appURL)} 
                  alt="Admin Dashboard QR Code" 
                  className="w-48 h-48 rounded-lg shadow-md"
                />
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center mb-4">
                  Scan with your device or click the link below
                </p>
                
                <a
                  href={appURL}
                  className="block w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-center font-semibold transition-colors"
                >
                  Open Admin Panel
                </a>
                
                <code className="block text-center text-sm text-gray-600 break-all">
                  {appURL}
                </code>
                
                <button
                  onClick={() => copyToClipboard(appURL)}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy URL
                </button>
              </div>
            </div>
          </div>

          {/* TV Display */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
              <div className="flex items-center gap-2">
                <Tv className="w-6 h-6" />
                <div>
                  <h3 className="text-2xl font-bold text-white">TV Display</h3>
                  <p className="text-purple-100 mt-1">For waiting area / reception</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex justify-center mb-8">
                <img 
                  src={generateQRCode(tvURL)} 
                  alt="TV Display QR Code" 
                  className="w-48 h-48 rounded-lg shadow-md"
                />
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center mb-4">
                  Scan with your TV or device
                </p>
                
                <a
                  href={tvURL}
                  className="block w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-center font-semibold transition-colors"
                >
                  Open TV Display
                </a>
                
                <code className="block text-center text-sm text-gray-600 break-all">
                  {tvURL}
                </code>
                
                <button
                  onClick={() => copyToClipboard(tvURL)}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">How to Access from Other Devices</h3>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                  1
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Find your computer's local IP</h4>
                <p className="text-sm text-gray-600">Run the command above to get your actual IP address</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                  2
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Open a browser on your device</h4>
                <p className="text-sm text-gray-600">Phone, tablet, TV, or another computer</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Type the URL in the browser</h4>
                <p className="text-sm text-gray-600">Example: http://192.168.1.100:3000/tv</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                  4
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Ensure same WiFi network</h4>
                <p className="text-sm text-gray-600">All devices must be connected to the same WiFi network</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-amber-50 border-2 border-amber-200 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-3">⚠️ Important Notes</h3>
          
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Keep this computer running for continuous access</li>
            <li>• Don't close the terminal showing "npm start"</li>
            <li>• Local IP addresses may change when you restart your computer</li>
            <li>• Firewall may block access - check Windows Defender/antivirus settings</li>
            <li>• If accessing from outside your WiFi, use port forwarding or cloud deployment</li>
            <li>• For production use, deploy to a server or cloud provider</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p>HealthQueue © 2026 | Network-based Queue Management</p>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;

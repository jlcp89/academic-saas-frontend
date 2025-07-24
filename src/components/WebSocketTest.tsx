'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function WebSocketTest() {
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [wsMessage, setWsMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { data: session } = useSession();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [testMode, setTestMode] = useState<'auth' | 'no-auth'>('auth');

  const connectWebSocket = () => {
    setWsStatus('connecting');
    setError('');

    let wsUrl: string;
    
    if (testMode === 'no-auth') {
      // Prueba sin autenticación
      wsUrl = `ws://localhost:8000/ws/test/`;
    } else {
      // Prueba con autenticación
      if (!session?.accessToken) {
        setError('No authentication token available');
        return;
      }
      const token = session.accessToken;
      wsUrl = `ws://localhost:8000/ws/chat/room/3/?token=${token}`;
    }
    
    console.log('🔌 [TEST] Connecting to:', testMode === 'no-auth' ? wsUrl : wsUrl.replace(session?.accessToken || '', '[TOKEN]'));
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('✅ [TEST] WebSocket connected');
      setWsStatus('connected');
      setWsMessage('Connected successfully!');
    };
    
    websocket.onmessage = (event) => {
      console.log('📨 [TEST] Received message:', event.data);
      try {
        const data = JSON.parse(event.data);
        setWsMessage(`Received: ${JSON.stringify(data, null, 2)}`);
      } catch (error) {
        setWsMessage(`Raw message: ${event.data}`);
      }
    };
    
    websocket.onerror = (error) => {
      console.error('❌ [TEST] WebSocket error:', error);
      setWsStatus('error');
      setError('WebSocket connection error');
    };
    
    websocket.onclose = (event) => {
      console.log('🔌 [TEST] WebSocket closed:', event.code, event.reason);
      setWsStatus('disconnected');
      setError(`Connection closed: ${event.code} - ${event.reason}`);
    };
    
    setWs(websocket);
  };

  const disconnectWebSocket = () => {
    if (ws) {
      ws.close();
      setWs(null);
      setWsStatus('disconnected');
      setWsMessage('');
      setError('');
    }
  };

  const sendTestMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const testMessage = {
        type: 'test',
        message: 'Hello from frontend!',
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(testMessage));
      setWsMessage('Test message sent!');
    }
  };

  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">WebSocket Test</h2>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            wsStatus === 'connected' ? 'bg-green-100 text-green-800' :
            wsStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
            wsStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {wsStatus.toUpperCase()}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 mb-2">
          Token: {session?.accessToken ? 'Available' : 'Not available'}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setTestMode('auth')}
            className={`px-3 py-1 rounded text-sm ${
              testMode === 'auth' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            With Auth
          </button>
          <button
            onClick={() => setTestMode('no-auth')}
            className={`px-3 py-1 rounded text-sm ${
              testMode === 'no-auth' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            No Auth
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <button
          onClick={connectWebSocket}
          disabled={wsStatus === 'connecting' || wsStatus === 'connected'}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Connect ({testMode === 'auth' ? 'With Auth' : 'No Auth'})
        </button>
        
        <button
          onClick={disconnectWebSocket}
          disabled={wsStatus === 'disconnected'}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
        >
          Disconnect
        </button>
        
        <button
          onClick={sendTestMessage}
          disabled={wsStatus !== 'connected'}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
        >
          Send Test Message
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {wsMessage && (
        <div className="p-3 bg-gray-100 border border-gray-300 rounded">
          <strong>Message:</strong>
          <pre className="text-xs mt-1 whitespace-pre-wrap">{wsMessage}</pre>
        </div>
      )}
    </div>
  );
} 
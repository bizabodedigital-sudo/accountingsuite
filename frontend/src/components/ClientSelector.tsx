'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, X, User } from 'lucide-react';
import { customerAPI } from '@/lib/api';

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface ClientSelectorProps {
  value: string;
  onChange: (clientId: string) => void;
  clients: Client[];
  onClientCreated: (client: Client) => void;
  label?: string;
  placeholder?: string;
}

export default function ClientSelector({
  value,
  onChange,
  clients,
  onClientCreated,
  label = "Client",
  placeholder = "Search or select client..."
}: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: ''
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setShowAddForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleClientSelect = (client: Client) => {
    onChange(client._id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setSearchTerm('');
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClient.name.trim()) {
      setError('Client name is required');
      return;
    }

    if (!newClient.email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Creating client with data:', newClient);
      const response = await customerAPI.createCustomer(newClient);
      console.log('Client creation response:', response);
      
      if (response.data.success) {
        onClientCreated(response.data.data);
        onChange(response.data.data._id);
        setNewClient({
          name: '',
          email: '',
          phone: '',
          address: '',
          taxId: ''
        });
        setShowAddForm(false);
        setIsOpen(false);
        setSearchTerm(response.data.data.name);
      } else {
        setError(response.data.error || 'Failed to create client');
      }
    } catch (err: any) {
      console.error('Create client error:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || err.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c._id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          value={isOpen ? searchTerm : (selectedClient?.name || '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {!showAddForm ? (
            <>
              {/* Search Results */}
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <div
                    key={client._id}
                    onClick={() => handleClientSelect(client)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                  >
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                    {client.phone && (
                      <div className="text-sm text-gray-500">{client.phone}</div>
                    )}
                  </div>
                ))
              ) : searchTerm ? (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  No clients found for "{searchTerm}"
                </div>
              ) : null}

              {/* Add New Client Option */}
              <div
                onClick={handleAddNew}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-t border-gray-200 bg-gray-50"
              >
                <div className="flex items-center space-x-2 text-blue-600">
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Add new client</span>
                </div>
              </div>
            </>
          ) : (
            /* Add Client Form */
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-900">Add New Client</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-3">
                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <Input
                    placeholder="Client name *"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Input
                    type="email"
                    placeholder="Email *"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Input
                    placeholder="Phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <Input
                    placeholder="Address"
                    value={newClient.address}
                    onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div>
                  <Input
                    placeholder="Tax ID"
                    value={newClient.taxId}
                    onChange={(e) => setNewClient(prev => ({ ...prev, taxId: e.target.value }))}
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

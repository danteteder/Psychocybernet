"use client";

// Multi-Business Switcher: Manage multiple businesses from one dashboard
// Each business has its own revenue streams, settings, and Hermes automations

import { useState } from "react";
import { Building2, Plus, Settings, ChevronDown, Check, ExternalLink } from "lucide-react";

interface Business {
  id: string;
  name: string;
  icon?: string;
  color: string;
  active: boolean;
  revenueStreams: number;
  lastActive: string;
}

interface BusinessSwitcherProps {
  currentBusiness: string;
  onSwitch: (businessId: string) => void;
}

export function BusinessSwitcher({ currentBusiness, onSwitch }: BusinessSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddBusiness, setShowAddBusiness] = useState(false);

  // Mock businesses - would load from localStorage/Supabase
  const businesses: Business[] = [
    {
      id: "biz-1",
      name: "E-commerce Store",
      color: "bg-green-500",
      active: true,
      revenueStreams: 3,
      lastActive: new Date().toISOString(),
    },
    {
      id: "biz-2",
      name: "Consulting Agency",
      color: "bg-blue-500",
      active: false,
      revenueStreams: 2,
      lastActive: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: "biz-3",
      name: "SaaS Product",
      color: "bg-purple-500",
      active: false,
      revenueStreams: 1,
      lastActive: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
  ];

  const currentBiz = businesses.find((b) => b.id === currentBusiness);

  async function handleAddBusiness() {
    // In real implementation, would create new business via Hermes command
    console.log("Add new business");
    setShowAddBusiness(false);
  }

  return (
    <div className="relative">
      {/* Current Business Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 
                   hover:bg-hover rounded transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded ${currentBiz?.color || "bg-text-muted"} flex items-center justify-center flex-shrink-0`}>
            <Building2 size={12} className="text-bg" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-medium truncate">
              {currentBiz?.name || "Select Business"}
            </div>
            <div className="text-[9px] text-text-muted/40">
              {currentBiz?.revenueStreams} revenue streams
            </div>
          </div>
        </div>
        <ChevronDown size={12} className={`text-text-muted/50 transition-transform ${
          isOpen ? "rotate-180" : ""
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg border border-border 
                          rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
            
            {/* Business List */}
            <div className="py-1">
              {businesses.map((biz) => (
                <button
                  key={biz.id}
                  onClick={() => {
                    onSwitch(biz.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-hover 
                             transition-colors text-left"
                >
                  <div className={`w-5 h-5 rounded ${biz.color} flex items-center justify-center flex-shrink-0`}>
                    <Building2 size={10} className="text-bg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{biz.name}</div>
                    <div className="text-[9px] text-text-muted/40">
                      {biz.revenueStreams} streams • Active {new Date(biz.lastActive).toLocaleDateString()}
                    </div>
                  </div>
                  {biz.id === currentBusiness && (
                    <Check size={12} className="text-green-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Add Business */}
            <button
              onClick={() => {
                setShowAddBusiness(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-text-muted 
                         hover:text-text hover:bg-hover transition-colors text-left"
            >
              <div className="w-5 h-5 rounded bg-bg-subtle border border-dashed border-text-muted 
                              flex items-center justify-center flex-shrink-0">
                <Plus size={10} />
              </div>
              <span className="text-xs">Add New Business</span>
            </button>

            {/* Settings */}
            <div className="border-t border-border" />
            
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-text-muted 
                         hover:text-text hover:bg-hover transition-colors text-left"
            >
              <Settings size={10} className="flex-shrink-0" />
              <span className="text-xs">Manage Businesses</span>
            </button>
          </div>
        </>
      )}

      {/* Add Business Modal */}
      {showAddBusiness && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg rounded-lg p-4 w-80 shadow-xl border border-border">
            <h3 className="text-sm font-medium mb-3">Add New Business</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-text-muted/70 uppercase tracking-wider mb-1 block">
                  Business Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Online Store"
                  className="w-full text-xs bg-bg-subtle border border-border rounded px-2 py-1.5 
                             focus:outline-none focus:border-text-muted/40"
                />
              </div>

              <div>
                <label className="text-[10px] text-text-muted/70 uppercase tracking-wider mb-1 block">
                  Business Type
                </label>
                <select className="w-full text-xs bg-bg-subtle border border-border rounded px-2 py-1.5 
                                   focus:outline-none focus:border-text-muted/40">
                  <option>E-commerce</option>
                  <option>Service Business</option>
                  <option>SaaS</option>
                  <option>Consulting</option>
                  <option>Agency</option>
                  <option>Other</option>
                </select>
              </div>

              <p className="text-[9px] text-text-muted/40">
                This will create a new business workspace with its own revenue streams, settings, and Hermes automations.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddBusiness(false)}
                  className="flex-1 text-xs bg-bg-subtle hover:bg-hover border border-border rounded px-3 py-1.5 
                             transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBusiness}
                  className="flex-1 text-xs bg-text text-bg hover:opacity-90 rounded px-3 py-1.5 
                             transition-opacity"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

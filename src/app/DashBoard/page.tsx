"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Eye, EyeOff, Edit2, Trash2, X, Copy, Check, LogOut } from "lucide-react";
import NavBar from "@/components/NavBar";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

// Session management to track current user
let currentSessionUserId: string | null = null;

// Enhanced encryption with user-specific keys
async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(exported);
}

async function importKey(keyData: string): Promise<CryptoKey> {
  const jwk = JSON.parse(keyData);
  return await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

// Clear ALL vault data from localStorage and session
export function clearAllVaultData() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('vaultx-encryption-key-') || key.startsWith('vaultx-items-'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log("Cleared:", key);
  });
  currentSessionUserId = null;
}

// Password Generator Component
const lookalikes = "Il1O0";
function randomFrom(str: string) { 
  return str[Math.floor(Math.random() * str.length)]; 
}

function PasswordGenerator({ onGenerate }: { onGenerate: (pwd: string) => void }) {
  const [length, setLength] = useState(16);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeLookAlikes, setExcludeLookAlikes] = useState(true);

  function generate() {
    let pool = "";
    if (useLower) pool += "abcdefghijklmnopqrstuvwxyz";
    if (useUpper) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useNumbers) pool += "0123456789";
    if (useSymbols) pool += "!@#$%^&*()-_=+[]{};:,.<>/?";
    if (excludeLookAlikes) pool = pool.split("").filter(c => !lookalikes.includes(c)).join("");
    
    if (!pool.length) {
      alert("Please select at least one character type");
      return;
    }
    
    let res = "";
    for (let i = 0; i < length; i++) res += randomFrom(pool);
    onGenerate(res);
  }

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">Password Length</label>
          <span className="text-sm font-semibold text-gray-900">{length}</span>
        </div>
        <input 
          type="range" 
          min={8} 
          max={64} 
          value={length} 
          onChange={e => setLength(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900" 
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>8</span>
          <span>64</span>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 mb-3">Character Types</p>
        {[
          { label: "Lowercase letters (a-z)", state: useLower, setter: setUseLower },
          { label: "Uppercase letters (A-Z)", state: useUpper, setter: setUseUpper },
          { label: "Numbers (0-9)", state: useNumbers, setter: setUseNumbers },
          { label: "Symbols (!@#$%^&*)", state: useSymbols, setter: setUseSymbols },
          { label: "Exclude look-alikes (Il1O0)", state: excludeLookAlikes, setter: setExcludeLookAlikes },
        ].map((opt, idx) => (
          <label key={idx} className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={opt.state} 
              onChange={() => opt.setter(!opt.state)}
              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900 cursor-pointer" 
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
              {opt.label}
            </span>
          </label>
        ))}
      </div>

      <button 
        onClick={generate} 
        className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 font-medium"
      >
        Generate Password
      </button>
    </div>
  );
}

interface VaultItem { 
  id: string; 
  title: string; 
  username: string; 
  password: string; 
  url: string; 
  notes: string; 
}

export default function VaultPage() {
  const { user, logout } = useUser();
  const router = useRouter();
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const [newItem, setNewItem] = useState<Omit<VaultItem, "id">>({ 
    title: "", 
    username: "", 
    password: "", 
    url: "", 
    notes: "" 
  });

  // COMPLETELY RESET state when user changes
  const resetVaultState = useCallback(() => {
    console.log("Resetting vault state");
    setVaultItems([]);
    setEncryptionKey(null);
    setNewItem({ title: "", username: "", password: "", url: "", notes: "" });
    setEditingItem(null);
    setIsAddingItem(false);
    setSearchQuery("");
    setShowPassword({});
    setCopiedField(null);
    setTimeRemaining(0);
  }, []);

  // Enhanced authentication check with COMPLETE state reset
  useEffect(() => {
    if (!user) {
      console.log("No user found, redirecting to login");
      resetVaultState();
      router.push("/Login");
      return;
    }

    // If user changed, COMPLETELY reset everything
    if (currentSessionUserId !== user.name) {
      console.log("User changed from", currentSessionUserId, "to", user.name);
      resetVaultState();
      currentSessionUserId = user.name;
    }

    setIsLoading(false);
  }, [user, router, resetVaultState]);

  // User-specific encryption key and data loading
  useEffect(() => {
    if (!user) return;

    async function init() {
      try {
        setIsLoading(true);
        console.log("Initializing vault for user:", user?.name);
        
        // User-specific key names
        const keyName = `vaultx-encryption-key-${user?.name}`;
        const vaultKey = `vaultx-items-${user?.name}`;
        
        let key: CryptoKey;
        const storedKey = localStorage.getItem(keyName);
        
        if (storedKey) {
          try {
            key = await importKey(storedKey);
            console.log("✅ Loaded existing encryption key for user:", user?.name);
          } catch (keyError) {
            console.error("❌ Failed to load existing key, generating new one:", keyError);
            key = await generateKey();
            localStorage.setItem(keyName, await exportKey(key));
          }
        } else {
          key = await generateKey();
          localStorage.setItem(keyName, await exportKey(key));
          console.log("✅ Generated new encryption key for user:", user?.name);
        }
        
        setEncryptionKey(key);

        // Load user-specific vault data
        await loadVaultItems(key, vaultKey, user?.name ?? "");
      } catch (err) {
        console.error("❌ Failed to initialize vault", err);
        setVaultItems([]);
      } finally {
        setIsLoading(false);
      }
    }

    // Small delay to ensure state is reset before initializing
    const timer = setTimeout(() => {
      init();
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);

  // Enhanced vault data loading
  const loadVaultItems = useCallback(async (key: CryptoKey, vaultKey: string, userId: string) => {
    console.log("Loading vault items for user:", userId);
    
    const stored = localStorage.getItem(vaultKey);
    
    if (!stored) {
      console.log("No vault data found for user:", userId);
      setVaultItems([]);
      return;
    }

    try { 
      console.log("Decrypting vault data for user:", userId);
      const decrypted = await decryptData(stored, key); 
      const items = JSON.parse(decrypted);
      
      // Validate items structure
      if (Array.isArray(items)) {
        console.log(`✅ Loaded ${items.length} items for user:`, userId);
        setVaultItems(items);
      } else {
        console.error("❌ Invalid vault data structure for user:", userId);
        setVaultItems([]);
        // Clear corrupted data
        localStorage.removeItem(vaultKey);
      }
    } catch (e) { 
      console.error("❌ Failed to decrypt vault items for user:", userId, e);
      
      // If decryption fails, clear the data to prevent leakage
      localStorage.removeItem(vaultKey);
      setVaultItems([]);
    }
  }, []);

  // Secure vault data saving
  const saveVaultItems = useCallback(async (items: VaultItem[]) => {
    if (!encryptionKey || !user) {
      console.error("Cannot save: No encryption key or user");
      return;
    }
    
    try {
      const vaultKey = `vaultx-items-${user.name}`;
      const encrypted = await encryptData(JSON.stringify(items), encryptionKey);
      localStorage.setItem(vaultKey, encrypted);
      console.log("✅ Saved vault data for user:", user.name);
    } catch (error) {
      console.error("❌ Failed to save vault items:", error);
      alert("Failed to save data. Please try again.");
    }
  }, [encryptionKey, user]);

  // Enhanced logout function
  const handleLogout = useCallback(() => {
    console.log("Logging out user:", user?.name);
    
    // Clear clipboard
    navigator.clipboard.writeText("🔒 VaultX cleared").catch(console.error);
    
    // COMPLETELY reset state
    resetVaultState();
    currentSessionUserId = null;
    
    // Call the actual logout function from your context
    if (logout) {
      logout();
    } else {
      // Fallback: redirect to login
      router.push("/Login");
    }
  }, [user, logout, router, resetVaultState]);

  const handleAddItem = async () => {
    if (!newItem.title.trim() || !newItem.username.trim() || !newItem.password.trim()) {
      alert("Please fill in all required fields (Title, Username, Password)");
      return;
    }

    try {
      const item: VaultItem = { 
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9), 
        ...newItem 
      };
      const updated = [...vaultItems, item];
      setVaultItems(updated);
      await saveVaultItems(updated);
      setNewItem({ title: "", username: "", password: "", url: "", notes: "" });
      setIsAddingItem(false);
    } catch (error) {
      console.error("Failed to add item:", error);
      alert("Failed to add item. Please try again.");
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const updated = vaultItems.map(item => 
        item.id === editingItem.id ? editingItem : item
      );
      setVaultItems(updated);
      await saveVaultItems(updated);
      setEditingItem(null);
    } catch (error) {
      console.error("Failed to update item:", error);
      alert("Failed to update item. Please try again.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;

    try {
      const updated = vaultItems.filter(item => item.id !== id);
      setVaultItems(updated);
      await saveVaultItems(updated);
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item. Please try again.");
    }
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeRemaining(30);

      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            navigator.clipboard.writeText("🔒 VaultX cleared").catch(console.error);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => clearInterval(interval), 30000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      alert("Failed to copy to clipboard. Please check your browser permissions.");
    }
  };

  const clearClipboardNow = () => {
    navigator.clipboard.writeText("🔒 VaultX manually cleared")
      .then(() => {
        setCopiedField(null);
        setTimeRemaining(0);
      })
      .catch(console.error);
  };

  const handleGeneratePassword = (pwd: string) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, password: pwd });
    } else {
      setNewItem({ ...newItem, password: pwd });
    }
    copyToClipboard(pwd, "generated");
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = vaultItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.url && item.url.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Debug: Show current state
  useEffect(() => {
    console.log("Current State:", {
      user: user?.name,
      sessionUser: currentSessionUserId,
      vaultItemsCount: vaultItems.length,
      isLoading
    });
  }, [user, vaultItems, isLoading]);

  if (isLoading) {
    return (
      <section className="min-h-screen bg-white">
        <NavBar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600">Loading your vault...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-white">
      <NavBar />
      
      {/* User Info & Logout */}
      {/* {user && (
        <div className="fixed top-4 right-4 z-40 bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-3">
          <span className="text-sm">User: {user.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm hover:text-gray-300 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )} */}
      
      {/* Debug Info - Remove in production */}
      {/* {process.env.NODE_ENV === 'development' && user && (
        <div className="fixed top-4 left-4 z-40 bg-blue-900 text-white px-3 py-1 rounded text-xs">
          Debug: User {user.name} | Items: {vaultItems.length}
        </div>
      )} */}
      
      {/* Clipboard Status Banners */}
      {copiedField && timeRemaining > 0 && (
        <div className="fixed top-20 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-center gap-3 mb-2">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span className="font-medium">Copied to clipboard!</span>
            <button
              onClick={clearClipboardNow}
              className="ml-auto text-gray-300 hover:text-white transition-colors"
              title="Clear now"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-gray-300">
            ⚠️ Will auto-clear in <strong>{timeRemaining}s</strong>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center pt-32 gap-6 px-4">
        <h1 className="text-5xl md:text-6xl font-bold font-serif text-gray-900 text-center">
          Welcome to VaultX
        </h1>
        <p className="text-xl md:text-2xl font-normal text-gray-500 text-center max-w-2xl">
          Your secure password manager with client-side encryption
        </p>
        <PasswordGenerator onGenerate={handleGeneratePassword} />
      </div>

      {/* Vault Management */}
      <div className="flex flex-col items-center justify-center pt-16 pb-16 gap-6 px-4">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Vault</h2>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vault..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <button
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium whitespace-nowrap"
              >
                {isAddingItem ? "Cancel" : "+ Add Item"}
              </button>
            </div>
          </div>

          {isAddingItem && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Item</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Gmail Account"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newItem.username}
                  onChange={(e) => setNewItem({ ...newItem, username: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                  placeholder="username@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newItem.password}
                  onChange={(e) => setNewItem({ ...newItem, password: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                  placeholder="Use generator above or enter manually"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  rows={3}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Additional notes..."
                />
              </div>

              <button
                onClick={handleAddItem}
                className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium"
              >
                Save Item
              </button>
            </div>
          )}

          {editingItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Item</h3>
                  <button 
                    onClick={() => setEditingItem(null)} 
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editingItem.username}
                    onChange={(e) => setEditingItem({ ...editingItem, username: e.target.value })}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={editingItem.password}
                    onChange={(e) => setEditingItem({ ...editingItem, password: e.target.value })}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={editingItem.url}
                    onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editingItem.notes}
                    onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                    rows={3}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  />
                </div>

                <button
                  onClick={handleUpdateItem}
                  className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium"
                >
                  Update Item
                </button>
              </div>
            </div>
          )}

          {filteredItems.length === 0 && !isAddingItem ? (
            <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-gray-500">
                {searchQuery ? "No items match your search" : "No items in your vault yet. Add your first item!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="text-gray-600 hover:text-gray-900 transition-colors p-1"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Username</p>
                        <p className="text-sm text-gray-900 break-all">{item.username}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.username, `${item.id}-username`)}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 ml-2"
                        title="Copy username"
                      >
                        {copiedField === `${item.id}-username` ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Password</p>
                        <p className="text-sm text-gray-900 font-mono break-all">
                          {showPassword[item.id] ? item.password : "••••••••••••"}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => togglePasswordVisibility(item.id)}
                          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                          title={showPassword[item.id] ? "Hide password" : "Show password"}
                        >
                          {showPassword[item.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(item.password, `${item.id}-password`)}
                          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                          title="Copy password"
                        >
                          {copiedField === `${item.id}-password` ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {item.url && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">URL</p>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {item.url}
                        </a>
                      </div>
                    )}

                    {item.notes && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{item.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
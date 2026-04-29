"use client";

// Settings page: configure API connections for Hermes, Google, Shopify, etc.
// Stored in localStorage (single-user system)

import { useEffect, useState } from "react";
import { getSettings, saveSettings, checkStatus, type HermesSettings } from "@/lib/hermes";
import { Check, Loader2, X, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

interface IntegrationConfig {
  hermesUrl: string;
  hermesApiKey: string;
  shopifyStoreUrl: string;
  instantlyApiKey: string;
  browserbaseApiKey: string;
}

const STORAGE_KEY = "psycho_integrations";

function loadConfig(): IntegrationConfig {
  if (typeof window === "undefined") {
    return { hermesUrl: "", hermesApiKey: "", shopifyStoreUrl: "", instantlyApiKey: "", browserbaseApiKey: "" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const hermes = getSettings();
    const parsed = raw ? JSON.parse(raw) : {};
    const defaultHermesUrl = process.env.NEXT_PUBLIC_HERMES_URL || "http://100.108.28.43:8080";
    return {
      hermesUrl: hermes.baseUrl || defaultHermesUrl,
      hermesApiKey: hermes.apiKey || "",
      shopifyStoreUrl: parsed.shopifyStoreUrl || "",
      instantlyApiKey: parsed.instantlyApiKey || "",
      browserbaseApiKey: parsed.browserbaseApiKey || "",
    };
  } catch {
    const defaultHermesUrl = process.env.NEXT_PUBLIC_HERMES_URL || "http://100.108.28.43:8080";
    return { hermesUrl: defaultHermesUrl, hermesApiKey: "", shopifyStoreUrl: "", instantlyApiKey: "", browserbaseApiKey: "" };
  }
}

function persistConfig(config: IntegrationConfig) {
  // Save Hermes settings separately (used by hermes.ts)
  saveSettings({ baseUrl: config.hermesUrl, apiKey: config.hermesApiKey || undefined });
  // Save the rest
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    shopifyStoreUrl: config.shopifyStoreUrl,
    instantlyApiKey: config.instantlyApiKey,
    browserbaseApiKey: config.browserbaseApiKey,
  }));
}

type ConnectionState = "idle" | "testing" | "ok" | "fail";

export function IntegrationsForm() {
  const { theme, toggleTheme } = useTheme();
  const [config, setConfig] = useState<IntegrationConfig>(loadConfig);
  const [saved, setSaved] = useState(false);
  const [hermesConn, setHermesConn] = useState<ConnectionState>("idle");

  // Load on mount
  useEffect(() => { setConfig(loadConfig()); }, []);

  function handleChange(key: keyof IntegrationConfig, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    persistConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function testHermes() {
    setHermesConn("testing");
    // Temporarily save the URL so checkStatus uses it
    saveSettings({ baseUrl: config.hermesUrl, apiKey: config.hermesApiKey || undefined });
    const status = await checkStatus();
    setHermesConn(status.online ? "ok" : "fail");
    setTimeout(() => setHermesConn("idle"), 4000);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-4 pb-3 border-b border-border/60 flex items-center justify-between">
        <div>
          <h1 className="text-[11px] font-medium tracking-[0.3em] uppercase text-text-muted/70">
            Settings
          </h1>
          <p className="text-[10px] text-text-muted/40 mt-0.5">Integration configuration</p>
        </div>
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded border border-border
                     hover:bg-hover transition-colors text-[10px]"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <>
              <Sun size={12} />
              <span className="uppercase tracking-[0.15em]">Light</span>
            </>
          ) : (
            <>
              <Moon size={12} />
              <span className="uppercase tracking-[0.15em]">Dark</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {/* Hermes */}
        <FieldGroup title="Hermes Gateway">
          <Field
            label="URL"
            value={config.hermesUrl}
            onChange={(v) => handleChange("hermesUrl", v)}
            placeholder="http://100.108.28.43:8080"
          />
          <Field
            label="API Key"
            value={config.hermesApiKey}
            onChange={(v) => handleChange("hermesApiKey", v)}
            placeholder="Optional"
            type="password"
          />
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={testHermes}
              disabled={hermesConn === "testing"}
              className="text-[10px] text-text-muted hover:text-text transition-colors
                         disabled:opacity-50"
            >
              {hermesConn === "testing" ? (
                <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Testing...</span>
              ) : "Test Connection"}
            </button>
            {hermesConn === "ok" && <Check size={12} className="text-green-500" />}
            {hermesConn === "fail" && <X size={12} className="text-red-400" />}
          </div>
        </FieldGroup>

        {/* Shopify */}
        <FieldGroup title="Shopify">
          <Field
            label="Store URL"
            value={config.shopifyStoreUrl}
            onChange={(v) => handleChange("shopifyStoreUrl", v)}
            placeholder="mystore.myshopify.com"
          />
        </FieldGroup>

        {/* Instantly */}
        <FieldGroup title="Instantly">
          <Field
            label="API Key"
            value={config.instantlyApiKey}
            onChange={(v) => handleChange("instantlyApiKey", v)}
            placeholder="Instantly API key"
            type="password"
          />
        </FieldGroup>

        {/* Browserbase */}
        <FieldGroup title="Browser Automation">
          <Field
            label="Browserbase API Key"
            value={config.browserbaseApiKey}
            onChange={(v) => handleChange("browserbaseApiKey", v)}
            placeholder="Optional — for headless browser tasks"
            type="password"
          />
        </FieldGroup>
      </div>

      {/* Save button */}
      <div className="border-t border-border/60 px-5 py-3 flex items-center justify-between">
        <span className={`text-[10px] transition-opacity ${saved ? "opacity-100 text-green-500" : "opacity-0"}`}>
          Saved
        </span>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 rounded border border-border text-[11px]
                     hover:bg-hover transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ── Helpers ──

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted/60 mb-2">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-20 text-[11px] text-text-muted/60 shrink-0">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-bg-subtle border border-border rounded px-2.5 py-1.5 text-[12px]
                   placeholder:text-text-muted/25 focus:outline-none focus:border-text-muted/40
                   transition-colors"
      />
    </div>
  );
}

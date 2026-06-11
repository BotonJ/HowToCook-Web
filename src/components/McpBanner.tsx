import { useState } from 'react';
import { Copy, Check, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { useT } from '@/lib/i18n';

const INSTALL_COMMAND = 'curl -sSL https://howtocook.cn/install.sh | bash';

export function McpBanner() {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn('Failed to copy to clipboard');
    }
  };

  return (
    <div className="bg-primary-fixed/10 border border-primary-fixed/30 rounded-lg px-4 md:px-6 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Terminal size={20} className="text-primary flex-shrink-0" />
          <p className="font-body text-body-md text-on-surface-variant truncate">
            {t.mcp.bannerText} &nbsp; curl -sSL https://howtocook.cn/install.sh | bash
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="bg-surface border border-outline-variant text-on-surface-variant px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-label-sm hover:border-primary hover:text-primary transition-colors"
          >
            <span>{t.mcp.instructions}</span>
            {showInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={handleCopy}
            className="bg-primary text-on-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-label-sm hover:bg-primary-container transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? t.common.copied : t.common.copy}
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="pt-3 border-t border-outline-variant space-y-3 text-sm">
          <div>
            <h3 className="font-semibold text-on-surface mb-1">{t.mcp.whatIsThis}</h3>
            <p className="text-on-surface-variant">{t.mcp.whatIsThisDesc}</p>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface mb-1">{t.mcp.supportedPlatforms}</h3>
            <p className="text-on-surface-variant">{t.mcp.supportedPlatformsDesc}</p>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface mb-1">{t.mcp.howToUse}</h3>
            <p className="text-on-surface-variant">
              {t.mcp.howToUseDesc}<br />{t.mcp.howToUseJoke}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface mb-1">{t.mcp.noAgent}</h3>
            <p className="text-on-surface-variant">{t.mcp.noAgentDesc}</p>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface mb-1">{t.mcp.skillUpdate}</h3>
            <p className="text-on-surface-variant">{t.mcp.skillUpdateDesc}</p>
          </div>
        </div>
      )}
    </div>
  );
}
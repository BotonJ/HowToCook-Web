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
    <div className={showInstructions ? "bg-primary-fixed/10 border border-primary-fixed/30 rounded-lg px-4 md:px-6 py-3" : ""}>
      {/* 未展开态：单行小条，点击展开 */}
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="flex items-center gap-2 w-full text-left"
      >
        <Terminal size={16} className="text-primary flex-shrink-0" />
        <span className="font-body text-body-sm text-on-surface-variant truncate flex-1">{t.mcp.bannerText}</span>
        {showInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* 展开态：curl 命令 + copy + 使用说明 */}
      {showInstructions && (
        <div className="mt-3 pt-3 border-t border-outline-variant">
          {/* curl 命令行 + 复制按钮 */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <code className="font-mono text-sm text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded">
              {INSTALL_COMMAND}
            </code>
            <button
              onClick={handleCopy}
              className="bg-primary text-on-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-label-sm hover:bg-primary-container transition-colors flex-shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t.common.copied : t.common.copy}
            </button>
          </div>

          {/* 使用说明 */}
          <div className="space-y-3 text-sm">
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
        </div>
      )}
    </div>
  );
}
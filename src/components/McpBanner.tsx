import { useState } from 'react';
import { Copy, Check, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

const INSTALL_COMMAND = 'curl -sSL https://howtocook.cn/install.sh | bash';

export function McpBanner() {
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
            Deploy the recipe engine to your local machine with one click &nbsp; curl -sSL https://howtocook.cn/install.sh | bash
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="bg-surface border border-outline-variant text-on-surface-variant px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-label-sm hover:border-primary hover:text-primary transition-colors"
          >
            <span>Instructions</span>
            {showInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={handleCopy}
            className="bg-primary text-on-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-label-sm hover:bg-primary-container transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="pt-3 border-t border-outline-variant space-y-3 text-sm">
          <div>
            <h3 className="font-semibold text-on-surface mb-1">❓ What does this command do?</h3>
            <p className="text-on-surface-variant">
              Downloads the HowToCook Skill locally, allowing you to query recipes anytime through Claude Code, Hermes, Open Claw, and other Agents. Agents can provide recipe recommendations, ingredient shopping suggestions, and more. The Skill automatically pairs with the server backend and silently pulls updates when website data changes. Check cycle is 7 days.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface mb-1">💻 Supported Platforms</h3>
            <p className="text-on-surface-variant">
              Claude Code, Hermes, Open Claw, and other Agents. If you have WeChat, Feishu, Telegram, or other messaging channels configured, you can also receive messages on your phone.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface mb-1">💡 How to use after copying?</h3>
            <p className="text-on-surface-variant">
              ① Send to an Agent for automatic installation and start using it right away<br />② Just paste it in your terminal
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface mb-1">🌐 No Agent or internet?</h3>
            <p className="text-on-surface-variant">
              Data can be used locally, or visit https://howtocook.cn
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface mb-1">🔄 How to update the Skill</h3>
            <p className="text-on-surface-variant">
              The Skill automatically pairs with the website backend MCP. When new recipes are added or Skill features are improved, it automatically fetches updates, downloads silently, and does not take up much local storage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
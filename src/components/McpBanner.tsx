import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

const MCP_COMMAND = 'hermes mcp add howtocook --command "python3 /path/to/howtocook/search.py"';

export const McpBanner: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(MCP_COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-primary-fixed/10 border border-primary-fixed/30 rounded-lg px-4 md:px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Terminal size={20} className="text-primary flex-shrink-0" />
        <p className="font-body text-body-md text-on-surface-variant truncate">
          AI 用户？一行命令接入 HowToCook 菜谱引擎
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <code className="hidden sm:block text-label-sm text-on-surface-variant font-mono truncate max-w-xs">
          {MCP_COMMAND}
        </code>
        <button
          onClick={handleCopy}
          className="bg-primary text-on-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-label-sm hover:bg-primary-container transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
    </div>
  );
};

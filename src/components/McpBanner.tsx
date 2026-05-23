import React, { useState } from 'react';
import { Copy, Check, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

const INSTALL_COMMAND = 'curl -sSL https://howtocook.cn/install.sh | bash';

export const McpBanner: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(INSTALL_COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-primary-fixed/10 border border-primary-fixed/30 rounded-lg px-4 md:px-6 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Terminal size={20} className="text-primary flex-shrink-0" />
          <p className="font-body text-body-md text-on-surface-variant truncate">
            将菜谱引擎一键部署到本地 &nbsp; curl -sSL https://howtocook.cn/install.sh | bash
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="bg-surface border border-outline-variant text-on-surface-variant px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-label-sm hover:border-primary hover:text-primary transition-colors"
          >
            <span>使用说明</span>
            {showInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={handleCopy}
            className="bg-primary text-on-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-label-sm hover:bg-primary-container transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="pt-3 border-t border-outline-variant space-y-3 text-sm">
          <div>
            <h3 className="font-semibold text-on-surface mb-1">❓ 这个命令的用途是？</h3>
            <p className="text-on-surface-variant">
              下载 HowToCook Skill 到本地，可以通过 Claude Code、Hermes、Open Claw 等 Agent 随时查询菜谱，并依赖 Agent 自身的能力为你提供食谱推荐，食材购买建议等功能。Skill 将自动配对服务器后端，当网站数据有更新的时候，静默拉取下载或功能更新。检查周期为 7 天。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface mb-1">💻 支持的平台</h3>
            <p className="text-on-surface-variant">
              Claude Code、Hermes、Open Claw、其他 Agent。如果配置了微信、飞书、Telegram 等信息渠道，也可以在手机上收到消息。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface mb-1">💡 复制后如何使用？</h3>
            <p className="text-on-surface-variant">
              ① 发送给 Agent 自动安装，即可正常使用<br />② 大喊"妈！！！"
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface mb-1">🌐 没有 Agent 或网络？</h3>
            <p className="text-on-surface-variant">
              数据可以本地使用，或访问 https://howtocook.cn
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface mb-1">🔄 Skill 如何更新</h3>
            <p className="text-on-surface-variant">
              Skill 自动配对网站后端的 MCP，当网站增加了菜谱，或者我们对 Skill 的功能进行了完善的时候，Skill 会自动获取更新，静默下载，并且不会占用大量本地空间。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
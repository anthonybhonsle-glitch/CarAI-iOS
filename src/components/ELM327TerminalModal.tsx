import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Send, Play, RotateCcw, Trash2, HelpCircle } from 'lucide-react';
import { obdManager, TerminalLogEntry } from '../services/obdSimulator';

interface ELM327TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_COMMANDS = [
  { cmd: 'ATZ', desc: 'Reset ELM327 chip' },
  { cmd: '010C', desc: 'Read Live Engine RPM (PID 0C)' },
  { cmd: '010D', desc: 'Read Vehicle Speed (PID 0D)' },
  { cmd: '0105', desc: 'Read Coolant Temperature (PID 05)' },
  { cmd: '0111', desc: 'Read Throttle Position % (PID 11)' },
  { cmd: '03', desc: 'Read Stored Trouble Codes (DTCs)' },
  { cmd: '04', desc: 'Clear Check Engine Light & Codes' },
  { cmd: '0100', desc: 'Query Supported PIDs [01-20]' },
];

export const ELM327TerminalModal: React.FC<ELM327TerminalModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<TerminalLogEntry[]>([]);
  const [inputCommand, setInputCommand] = useState<string>('');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = obdManager.subscribeTerminal((log) => {
      setLogs((prev) => [...prev, log]);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  const handleSendCommand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCommand.trim()) return;

    obdManager.executeCustomATCommand(inputCommand);
    setInputCommand('');
  };

  const handleQuickCommand = (cmd: string) => {
    obdManager.executeCustomATCommand(cmd);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#222222] bg-[#0A0A0A] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222222] bg-[#121212] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="font-mono-tech text-sm font-bold text-white">
                ELM327 OBD-II RAW AT TERMINAL
              </h3>
              <p className="text-[10px] text-gray-400">
                Direct RS232 / CAN Bus packet transceiver (Baud: 38400, 8-N-1)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearLogs}
              className="rounded-lg bg-[#1E1E1E] border border-[#2A2A2A] p-1.5 text-gray-400 hover:text-white transition-colors"
              title="Clear Terminal Output"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-[#1E1E1E] border border-[#2A2A2A] p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Command Toolbar */}
        <div className="flex flex-wrap gap-1.5 border-b border-[#222222] bg-[#121212]/70 p-2.5">
          {COMMON_COMMANDS.map((item) => (
            <button
              key={item.cmd}
              onClick={() => handleQuickCommand(item.cmd)}
              className="rounded bg-[#1A1A1A] border border-[#2A2A2A] px-2 py-1 text-[11px] font-mono-tech font-semibold text-gray-300 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
              title={item.desc}
            >
              {item.cmd}
            </button>
          ))}
        </div>

        {/* Terminal Log Console */}
        <div className="flex-1 overflow-y-auto p-4 font-mono-tech text-xs space-y-1.5 bg-[#0A0A0A]">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-gray-600">
              <p>Terminal ready. Type an AT command or OBD PID (e.g. 010C, 03, ATZ) below.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-[10px] text-gray-600 shrink-0">[{log.timestamp}]</span>
                {log.type === 'tx' && (
                  <span className="text-cyan-400 font-bold shrink-0">&gt; {log.content}</span>
                )}
                {log.type === 'rx' && (
                  <span className="text-emerald-400 shrink-0">&lt; {log.content}</span>
                )}
                {log.type === 'system' && (
                  <span className="text-sky-400 italic shrink-0">[*] {log.content}</span>
                )}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>

        {/* Input Command Line */}
        <form
          onSubmit={handleSendCommand}
          className="flex items-center gap-2 border-t border-[#222222] bg-[#121212] p-3"
        >
          <span className="font-mono-tech font-bold text-cyan-400 pl-2">&gt;</span>
          <input
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            placeholder="Enter AT command or Mode 01 PID (e.g. 010C, 0105, AT RV)..."
            className="flex-1 bg-transparent font-mono-tech text-xs text-white placeholder:text-gray-600 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-colors shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

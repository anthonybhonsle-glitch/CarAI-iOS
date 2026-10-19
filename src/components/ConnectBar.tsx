// src/components/ConnectBar.tsx
// Lets the user connect a real OBD-II Bluetooth adapter (live car data) or run
// the demo car. This is the real-world entry point: download app -> plug in
// adapter -> Connect -> live diagnostics.

import React, { useEffect, useState } from 'react';
import { Bluetooth, BluetoothConnected, PlugZap, Loader2 } from 'lucide-react';
import { obdConnection, ConnState } from '../services/obdConnection';
import { telemetry, SourceKind } from '../services/telemetrySource';
import { useI18n } from '../i18n/I18nProvider';

export const ConnectBar: React.FC = () => {
  const { t } = useI18n();
  const [state, setState] = useState<ConnState>('disconnected');
  const [msg, setMsg] = useState<string>('');
  const [source, setSource] = useState<SourceKind>(telemetry.getKind());

  useEffect(() => {
    return obdConnection.onState((s, m) => {
      setState(s);
      setMsg(m ?? '');
    });
  }, []);

  const connectLive = async () => {
    telemetry.use('live');
    setSource('live');
    await obdConnection.connect();
  };

  const useDemo = () => {
    obdConnection.disconnect();
    telemetry.use('sim');
    setSource('sim');
  };

  const supported = obdConnection.isSupported();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#12293B] border border-[#20384E] p-3 text-sm shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        {source === 'live' && state === 'connected' ? (
          <span className="flex items-center gap-2 rounded-lg bg-[#13C2A3]/20 border border-[#13C2A3]/40 px-3 py-1.5 font-semibold text-[#13C2A3] animate-pulse">
            <BluetoothConnected size={16} /> {t('connect.connected')}
          </span>
        ) : (
          <button
            type="button"
            onClick={connectLive}
            disabled={!supported || state === 'connecting' || state === 'initializing'}
            className="flex min-h-[40px] items-center gap-2 rounded-lg bg-[#00D1FF] hover:bg-[#00b8e6] px-4 font-semibold text-[#06151F] transition-all disabled:opacity-50 shadow-sm"
          >
            {state === 'connecting' || state === 'initializing' ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Bluetooth size={16} />
            )}
            {state === 'connecting'
              ? t('connect.connecting')
              : state === 'initializing'
              ? 'Starting ELM…'
              : t('connect.bluetooth')}
          </button>
        )}

        <button
          type="button"
          onClick={useDemo}
          className={`flex min-h-[40px] items-center gap-2 rounded-lg px-3.5 font-semibold transition-all ${
            source === 'sim'
              ? 'bg-white/15 text-[#EAF6FF] border border-white/20'
              : 'bg-white/5 text-[#9FB6C8] hover:bg-white/10'
          }`}
        >
          <PlugZap size={16} /> {t('connect.demo')}
        </button>

        {source === 'live' && state === 'connected' && (
          <button
            type="button"
            onClick={useDemo}
            className="min-h-[40px] rounded-lg bg-white/5 hover:bg-white/10 px-3 text-[#9FB6C8] transition-all"
          >
            {t('connect.disconnect')}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {source === 'sim' && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FFB020]/20 border border-[#FFB020]/30 px-2.5 py-1 text-[#FFB020] font-mono font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFB020] animate-ping" />
            DEMO DATA (Review Mode)
          </span>
        )}

        {!supported && (
          <span className="text-xs text-[#FFB020]">
            {t('connect.unsupported')}
          </span>
        )}

        {state === 'error' && <span className="text-xs text-[#FF4D4F] font-medium">{msg}</span>}

        {source === 'live' && state === 'connected' && (
          <span className="text-xs text-[#9FB6C8] hidden sm:inline">
            {t('connect.live_note')}
          </span>
        )}
      </div>
    </div>
  );
};

export default ConnectBar;

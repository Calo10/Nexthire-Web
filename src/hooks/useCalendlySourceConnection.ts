import { useCallback, useEffect, useState } from 'react';
import { getSourcingSourceConnections } from '../api/sourcingApi';
import { calendlyApi } from '../api/calendlyApi';
import { isCalendlySourceReady, pickCalendlyConnection } from '../lib/calendlySource';
import { parseCalendlyConfig } from '../lib/calendlySourceConfig';

export function useCalendlySourceConnection(enabled: boolean, refreshKey = 0) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [schedulingUrl, setSchedulingUrl] = useState('');
  const [hostEmail, setHostEmail] = useState('');

  const refresh = useCallback(async () => {
    if (!enabled) {
      setIsReady(false);
      setSchedulingUrl('');
      setHostEmail('');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const rows = await getSourcingSourceConnections();
      const conn = pickCalendlyConnection(rows);
      const ready = isCalendlySourceReady(conn);
      setIsReady(ready);

      const fromConfig = parseCalendlyConfig(conn?.configJson).SchedulingUrl.trim();
      if (fromConfig) setSchedulingUrl(fromConfig);

      if (ready) {
        try {
          const me = await calendlyApi.getMe();
          if (me.ready) {
            setSchedulingUrl((me.schedulingUrl || fromConfig || '').trim());
            setHostEmail((me.email || '').trim());
          } else {
            setIsReady(false);
            if (!fromConfig) setSchedulingUrl('');
          }
        } catch {
          if (!fromConfig) setSchedulingUrl('');
        }
      } else if (!fromConfig) {
        setSchedulingUrl('');
        setHostEmail('');
      }
    } catch {
      setIsReady(false);
      setSchedulingUrl('');
      setHostEmail('');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  return { isReady, isLoading, schedulingUrl, hostEmail, refresh };
}

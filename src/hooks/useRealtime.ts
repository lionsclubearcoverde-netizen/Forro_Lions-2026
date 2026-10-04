import { useEffect } from "react";
import { supabase } from "../integrations/supabase/client";

/**
 * Assina eventos postgres_changes de uma tabela e dispara `onChange`
 * para a UI revalidar os dados em tempo real (sincronização entre operadores).
 */
export function useRealtime(table: string, onChange: () => void): void {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onChange]);
}

import { Download, FileText, Paperclip, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { api, baixarDocumento, errorMessage } from '@/lib/api';
import { bytes, date } from '@/lib/format';
import { useSend } from '@/lib/hooks';
import type { Documento } from '@/lib/types';
import { Button, Card, Empty } from './ui';

export default function Documentos({ tipo, id, documentos, title = 'Documentos' }: { tipo: 'contrato' | 'projeto' | 'cliente'; id: number; documentos: Documento[]; title?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();
  const remover = useSend<number>('delete', (docId) => `/documentos/${docId}`, 'Documento removido');

  const enviar = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('tipo', tipo);
        fd.append('id', String(id));
        fd.append('arquivo', file);
        await api.post('/documentos', fd);
      }
      toast.success('Arquivo(s) enviado(s)');
      qc.invalidateQueries();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <Card
      title={title}
      actions={
        <>
          <input ref={input} type="file" multiple className="hidden" onChange={(e) => enviar(e.target.files)} />
          <Button size="sm" variant="secondary" loading={uploading} onClick={() => input.current?.click()}>
            <Paperclip className="h-3.5 w-3.5" /> Anexar
          </Button>
        </>
      }
    >
      {documentos.length === 0 ? (
        <Empty>Nenhum arquivo. Anexe o PDF do contrato, propostas, comprovantes…</Empty>
      ) : (
        <ul className="divide-y divide-slate-100">
          {documentos.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-5 py-3">
              <FileText className="h-5 w-5 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.nome}</p>
                <p className="text-xs text-slate-500">
                  {bytes(d.tamanho)} · {date(d.created_at)}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => baixarDocumento(d.id, d.nome).catch((e) => toast.error(errorMessage(e)))}>
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => confirm(`Remover "${d.nome}"?`) && remover.mutate(d.id)}>
                <Trash2 className="h-4 w-4 text-rose-500" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useGet, useSend } from '@/lib/hooks';
import type { User } from '@/lib/types';
import RateioEditor from '@/components/RateioEditor';
import { Badge, Button, Card, Field, Loading, Modal, PageHeader, Table } from '@/components/ui';

export default function Socios() {
  const { data, isLoading } = useGet<User[]>('/socios');
  const [editar, setEditar] = useState<User | 'novo' | null>(null);
  const [senha, setSenha] = useState(false);

  return (
    <>
      <PageHeader
        title="Sócios & Rateio"
        subtitle="Quem acessa o sistema e como cada recebimento é dividido."
        actions={
          <>
            <Button variant="secondary" onClick={() => setSenha(true)}>
              Alterar minha senha
            </Button>
            <Button onClick={() => setEditar('novo')}>
              <Plus className="h-4 w-4" /> Novo usuário
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Usuários">
          {isLoading ? (
            <Loading />
          ) : (
            <Table>
              <tbody className="divide-y divide-slate-100">
                {data?.map((u) => (
                  <tr key={u.id}>
                    <td className="td">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="td">
                      {u.socio && <Badge tone="green">Sócio</Badge>} {!u.ativo && <Badge tone="gray">Inativo</Badge>}
                    </td>
                    <td className="td text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditar(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <RateioEditor />
      </div>
      {editar && <UserForm user={editar === 'novo' ? null : editar} onClose={() => setEditar(null)} />}
      {senha && <SenhaForm onClose={() => setSenha(false)} />}
    </>
  );
}

function UserForm({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [f, setF] = useState({ name: user?.name ?? '', email: user?.email ?? '', telefone: user?.telefone ?? '', password: '', socio: user?.socio ?? true, ativo: user?.ativo ?? true });
  const salvar = useSend(user ? 'put' : 'post', user ? `/socios/${user.id}` : '/socios', 'Usuário salvo');

  return (
    <Modal open onClose={onClose} title={user ? 'Editar usuário' : 'Novo usuário'}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          salvar.mutate(f, { onSuccess: onClose });
        }}
      >
        <Field label="Nome">
          <input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="E-mail (login)">
          <input type="email" className="input" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        <Field label="Telefone">
          <input className="input" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} />
        </Field>
        <Field label={user ? 'Nova senha (deixe vazio para manter)' : 'Senha'}>
          <input type="password" className="input" required={!user} minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </Field>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={f.socio} onChange={(e) => setF({ ...f, socio: e.target.checked })} /> É sócio (participa do rateio)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={f.ativo} onChange={(e) => setF({ ...f, ativo: e.target.checked })} /> Ativo
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvar.isPending}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SenhaForm({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({ senha_atual: '', nova_senha: '', nova_senha_confirmation: '' });
  const salvar = useSend('put', '/me/senha', 'Senha alterada');
  return (
    <Modal open onClose={onClose} title="Alterar minha senha">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          salvar.mutate(f, { onSuccess: onClose });
        }}
      >
        <Field label="Senha atual">
          <input type="password" className="input" required value={f.senha_atual} onChange={(e) => setF({ ...f, senha_atual: e.target.value })} />
        </Field>
        <Field label="Nova senha">
          <input type="password" className="input" required minLength={6} value={f.nova_senha} onChange={(e) => setF({ ...f, nova_senha: e.target.value })} />
        </Field>
        <Field label="Confirmar nova senha">
          <input type="password" className="input" required value={f.nova_senha_confirmation} onChange={(e) => setF({ ...f, nova_senha_confirmation: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvar.isPending}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

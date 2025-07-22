import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Move,
  Save,
  RotateCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

interface CampoCustomizado {
  id: string;
  nome: string;
  tipo: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'textarea';
  label: string;
  placeholder?: string;
  obrigatorio: boolean;
  visivel: boolean;
  ordem: number;
  opcoes?: string[]; // Para campos select
  validacao?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface ConfiguracaoSecao {
  id: string;
  nome: string;
  campos: CampoCustomizado[];
}

const ConfiguracoesCampos: React.FC = () => {
  const [secaoAtiva, setSecaoAtiva] = useState('clientes');
  const [configuracoes, setConfiguracoes] = useState<{ [key: string]: ConfiguracaoSecao }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampo, setEditingCampo] = useState<CampoCustomizado | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formCampo, setFormCampo] = useState<Partial<CampoCustomizado>>({
    nome: '',
    tipo: 'text',
    label: '',
    placeholder: '',
    obrigatorio: false,
    visivel: true,
    opcoes: []
  });

  const secoes = [
    { id: 'clientes', nome: 'Clientes', icon: '👥' },
    { id: 'ordens_servico', nome: 'Ordens de Serviço', icon: '🔧' },
    { id: 'produtos', nome: 'Produtos/Peças', icon: '📦' },
    { id: 'servicos', nome: 'Tipos de Serviço', icon: '⚙️' },
    { id: 'funcionarios', nome: 'Funcionários', icon: '👨‍💼' }
  ];

  const tiposCampo = [
    { value: 'text', label: 'Texto' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Telefone' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Data' },
    { value: 'select', label: 'Lista de Opções' },
    { value: 'textarea', label: 'Texto Longo' }
  ];

  useEffect(() => {
    loadConfiguracoes();
  }, []);

  const loadConfiguracoes = () => {
    const stored = localStorage.getItem('motogestor_campos_customizados');
    if (stored) {
      setConfiguracoes(JSON.parse(stored));
    } else {
      // Configurações padrão
      const configPadrao = {
        clientes: {
          id: 'clientes',
          nome: 'Clientes',
          campos: [
            { id: '1', nome: 'nome', tipo: 'text' as const, label: 'Nome', obrigatorio: true, visivel: true, ordem: 1 },
            { id: '2', nome: 'email', tipo: 'email' as const, label: 'Email', obrigatorio: false, visivel: true, ordem: 2 },
            { id: '3', nome: 'telefone', tipo: 'phone' as const, label: 'Telefone', obrigatorio: true, visivel: true, ordem: 3 },
            { id: '4', nome: 'cpf', tipo: 'text' as const, label: 'CPF', obrigatorio: false, visivel: true, ordem: 4 },
            { id: '5', nome: 'endereco', tipo: 'textarea' as const, label: 'Endereço', obrigatorio: false, visivel: true, ordem: 5 }
          ]
        },
        ordens_servico: {
          id: 'ordens_servico',
          nome: 'Ordens de Serviço',
          campos: [
            { id: '1', nome: 'descricao', tipo: 'textarea' as const, label: 'Descrição do Serviço', obrigatorio: true, visivel: true, ordem: 1 },
            { id: '2', nome: 'valor', tipo: 'number' as const, label: 'Valor', obrigatorio: true, visivel: true, ordem: 2 },
            { id: '3', nome: 'observacoes', tipo: 'textarea' as const, label: 'Observações', obrigatorio: false, visivel: true, ordem: 3 }
          ]
        },
        produtos: {
          id: 'produtos',
          nome: 'Produtos/Peças',
          campos: [
            { id: '1', nome: 'codigo', tipo: 'text' as const, label: 'Código', obrigatorio: true, visivel: true, ordem: 1 },
            { id: '2', nome: 'nome', tipo: 'text' as const, label: 'Nome', obrigatorio: true, visivel: true, ordem: 2 },
            { id: '3', nome: 'categoria', tipo: 'select' as const, label: 'Categoria', obrigatorio: true, visivel: true, ordem: 3, opcoes: ['Lubrificantes', 'Filtros', 'Freios', 'Suspensão', 'Motor', 'Elétrica'] },
            { id: '4', nome: 'marca', tipo: 'text' as const, label: 'Marca', obrigatorio: false, visivel: true, ordem: 4 },
            { id: '5', nome: 'preco_compra', tipo: 'number' as const, label: 'Preço de Compra', obrigatorio: true, visivel: true, ordem: 5 },
            { id: '6', nome: 'preco_venda', tipo: 'number' as const, label: 'Preço de Venda', obrigatorio: true, visivel: true, ordem: 6 }
          ]
        },
        servicos: {
          id: 'servicos',
          nome: 'Tipos de Serviço',
          campos: [
            { id: '1', nome: 'nome', tipo: 'text' as const, label: 'Nome do Serviço', obrigatorio: true, visivel: true, ordem: 1 },
            { id: '2', nome: 'categoria', tipo: 'select' as const, label: 'Categoria', obrigatorio: true, visivel: true, ordem: 2, opcoes: ['Manutenção Preventiva', 'Manutenção Corretiva', 'Revisão', 'Emergência'] },
            { id: '3', nome: 'tempo_estimado', tipo: 'number' as const, label: 'Tempo Estimado (horas)', obrigatorio: false, visivel: true, ordem: 3 },
            { id: '4', nome: 'preco_base', tipo: 'number' as const, label: 'Preço Base', obrigatorio: false, visivel: true, ordem: 4 }
          ]
        }
      };
      setConfiguracoes(configPadrao);
    }
  };

  const saveConfiguracoes = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.setItem('motogestor_campos_customizados', JSON.stringify(configuracoes));
    setIsSaving(false);
    alert('Configurações salvas com sucesso!');
  };

  const handleSubmitCampo = (e: React.FormEvent) => {
    e.preventDefault();
    
    const novoCampo: CampoCustomizado = {
      id: editingCampo?.id || Math.random().toString(36).substr(2, 9),
      nome: formCampo.nome || '',
      tipo: formCampo.tipo || 'text',
      label: formCampo.label || '',
      placeholder: formCampo.placeholder,
      obrigatorio: formCampo.obrigatorio || false,
      visivel: formCampo.visivel !== false,
      ordem: editingCampo?.ordem || (configuracoes[secaoAtiva]?.campos.length || 0) + 1,
      opcoes: formCampo.opcoes,
      validacao: formCampo.validacao
    };

    setConfiguracoes(prev => {
      const secao = prev[secaoAtiva] || { id: secaoAtiva, nome: secoes.find(s => s.id === secaoAtiva)?.nome || '', campos: [] };
      
      if (editingCampo) {
        secao.campos = secao.campos.map(c => c.id === editingCampo.id ? novoCampo : c);
      } else {
        secao.campos.push(novoCampo);
      }
      
      return { ...prev, [secaoAtiva]: secao };
    });

    setIsModalOpen(false);
    resetForm();
  };

  const handleEditCampo = (campo: CampoCustomizado) => {
    setEditingCampo(campo);
    setFormCampo({
      nome: campo.nome,
      tipo: campo.tipo,
      label: campo.label,
      placeholder: campo.placeholder,
      obrigatorio: campo.obrigatorio,
      visivel: campo.visivel,
      opcoes: campo.opcoes || [],
      validacao: campo.validacao
    });
    setIsModalOpen(true);
  };

  const handleDeleteCampo = (campoId: string) => {
    if (confirm('Tem certeza que deseja excluir este campo?')) {
      setConfiguracoes(prev => ({
        ...prev,
        [secaoAtiva]: {
          ...prev[secaoAtiva],
          campos: prev[secaoAtiva].campos.filter(c => c.id !== campoId)
        }
      }));
    }
  };

  const handleToggleVisibilidade = (campoId: string) => {
    setConfiguracoes(prev => ({
      ...prev,
      [secaoAtiva]: {
        ...prev[secaoAtiva],
        campos: prev[secaoAtiva].campos.map(c => 
          c.id === campoId ? { ...c, visivel: !c.visivel } : c
        )
      }
    }));
  };

  const resetForm = () => {
    setFormCampo({
      nome: '',
      tipo: 'text',
      label: '',
      placeholder: '',
      obrigatorio: false,
      visivel: true,
      opcoes: []
    });
    setEditingCampo(null);
  };

  const resetToDefault = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão? Isso irá remover todas as customizações.')) {
      localStorage.removeItem('motogestor_campos_customizados');
      loadConfiguracoes();
    }
  };

  const secaoAtual = configuracoes[secaoAtiva];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuração de Campos</h1>
          <p className="text-gray-600">Customize os campos de cada seção do sistema</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={resetToDefault}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button onClick={saveConfiguracoes} isLoading={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu de Seções */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Seções</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {secoes.map((secao) => (
                  <button
                    key={secao.id}
                    onClick={() => setSecaoAtiva(secao.id)}
                    className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                      secaoAtiva === secao.id ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    <span className="text-lg">{secao.icon}</span>
                    <span className="font-medium">{secao.nome}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuração de Campos */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Campos - {secoes.find(s => s.id === secaoAtiva)?.nome}
                </CardTitle>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Campo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {secaoAtual?.campos.length > 0 ? (
                <div className="space-y-3">
                  {secaoAtual.campos
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((campo) => (
                      <div
                        key={campo.id}
                        className={`p-4 border rounded-lg ${
                          campo.visivel ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className={`font-medium ${campo.visivel ? 'text-gray-900' : 'text-gray-500'}`}>
                                {campo.label}
                              </h4>
                              <Badge variant={campo.obrigatorio ? 'error' : 'default'}>
                                {campo.obrigatorio ? 'Obrigatório' : 'Opcional'}
                              </Badge>
                              <Badge variant={campo.visivel ? 'success' : 'default'}>
                                {campo.visivel ? 'Visível' : 'Oculto'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Tipo:</span> {tiposCampo.find(t => t.value === campo.tipo)?.label}
                              {campo.nome && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className="font-medium">Nome:</span> {campo.nome}
                                </>
                              )}
                              {campo.placeholder && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className="font-medium">Placeholder:</span> {campo.placeholder}
                                </>
                              )}
                            </div>
                            {campo.opcoes && campo.opcoes.length > 0 && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-gray-600">Opções:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {campo.opcoes.map((opcao, index) => (
                                    <Badge key={index} variant="default" size="sm">
                                      {opcao}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleVisibilidade(campo.id)}
                              title={campo.visivel ? 'Ocultar campo' : 'Mostrar campo'}
                            >
                              {campo.visivel ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCampo(campo)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCampo(campo.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum campo configurado</h3>
                  <p className="text-gray-600 mb-4">
                    Adicione campos personalizados para esta seção
                  </p>
                  <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Campo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Campo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingCampo ? 'Editar Campo' : 'Novo Campo'}
        size="lg"
      >
        <form onSubmit={handleSubmitCampo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome do Campo *"
              value={formCampo.nome}
              onChange={(e) => setFormCampo(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: data_nascimento"
              helper="Nome técnico do campo (sem espaços)"
              required
            />
            <Input
              label="Label (Rótulo) *"
              value={formCampo.label}
              onChange={(e) => setFormCampo(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Ex: Data de Nascimento"
              helper="Texto que aparece para o usuário"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Campo *</label>
              <select
                value={formCampo.tipo}
                onChange={(e) => setFormCampo(prev => ({ ...prev, tipo: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {tiposCampo.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Placeholder"
              value={formCampo.placeholder}
              onChange={(e) => setFormCampo(prev => ({ ...prev, placeholder: e.target.value }))}
              placeholder="Texto de exemplo no campo"
            />
          </div>

          {formCampo.tipo === 'select' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opções (uma por linha)</label>
              <textarea
                value={formCampo.opcoes?.join('\n') || ''}
                onChange={(e) => setFormCampo(prev => ({ 
                  ...prev, 
                  opcoes: e.target.value.split('\n').filter(o => o.trim()) 
                }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
              />
            </div>
          )}

          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formCampo.obrigatorio}
                onChange={(e) => setFormCampo(prev => ({ ...prev, obrigatorio: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">Campo obrigatório</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formCampo.visivel !== false}
                onChange={(e) => setFormCampo(prev => ({ ...prev, visivel: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">Campo visível</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingCampo ? 'Atualizar' : 'Criar'} Campo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ConfiguracoesCampos;
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  MessageCircle, 
  Mail, 
  Webhook, 
  Settings, 
  Play, 
  Pause,
  Plus,
  BarChart3,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { AutomacaoService } from '../services/automacaoService';
import { ConfiguracaoAutomacao } from '../types';

const Automacoes: React.FC = () => {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoAutomacao[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfiguracaoAutomacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'whatsapp' as 'whatsapp' | 'email' | 'webhook',
    evento: 'os_criada',
    template: '',
    ativo: true,
    configuracao: {
      n8nWebhookUrl: '',
      whatsappToken: '',
      emailTemplate: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configData, analyticsData] = await Promise.all([
        AutomacaoService.getConfiguracoes(),
        AutomacaoService.getAnalyticsAutomacao()
      ]);
      
      setConfiguracoes(configData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Erro ao carregar automações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutomacao = async (id: string, ativo: boolean) => {
    try {
      await AutomacaoService.atualizarConfiguracao(id, { ativo });
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar automação:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const configData = {
        nome: formData.nome,
        tipo: formData.tipo,
        ativo: formData.ativo,
        trigger: {
          evento: formData.evento as any
        },
        acao: {
          template: formData.template,
          destinatario: formData.tipo === 'webhook' ? 'n8n' : 'cliente',
          parametros: {}
        },
        configuracao: formData.configuracao
      };

      if (editingConfig) {
        await AutomacaoService.atualizarConfiguracao(editingConfig.id, configData);
      } else {
        await AutomacaoService.criarConfiguracao(configData);
      }

      await loadData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar automação:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'whatsapp',
      evento: 'os_criada',
      template: '',
      ativo: true,
      configuracao: {
        n8nWebhookUrl: '',
        whatsappToken: '',
        emailTemplate: ''
      }
    });
    setEditingConfig(null);
  };

  const handleEdit = (config: ConfiguracaoAutomacao) => {
    setEditingConfig(config);
    setFormData({
      nome: config.nome,
      tipo: config.tipo,
      evento: config.trigger.evento,
      template: config.acao.template,
      ativo: config.ativo,
      configuracao: config.configuracao
    });
    setIsModalOpen(true);
  };

  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5 text-green-600" />;
      case 'email':
        return <Mail className="h-5 w-5 text-blue-600" />;
      case 'webhook':
        return <Webhook className="h-5 w-5 text-purple-600" />;
      default:
        return <Zap className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleSincronizarN8n = async () => {
    try {
      await AutomacaoService.sincronizarComN8n();
      alert('Sincronização com n8n realizada com sucesso!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro na sincronização com n8n');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automações Inteligentes</h1>
          <p className="text-gray-600">Configure automações e integrações com n8n</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleSincronizarN8n}>
            <Settings className="h-4 w-4 mr-2" />
            Sincronizar n8n
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Automação
          </Button>
        </div>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalExecucoes}</div>
              <div className="text-sm text-gray-600">Total Execuções</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.sucessos}</div>
              <div className="text-sm text-gray-600">Sucessos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{analytics.falhas}</div>
              <div className="text-sm text-gray-600">Falhas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((analytics.sucessos / analytics.totalExecucoes) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Taxa de Sucesso</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Automações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configuracoes.map((config) => (
          <Card key={config.id} variant="outlined">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getIconForType(config.tipo)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{config.nome}</h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {config.tipo} • {config.trigger.evento.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={config.ativo ? 'success' : 'default'}>
                    {config.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAutomacao(config.id, !config.ativo)}
                  >
                    {config.ativo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="font-medium">Trigger:</span> {config.trigger.evento}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Template:</span> {config.acao.template}
                </div>
                {config.configuracao.n8nWebhookUrl && (
                  <div className="text-sm">
                    <span className="font-medium">Webhook:</span> 
                    <span className="text-blue-600 ml-1">Configurado</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    {Math.floor(Math.random() * 50)} sucessos
                  </span>
                  <span className="flex items-center">
                    <XCircle className="h-3 w-3 mr-1 text-red-500" />
                    {Math.floor(Math.random() * 5)} falhas
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(config)}
                >
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {configuracoes.length === 0 && (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma automação configurada</h3>
          <p className="text-gray-600 mb-4">
            Configure automações para WhatsApp, email e webhooks n8n
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Automação
          </Button>
        </div>
      )}

      {/* Modal de Configuração */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingConfig ? 'Editar Automação' : 'Nova Automação'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome da Automação *"
            value={formData.nome}
            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            placeholder="Ex: Notificação WhatsApp - OS Criada"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="webhook">Webhook (n8n)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evento Trigger *</label>
              <select
                value={formData.evento}
                onChange={(e) => setFormData(prev => ({ ...prev, evento: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="os_criada">OS Criada</option>
                <option value="os_concluida">OS Concluída</option>
                <option value="alerta_manutencao">Alerta de Manutenção</option>
                <option value="cliente_cadastrado">Cliente Cadastrado</option>
              </select>
            </div>
          </div>

          <Input
            label="Template/Identificador *"
            value={formData.template}
            onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
            placeholder="Ex: os_criada_whatsapp"
            required
          />

          {formData.tipo === 'webhook' && (
            <Input
              label="URL do Webhook n8n"
              value={formData.configuracao.n8nWebhookUrl}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                configuracao: { ...prev.configuracao, n8nWebhookUrl: e.target.value }
              }))}
              placeholder="https://n8n.exemplo.com/webhook/motogestor"
            />
          )}

          {formData.tipo === 'whatsapp' && (
            <Input
              label="Token WhatsApp API"
              value={formData.configuracao.whatsappToken}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                configuracao: { ...prev.configuracao, whatsappToken: e.target.value }
              }))}
              placeholder="Token da API do WhatsApp"
            />
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
              Ativar automação imediatamente
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
              {editingConfig ? 'Atualizar' : 'Criar'} Automação
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Automacoes;
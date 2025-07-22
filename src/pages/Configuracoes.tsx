import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building, 
  Bell, 
  Shield, 
  Database,
  Smartphone,
  Mail,
  MessageCircle,
  Save,
  TestTube
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ConfiguracoesSistema } from '../types';

const Configuracoes: React.FC = () => {
  const [config, setConfig] = useState<ConfiguracoesSistema>({
    oficina: {
      nome: 'Oficina MotoGestor',
      endereco: 'Rua das Motos, 123 - Centro',
      telefone: '(11) 99999-9999',
      email: 'contato@oficinamotogestor.com',
      cnpj: '12.345.678/0001-90'
    },
    notificacoes: {
      email: true,
      whatsapp: true,
      sms: false,
      push: true
    },
    automacoes: {
      alertasManutencao: true,
      lembreteRevisao: true,
      notificacaoOS: true,
      backupAutomatico: true
    },
    integracao: {
      n8nWebhookUrl: 'https://n8n.exemplo.com/webhook/motogestor',
      whatsappApiKey: 'demo_key_12345',
      emailProvider: 'sendgrid',
      smsProvider: 'twilio'
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Salvar no localStorage
    localStorage.setItem('motogestor_config', JSON.stringify(config));
    
    setIsSaving(false);
    alert('Configurações salvas com sucesso!');
  };

  const handleTestWhatsApp = async () => {
    alert('Teste de WhatsApp enviado! Verifique seu telefone.');
  };

  const handleTestEmail = async () => {
    alert('Email de teste enviado! Verifique sua caixa de entrada.');
  };

  const tabs = [
    { id: 'geral', name: 'Geral', icon: Building },
    { id: 'notificacoes', name: 'Notificações', icon: Bell },
    { id: 'automacoes', name: 'Automações', icon: Settings },
    { id: 'integracao', name: 'Integrações', icon: Smartphone },
    { id: 'seguranca', name: 'Segurança', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações gerais do sistema</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Configurações Gerais */}
      {activeTab === 'geral' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome da Oficina"
                value={config.oficina.nome}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  oficina: { ...prev.oficina, nome: e.target.value }
                }))}
              />
              <Input
                label="CNPJ"
                value={config.oficina.cnpj || ''}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  oficina: { ...prev.oficina, cnpj: e.target.value }
                }))}
              />
            </div>
            
            <Input
              label="Endereço"
              value={config.oficina.endereco}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                oficina: { ...prev.oficina, endereco: e.target.value }
              }))}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telefone"
                value={config.oficina.telefone}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  oficina: { ...prev.oficina, telefone: e.target.value }
                }))}
              />
              <Input
                label="Email"
                type="email"
                value={config.oficina.email}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  oficina: { ...prev.oficina, email: e.target.value }
                }))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notificações */}
      {activeTab === 'notificacoes' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notificações por E-mail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Receber notificações por e-mail</h4>
                  <p className="text-sm text-gray-600">Notificações gerais do sistema</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.notificacoes.email}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      notificacoes: { ...prev.notificacoes, email: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">OS Concluídas</h4>
                  <p className="text-sm text-gray-600">Notificar quando uma OS for concluída</p>
                </div>
                <Badge variant="success">Ativo</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Novas OS</h4>
                  <p className="text-sm text-gray-600">Notificar sobre novas ordens de serviço</p>
                </div>
                <Badge variant="success">Ativo</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Aprovações Pendentes</h4>
                  <p className="text-sm text-gray-600">Notificar sobre OS aguardando aprovação</p>
                </div>
                <Badge variant="success">Ativo</Badge>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Input
                    label="E-mail para Notificações"
                    value="admin@oficinamotogestor.com"
                    className="flex-1 mr-4"
                  />
                  <Button variant="outline" onClick={handleTestEmail}>
                    <TestTube className="h-4 w-4 mr-2" />
                    Testar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notificações WhatsApp</h4>
                  <p className="text-sm text-gray-600">Enviar notificações via WhatsApp</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.notificacoes.whatsapp}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      notificacoes: { ...prev.notificacoes, whatsapp: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Input
                    label="Token da API WhatsApp"
                    value={config.integracao.whatsappApiKey || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      integracao: { ...prev.integracao, whatsappApiKey: e.target.value }
                    }))}
                    className="flex-1 mr-4"
                    placeholder="Insira o token da API"
                  />
                  <Button variant="outline" onClick={handleTestWhatsApp}>
                    <TestTube className="h-4 w-4 mr-2" />
                    Testar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Automações */}
      {activeTab === 'automacoes' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Backup Automático</h4>
                <p className="text-sm text-gray-600">Backup diário dos dados às 02:00</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.automacoes.backupAutomatico}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    automacoes: { ...prev.automacoes, backupAutomatico: e.target.checked }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Limpeza de Logs</h4>
                <p className="text-sm text-gray-600">Remover logs antigos automaticamente</p>
              </div>
              <Badge variant="success">Ativo</Badge>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Versão do Sistema</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">MotoGestor v1.0.0</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Database className="h-4 w-4 mr-2" />
                    Fazer Backup
                  </Button>
                  <Button variant="outline" size="sm">
                    Ver Logs
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integrações */}
      {activeTab === 'integracao' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integração n8n</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="URL do Webhook n8n"
                value={config.integracao.n8nWebhookUrl || ''}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  integracao: { ...prev.integracao, n8nWebhookUrl: e.target.value }
                }))}
                placeholder="https://n8n.exemplo.com/webhook/motogestor"
              />
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-green-800">Conectado com n8n</span>
                </div>
                <Button variant="outline" size="sm">
                  Testar Conexão
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Provedores de Comunicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provedor de Email</label>
                <select
                  value={config.integracao.emailProvider}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    integracao: { ...prev.integracao, emailProvider: e.target.value as any }
                  }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">Amazon SES</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provedor de SMS</label>
                <select
                  value={config.integracao.smsProvider}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    integracao: { ...prev.integracao, smsProvider: e.target.value as any }
                  }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="twilio">Twilio</option>
                  <option value="zenvia">Zenvia</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Segurança */}
      {activeTab === 'seguranca' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Autenticação de Dois Fatores</h4>
                <p className="text-sm text-gray-600">Adicionar camada extra de segurança</p>
              </div>
              <Badge variant="warning">Configurar</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Login Automático</h4>
                <p className="text-sm text-gray-600">Manter usuários conectados</p>
              </div>
              <Badge variant="success">Ativo</Badge>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Políticas de Senha</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mínimo de 8 caracteres</li>
                <li>• Pelo menos uma letra maiúscula</li>
                <li>• Pelo menos um número</li>
                <li>• Pelo menos um caractere especial</li>
              </ul>
              <Button variant="outline" size="sm" className="mt-3">
                Alterar Senha
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
};

export default Configuracoes;
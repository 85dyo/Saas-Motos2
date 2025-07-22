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
  TestTube,
  Palette,
  Upload,
  Monitor,
  Sun,
  Moon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { TemaService } from '../services/temaService';
import { TemaPersonalizado } from '../types';
import { ConfiguracoesSistema } from '../types';

const Configuracoes: React.FC = () => {
  const [config, setConfig] = useState<ConfiguracoesSistema>({
    oficina: {
      nome: 'Oficina MotoGestor',
      endereco: 'Rua das Motos, 123 - Centro',
      telefone: '(11) 99999-9999',
      email: 'contato@oficinamotogestor.com',
      cnpj: '12.345.678/0001-90',
      logo: ''
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

  const [temas, setTemas] = useState<TemaPersonalizado[]>([]);
  const [temaAtivo, setTemaAtivo] = useState<TemaPersonalizado | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');

  useEffect(() => {
    loadTemas();
  }, []);

  const loadTemas = async () => {
    const temasData = await TemaService.getTemas();
    const ativo = await TemaService.getTemaAtivo();
    setTemas(temasData);
    setTemaAtivo(ativo);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Salvar no localStorage
    localStorage.setItem('motogestor_config', JSON.stringify(config));
    
    setIsSaving(false);
    alert('Configurações salvas com sucesso!');
  };

  const handleAtivarTema = async (temaId: string) => {
    await TemaService.ativarTema(temaId);
    await loadTemas();
  };

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        setConfig(prev => ({
          ...prev,
          oficina: { ...prev.oficina, logo: logoUrl }
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
    }
  };

  const handleTestWhatsApp = async () => {
    alert('Teste de WhatsApp enviado! Verifique seu telefone.');
  };

  const handleTestEmail = async () => {
    alert('Email de teste enviado! Verifique sua caixa de entrada.');
  };

  const tabs = [
    { id: 'geral', name: 'Geral', icon: Building },
    { id: 'aparencia', name: 'Aparência', icon: Palette },
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo da Empresa</label>
              <div className="flex items-center space-x-4">
                {config.oficina.logo && (
                  <img 
                    src={config.oficina.logo} 
                    alt="Logo" 
                    className="w-16 h-16 object-contain border border-gray-200 rounded"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLogo}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {config.oficina.logo ? 'Alterar Logo' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos: PNG, JPG, SVG (máx. 2MB)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aparência e Temas */}
      {activeTab === 'aparencia' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Temas do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {temas.map((tema) => (
                  <div
                    key={tema.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      tema.ativo 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAtivarTema(tema.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{tema.nome}</h4>
                      <div className="flex items-center space-x-1">
                        {tema.modo === 'dark' ? (
                          <Moon className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Sun className="h-4 w-4 text-yellow-500" />
                        )}
                        {tema.ativo && <Badge variant="success" size="sm">Ativo</Badge>}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mb-3">
                      <div 
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: tema.cores.primaria }}
                        title="Cor Primária"
                      />
                      <div 
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: tema.cores.secundaria }}
                        title="Cor Secundária"
                      />
                      <div 
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: tema.cores.sucesso }}
                        title="Cor de Sucesso"
                      />
                      <div 
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: tema.cores.fundo }}
                        title="Cor de Fundo"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-600">
                      Clique para ativar este tema
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Dica</h4>
                <p className="text-sm text-blue-800">
                  Você pode criar temas personalizados com suas próprias cores e logo. 
                  Entre em contato com o suporte para mais informações.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Interface</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Modo Escuro Automático</h4>
                  <p className="text-sm text-gray-600">Alternar automaticamente baseado no horário</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Animações Reduzidas</h4>
                  <p className="text-sm text-gray-600">Reduzir animações para melhor performance</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Densidade Compacta</h4>
                  <p className="text-sm text-gray-600">Mostrar mais informações em menos espaço</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
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
              <CardTitle>Evolution API (WhatsApp)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="URL Base da API"
                value={config.integracao.evolutionApiUrl || ''}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  integracao: { ...prev.integracao, evolutionApiUrl: e.target.value }
                }))}
                placeholder="https://evolution-api.exemplo.com"
              />
              
              <Input
                label="API Key"
                type="password"
                value={config.integracao.evolutionApiKey || ''}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  integracao: { ...prev.integracao, evolutionApiKey: e.target.value }
                }))}
                placeholder="Sua chave da Evolution API"
              />
              
              <Input
                label="Nome da Instância"
                value={config.integracao.evolutionInstanceName || 'motogestor-instance'}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  integracao: { ...prev.integracao, evolutionInstanceName: e.target.value }
                }))}
              />
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-blue-800">Status: Configurado</span>
                </div>
                <Button variant="outline" size="sm">
                  Testar Conexão
                </Button>
              </div>
            </CardContent>
          </Card>

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
              
              <Input
                label="Token de Autenticação"
                type="password"
                value={config.integracao.n8nToken || ''}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  integracao: { ...prev.integracao, n8nToken: e.target.value }
                }))}
                placeholder="Token para autenticação no n8n"
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
          
          <Card>
            <CardHeader>
              <CardTitle>Configurações de IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Análise Inteligente de Risco</h4>
                  <p className="text-sm text-gray-600">Usar IA para analisar padrões de manutenção</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.integracao.analiseIA || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      integracao: { ...prev.integracao, analiseIA: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Alertas Preditivos</h4>
                  <p className="text-sm text-gray-600">Gerar alertas baseados no manual do fabricante</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.integracao.alertasPreditivos || true}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      integracao: { ...prev.integracao, alertasPreditivos: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
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
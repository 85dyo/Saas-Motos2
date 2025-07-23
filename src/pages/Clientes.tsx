import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, Phone, Mail, Download, MessageCircle, Calendar, 
  TrendingUp, Users, Clock, Filter, UserPlus, DollarSign, BarChart3, FileText,
  Target, Award, AlertCircle, CheckCircle, Eye, Zap, Star, Activity,
  PieChart, ArrowUp, ArrowDown, Sparkles, Brain, Settings2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { DataService } from '../services/dataService';
import { PDFService } from '../services/pdfService';
import { EvolutionApiService } from '../services/evolutionApiService';
import { HistoricoService } from '../services/historicoService';
import { Cliente, Moto } from '../types';
import { formatPhone, formatDate, formatCurrency } from '../utils/formatters';
import { 
  fabricantes, 
  modelosPorFabricante, 
  anosDisponiveis, 
  coresDisponiveis,
  formatarPlaca,
  validarPlaca,
  getTipoPlaca
} from '../utils/motorcycleData';

const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dashboard states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [filtros, setFiltros] = useState({
    periodo: '30', // dias
    tipoServico: 'todos',
    statusCliente: 'todos'
  });

  // Export states
  const [exportConfig, setExportConfig] = useState({
    formato: 'pdf',
    periodo: '30',
    incluirHistorico: true,
    incluirFinanceiro: true,
    incluirAlertas: false,
    statusCliente: 'todos',
    ordenarPor: 'nome'
  });

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    endereco: '',
    motos: [] as Omit<Moto, 'id'>[]
  });

  useEffect(() => {
    loadClientes();
    loadDashboardData();
  }, []);

  useEffect(() => {
    const filtered = clientes.filter(cliente => 
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm)
    );
    setFilteredClientes(filtered);
  }, [clientes, searchTerm]);

  const loadClientes = async () => {
    try {
      const data = await DataService.getAllClientes();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Simular dados do dashboard
      const hoje = new Date();
      const diasAtras = new Date();
      diasAtras.setDate(hoje.getDate() - parseInt(filtros.periodo));

      const clientesData = await DataService.getAllClientes();
      const ordensData = await DataService.getAllOS();

      const novosClientes = clientesData.filter(c => 
        new Date(c.createdAt) >= diasAtras
      ).length;

      const clientesComRetorno = clientesData.filter(c => {
        const osCliente = ordensData.filter(os => os.clienteId === c.id);
        return osCliente.length > 1;
      });

      const tempoMedioRetorno = clientesComRetorno.length > 0 
        ? Math.round(clientesComRetorno.reduce((acc, cliente) => {
            const osCliente = ordensData
              .filter(os => os.clienteId === cliente.id)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            if (osCliente.length >= 2) {
              const diff = new Date(osCliente[0].createdAt).getTime() - new Date(osCliente[1].createdAt).getTime();
              return acc + (diff / (1000 * 60 * 60 * 24));
            }
            return acc;
          }, 0) / clientesComRetorno.length)
        : 0;

      const ticketMedio = ordensData.length > 0 
        ? ordensData.reduce((sum, os) => sum + os.valor, 0) / ordensData.length
        : 0;

      // Segmentação de clientes
      const clientesAtivos = clientesData.filter(c => {
        const ultimaOS = ordensData
          .filter(os => os.clienteId === c.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        return ultimaOS && new Date(ultimaOS.createdAt) >= diasAtras;
      });

      const clientesInativos = clientesData.filter(c => {
        const ultimaOS = ordensData
          .filter(os => os.clienteId === c.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const inativo90Dias = new Date();
        inativo90Dias.setDate(inativo90Dias.getDate() - 90);
        return !ultimaOS || new Date(ultimaOS.createdAt) < inativo90Dias;
      });

      const clientesVIP = clientesData.filter(c => {
        const osCliente = ordensData.filter(os => os.clienteId === c.id);
        return osCliente.length >= 5;
      });

      // Análise de valor
      const valorTotalFaturado = ordensData
        .filter(os => os.status === 'concluido')
        .reduce((sum, os) => sum + os.valor, 0);

      const clientesMaisLucrativos = clientesData
        .map(cliente => {
          const valorCliente = ordensData
            .filter(os => os.clienteId === cliente.id && os.status === 'concluido')
            .reduce((sum, os) => sum + os.valor, 0);
          return { cliente, valor: valorCliente };
        })
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);

      const clientesPorTipoServico = ordensData.reduce((acc, os) => {
        const tipo = os.descricao.toLowerCase().includes('óleo') ? 'Manutenção' :
                    os.descricao.toLowerCase().includes('freio') ? 'Freios' :
                    os.descricao.toLowerCase().includes('revisão') ? 'Revisão' : 'Outros';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      // Insights inteligentes
      const insights = [];
      if (clientesInativos.length > clientesAtivos.length * 0.3) {
        insights.push({
          tipo: 'warning',
          titulo: 'Alto número de clientes inativos',
          descricao: `${clientesInativos.length} clientes sem atividade há mais de 90 dias`,
          acao: 'Criar campanha de reativação'
        });
      }
      if (novosClientes > clientesData.length * 0.2) {
        insights.push({
          tipo: 'success',
          titulo: 'Crescimento acelerado',
          descricao: `${novosClientes} novos clientes este mês`,
          acao: 'Manter estratégia de aquisição'
        });
      }
      if (ticketMedio < 100) {
        insights.push({
          tipo: 'info',
          titulo: 'Oportunidade de upsell',
          descricao: `Ticket médio de ${formatCurrency(ticketMedio)} pode ser aumentado`,
          acao: 'Oferecer serviços complementares'
        });
      }

      setDashboardData({
        novosClientes,
        totalClientes: clientesData.length,
        taxaRetorno: Math.round((clientesComRetorno.length / clientesData.length) * 100),
        tempoMedioRetorno,
        ticketMedio,
        clientesPorTipoServico,
        crescimentoMensal: Math.round(Math.random() * 20 + 5), // Simulado
        clientesAtivos: clientesAtivos.length,
        clientesInativos: clientesInativos.length,
        clientesVIP: clientesVIP.length,
        valorTotalFaturado,
        clientesMaisLucrativos,
        insights,
        distribuicaoStatus: {
          ativos: clientesAtivos.length,
          inativos: clientesInativos.length,
          vip: clientesVIP.length
        }
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const clienteData = {
        ...formData,
        motos: formData.motos.map(moto => ({
          ...moto,
          id: Math.random().toString(36).substr(2, 9)
        }))
      };

      if (editingCliente) {
        await DataService.updateCliente(editingCliente.id, clienteData);
      } else {
        await DataService.createCliente(clienteData);
      }

      await loadClientes();
      await loadDashboardData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      email: cliente.email || '',
      telefone: cliente.telefone,
      cpf: cliente.cpf || '',
      endereco: cliente.endereco || '',
      motos: cliente.motos.map(({ id, ...moto }) => moto)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await DataService.deleteCliente(id);
        await loadClientes();
        await loadDashboardData();
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
      }
    }
  };

  const handleDownloadHistorico = async (cliente: Cliente, moto: Moto) => {
    try {
      const historico = await HistoricoService.getHistoricoMoto(moto.id);
      const alertas = await HistoricoService.getAlertasAtivos();
      const alertasMoto = alertas.filter(a => a.motoId === moto.id);
      
      const pdfBlob = await PDFService.gerarHistoricoMedico(cliente, moto, historico, alertasMoto);
      PDFService.downloadPDF(pdfBlob, `historico-${cliente.nome}-${moto.placa}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF do histórico');
    }
  };

  const handleEnviarWhatsApp = async (cliente: Cliente, moto: Moto) => {
    try {
      const historico = await HistoricoService.getHistoricoMoto(moto.id);
      const alertas = await HistoricoService.getAlertasAtivos();
      const alertasMoto = alertas.filter(a => a.motoId === moto.id);
      
      const pdfBlob = await PDFService.gerarHistoricoMedico(cliente, moto, historico, alertasMoto);
      const sucesso = await EvolutionApiService.enviarHistoricoMedico(cliente, moto.id, pdfBlob);
      
      if (sucesso) {
        alert('Histórico enviado via WhatsApp com sucesso!');
      } else {
        alert('Erro ao enviar WhatsApp. Verifique as configurações da Evolution API.');
      }
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      alert('Erro ao enviar WhatsApp');
    }
  };

  const handleExportReport = async () => {
    try {
      // Filtrar dados baseado na configuração
      let dadosParaExportar = clientes;
      
      // Aplicar filtros
      if (exportConfig.statusCliente !== 'todos') {
        const hoje = new Date();
        const diasAtras = new Date();
        diasAtras.setDate(hoje.getDate() - parseInt(exportConfig.periodo));
        
        dadosParaExportar = dadosParaExportar.filter(cliente => {
          const ordensCliente = dashboardData?.clientesMaisLucrativos?.find(c => c.cliente.id === cliente.id);
          
          switch (exportConfig.statusCliente) {
            case 'ativos':
              return ordensCliente && ordensCliente.valor > 0;
            case 'inativos':
              return !ordensCliente || ordensCliente.valor === 0;
            case 'vip':
              return ordensCliente && ordensCliente.valor > dashboardData.ticketMedio * 3;
            default:
              return true;
          }
        });
      }
      
      // Ordenar dados
      dadosParaExportar.sort((a, b) => {
        switch (exportConfig.ordenarPor) {
          case 'nome':
            return a.nome.localeCompare(b.nome);
          case 'data':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'valor':
            const valorA = dashboardData?.clientesMaisLucrativos?.find(c => c.cliente.id === a.id)?.valor || 0;
            const valorB = dashboardData?.clientesMaisLucrativos?.find(c => c.cliente.id === b.id)?.valor || 0;
            return valorB - valorA;
          default:
            return 0;
        }
      });
      
      // Gerar relatório
      const relatorioData = {
        titulo: 'Relatório de Clientes - MotoGestor',
        dataGeracao: new Date().toLocaleDateString('pt-BR'),
        periodo: `Últimos ${exportConfig.periodo} dias`,
        totalClientes: dadosParaExportar.length,
        filtros: exportConfig,
        clientes: dadosParaExportar.map(cliente => ({
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          totalMotos: cliente.motos.length,
          dataUltimaVisita: dashboardData?.clientesMaisLucrativos?.find(c => c.cliente.id === cliente.id)?.valor || 0,
          ...(exportConfig.incluirHistorico && { motos: cliente.motos }),
          ...(exportConfig.incluirFinanceiro && { 
            valorTotal: dashboardData?.clientesMaisLucrativos?.find(c => c.cliente.id === cliente.id)?.valor || 0 
          })
        })),
        resumo: {
          ticketMedio: dashboardData?.ticketMedio || 0,
          clientesAtivos: dashboardData?.clientesAtivos || 0,
          clientesInativos: dashboardData?.clientesInativos || 0,
          valorTotalFaturado: dashboardData?.valorTotalFaturado || 0
        }
      };
      
      // Simular geração e download
      const jsonString = JSON.stringify(relatorioData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-clientes-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsExportModalOpen(false);
      alert('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      endereco: '',
      motos: []
    });
    setEditingCliente(null);
  };

  const addMoto = () => {
    setFormData(prev => ({
      ...prev,
      motos: [...prev.motos, { 
        placa: '', 
        fabricante: '',
        modelo: '', 
        ano: new Date().getFullYear(), 
        cor: '' 
      }]
    }));
  };

  const removeMoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      motos: prev.motos.filter((_, i) => i !== index)
    }));
  };

  const updateMoto = (index: number, field: string, value: string | number) => {
    if (field === 'fabricante') {
      setFormData(prev => ({
        ...prev,
        motos: prev.motos.map((moto, i) => 
          i === index ? { ...moto, fabricante: value as string, modelo: '' } : moto
        )
      }));
      return;
    }
    
    if (field === 'placa') {
      value = formatarPlaca(value as string);
    }
    
    setFormData(prev => ({
      ...prev,
      motos: prev.motos.map((moto, i) => 
        i === index ? { ...moto, [field]: value } : moto
      )
    }));
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
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
          <p className="text-gray-600">Gerencie seus clientes e analise métricas importantes</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant={showDashboard ? "primary" : "outline"}
            onClick={() => setShowDashboard(!showDashboard)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showDashboard ? 'Ocultar Analytics' : 'Mostrar Analytics'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsExportModalOpen(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar Dados
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Dashboard de Clientes */}
      {showDashboard && dashboardData && (
        <div className="space-y-6">
          {/* Insights Inteligentes */}
          {dashboardData.insights && dashboardData.insights.length > 0 && (
            <Card variant="elevated" className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <Brain className="h-5 w-5 mr-2" />
                  🧠 Insights Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.insights.map((insight: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        insight.tipo === 'warning' ? 'border-l-orange-400 bg-orange-50' :
                        insight.tipo === 'success' ? 'border-l-green-400 bg-green-50' :
                        'border-l-blue-400 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {insight.tipo === 'warning' && <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />}
                        {insight.tipo === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                        {insight.tipo === 'info' && <Target className="h-5 w-5 text-blue-500 mt-0.5" />}
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-800">{insight.titulo}</h4>
                          <p className="text-xs text-gray-600 mt-1">{insight.descricao}</p>
                          <p className="text-xs font-medium text-gray-700 mt-2">💡 {insight.acao}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filtros Inteligentes Aprimorados */}
          <Card variant="elevated" className="bg-gradient-to-r from-slate-50 to-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Settings2 className="h-5 w-5 mr-2 text-blue-600" />
                🎯 Central de Análise Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    📅 Período de Análise
                  </label>
                  <select
                    value={filtros.periodo}
                    onChange={(e) => {
                      setFiltros(prev => ({ ...prev, periodo: e.target.value }));
                      loadDashboardData();
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:border-blue-400"
                  >
                    <option value="7">📊 Últimos 7 dias</option>
                    <option value="30">📈 Últimos 30 dias</option>
                    <option value="90">📉 Últimos 90 dias</option>
                    <option value="365">🗓️ Último ano</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Zap className="h-4 w-4 mr-1" />
                    🔧 Tipo de Serviço
                  </label>
                  <select
                    value={filtros.tipoServico}
                    onChange={(e) => {
                      setFiltros(prev => ({ ...prev, tipoServico: e.target.value }));
                      loadDashboardData();
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:border-blue-400"
                  >
                    <option value="todos">🔧 Todos os Serviços</option>
                    <option value="manutencao">⚙️ Manutenção</option>
                    <option value="revisao">🔍 Revisão</option>
                    <option value="reparo">🛠️ Reparo</option>
                    <option value="emergencia">🚨 Emergência</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    👥 Segmentação
                  </label>
                  <select
                    value={filtros.statusCliente}
                    onChange={(e) => {
                      setFiltros(prev => ({ ...prev, statusCliente: e.target.value }));
                      loadDashboardData();
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:border-blue-400"
                  >
                    <option value="todos">👥 Todos os Clientes</option>
                    <option value="novos">✨ Novos (30 dias)</option>
                    <option value="ativos">🔥 Ativos</option>
                    <option value="inativos">😴 Inativos (90+ dias)</option>
                    <option value="vip">⭐ VIP (5+ serviços)</option>
                  </select>
                </div>
              </div>
              
              {/* Resumo Rápido */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 mb-4">
                <div className="flex items-center mb-2">
                  <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">💡 Insights Inteligentes</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white rounded p-2 border border-blue-100">
                    <span className="font-medium text-green-700">📈 Crescimento:</span>
                    <span className="text-gray-600 ml-1">+{dashboardData.crescimentoMensal}% novos clientes</span>
                  </div>
                  <div className="bg-white rounded p-2 border border-blue-100">
                    <span className="font-medium text-blue-700">🎯 Retenção:</span>
                    <span className="text-gray-600 ml-1">{dashboardData.taxaRetorno}% retornam</span>
                  </div>
                  <div className="bg-white rounded p-2 border border-blue-100">
                    <span className="font-medium text-purple-700">💰 Ticket Médio:</span>
                    <span className="text-gray-600 ml-1">{formatCurrency(dashboardData.ticketMedio)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={loadDashboardData}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  🔄 Atualizar Análise Completa
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Principais Expandidas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card variant="elevated" className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-blue-500 rounded-full">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-700 mb-1">{dashboardData.novosClientes}</div>
                <div className="text-sm font-medium text-blue-600 mb-2">Novos Clientes</div>
                <div className="flex items-center justify-center text-xs">
                  <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">+{dashboardData.crescimentoMensal}%</span>
                  <span className="text-gray-500 ml-1">vs período anterior</span>
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated" className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-green-500 rounded-full">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-700 mb-1">{dashboardData.clientesAtivos}</div>
                <div className="text-sm font-medium text-green-600 mb-2">Clientes Ativos</div>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">{Math.round((dashboardData.clientesAtivos / dashboardData.totalClientes) * 100)}%</span> do total
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated" className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-purple-500 rounded-full">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-700 mb-1">{dashboardData.clientesVIP}</div>
                <div className="text-sm font-medium text-purple-600 mb-2">Clientes VIP</div>
                <div className="text-xs text-gray-600">
                  5+ serviços realizados
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated" className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-orange-500 rounded-full">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-700 mb-1">
                  {formatCurrency(dashboardData.ticketMedio)}
                </div>
                <div className="text-sm font-medium text-orange-600 mb-2">Ticket Médio</div>
                <div className="text-xs text-gray-600">
                  Valor médio por serviço
                </div>
              </CardContent>
            </Card>
            
            <Card variant="elevated" className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-red-500 rounded-full">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-700 mb-1">{dashboardData.clientesInativos}</div>
                <div className="text-sm font-medium text-red-600 mb-2">Clientes Inativos</div>
                <div className="text-xs text-gray-600">
                  Sem atividade 90+ dias
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid de Análises Avançadas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por Tipo de Serviço */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                  📊 Distribuição por Tipo de Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Object.entries(dashboardData.clientesPorTipoServico).map(([tipo, quantidade]) => {
                    const total = Object.values(dashboardData.clientesPorTipoServico).reduce((a: any, b: any) => a + b, 0);
                    const porcentagem = Math.round((quantidade as number / total) * 100);
                    
                    const tipoIcons: { [key: string]: string } = {
                      'Manutenção': '🔧',
                      'Freios': '🛑',
                      'Revisão': '🔍',
                      'Outros': '⚙️'
                    };
                    
                    return (
                      <div key={tipo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{tipoIcons[tipo] || '⚙️'}</span>
                          <span className="text-sm font-medium text-gray-800">{tipo}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-3 shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full shadow-sm transition-all duration-500" 
                              style={{ width: `${porcentagem}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-blue-600 w-12">{porcentagem}%</span>
                          <span className="text-sm font-bold text-gray-700 w-12">({quantidade})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top 5 Clientes Mais Lucrativos */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-gold-600" />
                  🏆 Top 5 Clientes Mais Lucrativos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {dashboardData.clientesMaisLucrativos?.slice(0, 5).map((item: any, index: number) => (
                    <div key={item.cliente.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.cliente.nome}</p>
                          <p className="text-xs text-gray-600">{item.cliente.motos?.length || 0} moto(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(item.valor)}</p>
                        <p className="text-xs text-gray-500">faturado</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segmentação Visual de Clientes */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                🎯 Segmentação de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green-200">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">{dashboardData.clientesAtivos}</h3>
                  <p className="text-green-600 font-medium mb-1">Clientes Ativos</p>
                  <p className="text-xs text-gray-600">Atividade nos últimos 30 dias</p>
                  <div className="mt-3 w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(dashboardData.clientesAtivos / dashboardData.totalClientes) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg border border-purple-200">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-purple-700 mb-2">{dashboardData.clientesVIP}</h3>
                  <p className="text-purple-600 font-medium mb-1">Clientes VIP</p>
                  <p className="text-xs text-gray-600">5 ou mais serviços</p>
                  <div className="mt-3 w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(dashboardData.clientesVIP / dashboardData.totalClientes) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-red-50 to-rose-100 rounded-lg border border-red-200">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-700 mb-2">{dashboardData.clientesInativos}</h3>
                  <p className="text-red-600 font-medium mb-1">Clientes Inativos</p>
                  <p className="text-xs text-gray-600">Sem atividade há 90+ dias</p>
                  <div className="mt-3 w-full bg-red-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(dashboardData.clientesInativos / dashboardData.totalClientes) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Clientes */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClientes.map((cliente) => (
          <Card key={cliente.id} variant="outlined">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{cliente.nome}</h3>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(cliente)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(cliente.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {cliente.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {cliente.email}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {formatPhone(cliente.telefone)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Cliente desde {formatDate(cliente.createdAt)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Motos ({cliente.motos.length})</h4>
                <div className="space-y-2">
                  {cliente.motos.map((moto) => (
                    <div 
                      key={moto.id} 
                      className="p-2 bg-gray-50 rounded text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{moto.fabricante} {moto.modelo}</p>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadHistorico(cliente, moto)}
                            title="Baixar PDF do histórico"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnviarWhatsApp(cliente, moto)}
                            title="Enviar histórico via WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-600">{moto.placa} • {moto.ano} • {moto.cor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClientes.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </p>
        </div>
      )}

      {/* Modal de Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome *"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              label="Telefone *"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              required
            />
            <Input
              label="CPF"
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
            />
          </div>
          
          <Input
            label="Endereço"
            value={formData.endereco}
            onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
          />

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Motos</label>
              <Button type="button" variant="outline" size="sm" onClick={addMoto}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Moto
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.motos.map((moto, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Placa *"
                      value={moto.placa}
                      onChange={(e) => updateMoto(index, 'placa', e.target.value)}
                      placeholder="ABC-1234 ou ABC1D23"
                      helper={moto.placa ? `Formato: ${getTipoPlaca(moto.placa) === 'antiga' ? 'Antigo' : getTipoPlaca(moto.placa) === 'mercosul' ? 'Mercosul' : 'Inválido'}` : 'Digite a placa da motocicleta'}
                      error={moto.placa && !validarPlaca(moto.placa) ? 'Formato de placa inválido' : undefined}
                      required
                    />
                    <Select
                      label="Ano *"
                      value={moto.ano}
                      onChange={(e) => updateMoto(index, 'ano', parseInt(e.target.value))}
                      options={anosDisponiveis().map(ano => ({ value: ano, label: ano.toString() }))}
                      placeholder="Selecione o ano"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select
                      label="Fabricante *"
                      value={moto.fabricante || ''}
                      onChange={(e) => updateMoto(index, 'fabricante', e.target.value)}
                      options={fabricantes.map(fab => ({ value: fab, label: fab }))}
                      placeholder="Selecione o fabricante"
                      required
                    />
                    <Select
                      label="Modelo *"
                      value={moto.modelo}
                      onChange={(e) => updateMoto(index, 'modelo', e.target.value)}
                      options={moto.fabricante && modelosPorFabricante[moto.fabricante] 
                        ? modelosPorFabricante[moto.fabricante].map(modelo => ({ value: modelo, label: modelo }))
                        : [{ value: '', label: 'Selecione primeiro o fabricante' }]
                      }
                      placeholder="Selecione o modelo"
                      disabled={!moto.fabricante}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Select
                      label="Cor"
                      value={moto.cor}
                      onChange={(e) => updateMoto(index, 'cor', e.target.value)}
                      options={coresDisponiveis.map(cor => ({ value: cor, label: cor }))}
                      placeholder="Selecione a cor"
                      className="flex-1 mr-3"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMoto(index)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? (editingCliente ? 'Atualizando...' : 'Criando...') : (editingCliente ? 'Atualizar' : 'Criar')} Cliente
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Exportação */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exportar Relatório de Clientes"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">📊 Configuração do Relatório</h4>
            <p className="text-sm text-blue-800">
              Personalize seu relatório selecionando os dados e filtros desejados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Formato do Arquivo</label>
              <select
                value={exportConfig.formato}
                onChange={(e) => setExportConfig(prev => ({ ...prev, formato: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pdf">📄 PDF</option>
                <option value="excel">📊 Excel</option>
                <option value="csv">📋 CSV</option>
                <option value="json">🔧 JSON</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período dos Dados</label>
              <select
                value={exportConfig.periodo}
                onChange={(e) => setExportConfig(prev => ({ ...prev, periodo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="365">Último ano</option>
                <option value="all">Todos os dados</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status do Cliente</label>
              <select
                value={exportConfig.statusCliente}
                onChange={(e) => setExportConfig(prev => ({ ...prev, statusCliente: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos os clientes</option>
                <option value="ativos">Apenas ativos</option>
                <option value="inativos">Apenas inativos</option>
                <option value="vip">Apenas VIP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar Por</label>
              <select
                value={exportConfig.ordenarPor}
                onChange={(e) => setExportConfig(prev => ({ ...prev, ordenarPor: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="nome">Nome (A-Z)</option>
                <option value="data">Data de cadastro</option>
                <option value="valor">Valor total gasto</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Dados a Incluir</label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportConfig.incluirHistorico}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, incluirHistorico: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">📋 Histórico de serviços</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportConfig.incluirFinanceiro}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, incluirFinanceiro: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">💰 Dados financeiros</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportConfig.incluirAlertas}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, incluirAlertas: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">⚠️ Alertas de manutenção</span>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">📈 Preview do Relatório</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>Total de clientes:</strong> {clientes.length}</p>
              <p>• <strong>Período:</strong> {exportConfig.periodo === 'all' ? 'Todos os dados' : `Últimos ${exportConfig.periodo} dias`}</p>
              <p>• <strong>Formato:</strong> {exportConfig.formato.toUpperCase()}</p>
              <p>• <strong>Dados inclusos:</strong> {[
                exportConfig.incluirHistorico && 'Histórico',
                exportConfig.incluirFinanceiro && 'Financeiro',
                exportConfig.incluirAlertas && 'Alertas'
              ].filter(Boolean).join(', ') || 'Dados básicos'}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsExportModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExportReport}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Gerar e Baixar Relatório
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Clientes;
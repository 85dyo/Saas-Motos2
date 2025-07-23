import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Download, 
  Calendar, 
  Wrench, 
  AlertTriangle, 
  FileText,
  MessageCircle,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DataService } from '../services/dataService';
import { HistoricoService } from '../services/historicoService';
import { PDFService } from '../services/pdfService';
import { EvolutionApiService } from '../services/evolutionApiService';
import { Cliente, Moto, HistoricoServico, AlertaManutencao, OrdemServico } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const PortalCliente: React.FC = () => {
  const { clienteId } = useParams();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [historicos, setHistoricos] = useState<{ [motoId: string]: HistoricoServico[] }>({});
  const [alertas, setAlertas] = useState<{ [motoId: string]: AlertaManutencao[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [motoSelecionada, setMotoSelecionada] = useState<string>('');

  useEffect(() => {
    if (clienteId) {
      loadData();
    }
  }, [clienteId]);

  const loadData = async () => {
    if (!clienteId) return;

    try {
      const [clienteData, ordensData] = await Promise.all([
        DataService.getClienteById(clienteId),
        DataService.getAllOS()
      ]);

      if (clienteData) {
        setCliente(clienteData);
        setOrdens(ordensData.filter(os => os.clienteId === clienteId));

        // Carregar histórico e alertas para cada moto
        const historicosData: { [motoId: string]: HistoricoServico[] } = {};
        const alertasData: { [motoId: string]: AlertaManutencao[] } = {};

        for (const moto of clienteData.motos) {
          const [historicoMoto, alertasMoto] = await Promise.all([
            HistoricoService.getHistoricoMoto(moto.id),
            HistoricoService.getAlertasAtivos()
          ]);

          historicosData[moto.id] = historicoMoto;
          alertasData[moto.id] = alertasMoto.filter(a => a.motoId === moto.id);
        }

        setHistoricos(historicosData);
        setAlertas(alertasData);

        // Selecionar primeira moto por padrão
        if (clienteData.motos.length > 0) {
          setMotoSelecionada(clienteData.motos[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadHistorico = async (moto: Moto) => {
    if (!cliente) return;

    try {
      const historico = historicos[moto.id] || [];
      const alertasMoto = alertas[moto.id] || [];
      
      // Obter configurações da oficina
      const config = JSON.parse(localStorage.getItem('motogestor_config') || '{}');
      const oficinaInfo = {
        nome: config.oficina?.nome || 'MotoGestor',
        endereco: config.oficina?.endereco,
        telefone: config.oficina?.telefone,
        email: config.oficina?.email,
        logo: config.oficina?.logo
      };
      
      const pdfBlob = await PDFService.gerarHistoricoManutencao(
        cliente, 
        moto, 
        historico, 
        alertasMoto, 
        oficinaInfo,
        'Histórico de Manutenção da Motocicleta'
      );
      PDFService.downloadPDF(pdfBlob, `historico-${moto.placa}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF do histórico de manutenção');
    }
  };

  const handleEnviarPorEmail = async (moto: Moto) => {
    if (!cliente || !cliente.email) {
      alert('Email não cadastrado');
      return;
    }

    try {
      const historico = historicos[moto.id] || [];
      const alertasMoto = alertas[moto.id] || [];
      
      // Obter configurações da oficina
      const config = JSON.parse(localStorage.getItem('motogestor_config') || '{}');
      const oficinaInfo = {
        nome: config.oficina?.nome || 'MotoGestor',
        endereco: config.oficina?.endereco,
        telefone: config.oficina?.telefone,
        email: config.oficina?.email,
        logo: config.oficina?.logo
      };
      
      const pdfBlob = await PDFService.gerarHistoricoManutencao(
        cliente, 
        moto, 
        historico, 
        alertasMoto, 
        oficinaInfo,
        'Histórico de Manutenção da Motocicleta'
      );
      const sucesso = await PDFService.enviarPorEmail(cliente, moto, pdfBlob, oficinaInfo);
      
      if (sucesso) {
        alert('Histórico de manutenção enviado por email com sucesso!');
      } else {
        alert('Erro ao enviar email');
      }
    } catch (error) {
      console.error('Erro ao enviar por email:', error);
      alert('Erro ao enviar histórico de manutenção por email');
    }
  };

  const handleSolicitarWhatsApp = async (moto: Moto) => {
    if (!cliente) return;

    try {
      const historico = historicos[moto.id] || [];
      const alertasMoto = alertas[moto.id] || [];
      
      // Obter configurações da oficina
      const config = JSON.parse(localStorage.getItem('motogestor_config') || '{}');
      const oficinaInfo = {
        nome: config.oficina?.nome || 'MotoGestor',
        endereco: config.oficina?.endereco,
        telefone: config.oficina?.telefone,
        email: config.oficina?.email,
        logo: config.oficina?.logo
      };
      
      const pdfBlob = await PDFService.gerarHistoricoManutencao(
        cliente, 
        moto, 
        historico, 
        alertasMoto, 
        oficinaInfo,
        'Histórico de Manutenção da Motocicleta'
      );
      const sucesso = await EvolutionApiService.enviarHistoricoManutencao(cliente, moto.id, pdfBlob);
      
      if (sucesso) {
        alert('Histórico de manutenção enviado via WhatsApp!');
      } else {
        alert('Erro ao enviar WhatsApp');
      }
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      alert('Erro ao enviar histórico de manutenção via WhatsApp');
    }
  };

  const getStatusBadge = (status: OrdemServico['status']) => {
    switch (status) {
      case 'aguardando_aprovacao':
        return <Badge variant="warning">Aguardando Aprovação</Badge>;
      case 'em_andamento':
        return <Badge variant="info">Em Andamento</Badge>;
      case 'concluido':
        return <Badge variant="success">Concluído</Badge>;
      case 'cancelado':
        return <Badge variant="error">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'critica':
        return <Badge variant="error">Crítica</Badge>;
      case 'alta':
        return <Badge variant="warning">Alta</Badge>;
      case 'media':
        return <Badge variant="info">Média</Badge>;
      default:
        return <Badge variant="default">Baixa</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cliente não encontrado</h1>
          <p className="text-gray-600">Verifique o link de acesso</p>
        </div>
      </div>
    );
  }

  const motoAtual = cliente.motos.find(m => m.id === motoSelecionada);
  const historicoAtual = historicos[motoSelecionada] || [];
  const alertasAtuais = alertas[motoSelecionada] || [];
  const ordensAbertas = ordens.filter(os => os.status !== 'concluido' && os.status !== 'cancelado');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portal do Cliente</h1>
              <p className="text-gray-600">Bem-vindo, {cliente.nome}!</p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                {cliente.telefone}
              </div>
              {cliente.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {cliente.email}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seletor de Moto */}
        {cliente.motos.length > 1 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Selecione sua motocicleta:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cliente.motos.map((moto) => (
                  <button
                    key={moto.id}
                    onClick={() => setMotoSelecionada(moto.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      motoSelecionada === moto.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium">{moto.modelo}</p>
                    <p className="text-sm text-gray-600">{moto.placa} • {moto.ano}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {motoAtual && (
          <div className="space-y-6">
            {/* Resumo da Moto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>🏍️ {motoAtual.modelo} - {motoAtual.placa}</span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadHistorico(motoAtual)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    {cliente.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEnviarPorEmail(motoAtual)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar Email
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSolicitarWhatsApp(motoAtual)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{historicoAtual.length}</div>
                    <div className="text-sm text-gray-600">Serviços Realizados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(historicoAtual.reduce((sum, h) => sum + h.valor, 0))}
                    </div>
                    <div className="text-sm text-gray-600">Investimento Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{alertasAtuais.length}</div>
                    <div className="text-sm text-gray-600">Alertas Ativos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {historicoAtual.length > 0 ? Math.floor(
                        (new Date().getTime() - new Date(historicoAtual[0].data).getTime()) / (1000 * 60 * 60 * 24)
                      ) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Dias Último Serviço</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alertas Ativos */}
            {alertasAtuais.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                    Alertas de Manutenção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alertasAtuais.map((alerta) => (
                      <div key={alerta.id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-orange-900">{alerta.titulo}</h4>
                          {getPrioridadeBadge(alerta.prioridade)}
                        </div>
                        <p className="text-sm text-orange-800 mb-2">{alerta.descricao}</p>
                        <p className="text-xs text-orange-600">
                          Vencimento: {formatDate(alerta.dataVencimento)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ordens de Serviço Ativas */}
            {ordensAbertas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wrench className="h-5 w-5 mr-2" />
                    Ordens de Serviço em Andamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ordensAbertas.map((os) => (
                      <div key={os.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-blue-900">{os.numeroOS}</h4>
                            <p className="text-sm text-blue-800">{os.descricao}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(os.status)}
                            <p className="text-sm font-medium text-blue-900 mt-1">
                              {formatCurrency(os.valor)}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-blue-600">
                          Criada em: {formatDate(os.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Histórico de Serviços */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Histórico de Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historicoAtual.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nenhum serviço registrado para esta moto
                  </p>
                ) : (
                  <div className="space-y-4">
                    {historicoAtual.slice(0, 10).map((servico) => (
                      <div key={servico.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{servico.descricao}</h4>
                            <p className="text-sm text-gray-600">
                              {formatDate(servico.data)} • {servico.quilometragem.toLocaleString()}km
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={servico.tipoServico === 'preventiva' ? 'success' : 'warning'}>
                              {servico.tipoServico}
                            </Badge>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {formatCurrency(servico.valor)}
                            </p>
                          </div>
                        </div>
                        
                        {servico.pecasTrocadas.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Peças Trocadas:</p>
                            <div className="flex flex-wrap gap-2">
                              {servico.pecasTrocadas.map((peca) => (
                                <span key={peca.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {peca.nome}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {servico.proximaRevisao && (
                          <div className="mt-3 p-2 bg-blue-50 rounded">
                            <p className="text-sm text-blue-800">
                              <strong>Próxima Revisão:</strong> {formatDate(servico.proximaRevisao.data)} 
                              ou {servico.proximaRevisao.quilometragem.toLocaleString()}km
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {historicoAtual.length > 10 && (
                      <div className="text-center">
                        <p className="text-sm text-gray-500">
                          Mostrando 10 de {historicoAtual.length} serviços. 
                          Baixe o PDF para ver o histórico completo.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalCliente;
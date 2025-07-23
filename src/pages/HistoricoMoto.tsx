import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Wrench, 
  AlertTriangle, 
  TrendingUp,
  FileText,
  Camera,
  Download,
  MessageCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { HistoricoService } from '../services/historicoService';
import { DataService } from '../services/dataService';
import { WhatsAppService } from '../services/whatsappService';
import { Cliente, Moto, HistoricoServico, AlertaManutencao } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const HistoricoMoto: React.FC = () => {
  const { clienteId, motoId } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [moto, setMoto] = useState<Moto | null>(null);
  const [historico, setHistorico] = useState<HistoricoServico[]>([]);
  const [alertas, setAlertas] = useState<AlertaManutencao[]>([]);
  const [analise, setAnalise] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [clienteId, motoId]);

  const loadData = async () => {
    if (!clienteId || !motoId) return;

    try {
      const [clienteData, historicoData, alertasData, analiseData] = await Promise.all([
        DataService.getClienteById(clienteId),
        HistoricoService.getHistoricoMoto(motoId),
        HistoricoService.getAlertasAtivos(),
        HistoricoService.analisarPadraoManutencao(motoId)
      ]);

      setCliente(clienteData);
      setMoto(clienteData?.motos.find(m => m.id === motoId) || null);
      setHistorico(historicoData);
      setAlertas(alertasData.filter(a => a.motoId === motoId));
      setAnalise(analiseData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnviarWhatsApp = async () => {
    if (!cliente || !moto) return;

    try {
      const relatorio = await HistoricoService.gerarRelatorioMedico(moto.id);
      // Simular envio via WhatsApp
      alert('Histórico enviado via WhatsApp para o cliente!');
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
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
      
      const pdfBlob = await PDFService.gerarHistoricoMedico(
        cliente, 
        moto, 
        historico, 
        alertasMoto, 
        oficinaInfo,
        'Relatório de Manutenção'
      );
      PDFService.downloadPDF(pdfBlob, `historico-${moto.placa}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF do histórico');
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

  const getTipoServicoBadge = (tipo: string) => {
    switch (tipo) {
      case 'preventiva':
        return <Badge variant="success">Preventiva</Badge>;
      case 'corretiva':
        return <Badge variant="warning">Corretiva</Badge>;
      case 'revisao':
        return <Badge variant="info">Revisão</Badge>;
      case 'emergencia':
        return <Badge variant="error">Emergência</Badge>;
      default:
        return <Badge variant="default">{tipo}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cliente || !moto) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Moto não encontrada</p>
        <Button onClick={() => navigate('/clientes')} className="mt-4">
          Voltar para Clientes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/clientes')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Histórico Médico - {moto.modelo}
            </h1>
            <p className="text-gray-600">
              {cliente.nome} • {moto.placa} • {moto.ano}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleEnviarWhatsApp}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar via WhatsApp
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Resumo e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Análise Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Status Geral</h4>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      analise?.riscoPotencial === 'baixo' ? 'bg-green-500' :
                      analise?.riscoPotencial === 'medio' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="capitalize">{analise?.riscoPotencial} risco</span>
                  </div>
                </div>

                {analise?.recomendacoes && analise.recomendacoes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recomendações</h4>
                    <ul className="space-y-1">
                      {analise.recomendacoes.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analise?.proximosServicos && analise.proximosServicos.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Próximos Serviços Previstos</h4>
                    <div className="flex flex-wrap gap-2">
                      {analise.proximosServicos.map((servico: string, index: number) => (
                        <Badge key={index} variant="info">{servico}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Alertas Ativos ({alertas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertas.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum alerta ativo</p>
                ) : (
                  alertas.map((alerta) => (
                    <div key={alerta.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-sm">{alerta.titulo}</h5>
                        {getPrioridadeBadge(alerta.prioridade)}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{alerta.descricao}</p>
                      <p className="text-xs text-gray-500">
                        Vence em: {formatDate(alerta.dataVencimento)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{historico.length}</div>
            <div className="text-sm text-gray-600">Total de Serviços</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(historico.reduce((sum, h) => sum + h.valor, 0))}
            </div>
            <div className="text-sm text-gray-600">Investimento Total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {historico.filter(h => h.tipoServico === 'preventiva').length}
            </div>
            <div className="text-sm text-gray-600">Preventivas</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {historico.length > 0 ? Math.floor(
                (new Date().getTime() - new Date(historico[0].data).getTime()) / (1000 * 60 * 60 * 24)
              ) : 0}
            </div>
            <div className="text-sm text-gray-600">Dias Último Serviço</div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline do Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Timeline de Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {historico.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhum serviço registrado para esta moto
              </p>
            ) : (
              historico.map((servico, index) => (
                <div key={servico.id} className="relative">
                  {index < historico.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
                  )}
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Wrench className="h-6 w-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{servico.descricao}</h4>
                            <p className="text-sm text-gray-600">
                              {formatDate(servico.data)} • {servico.quilometragem.toLocaleString()}km
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTipoServicoBadge(servico.tipoServico)}
                            <span className="font-bold text-green-600">
                              {formatCurrency(servico.valor)}
                            </span>
                          </div>
                        </div>
                        
                        {servico.pecasTrocadas.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Peças Trocadas:</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {servico.pecasTrocadas.map((peca) => (
                                <div key={peca.id} className="text-sm bg-gray-50 p-2 rounded">
                                  <span className="font-medium">{peca.nome}</span>
                                  {peca.garantia && (
                                    <span className="text-gray-500 ml-2">
                                      (Garantia: {peca.garantia.meses}m)
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {servico.proximaRevisao && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Próxima Revisão:</strong> {formatDate(servico.proximaRevisao.data)} 
                              ou {servico.proximaRevisao.quilometragem.toLocaleString()}km
                            </p>
                          </div>
                        )}
                        
                        {servico.observacoes && (
                          <div className="mt-3 text-sm text-gray-600">
                            <strong>Observações:</strong> {servico.observacoes}
                          </div>
                        )}
                        
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>Mecânico: {servico.mecanico}</span>
                          {servico.fotos && servico.fotos.length > 0 && (
                            <span className="flex items-center">
                              <Camera className="h-3 w-3 mr-1" />
                              {servico.fotos.length} foto(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricoMoto;
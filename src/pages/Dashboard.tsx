import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DataService } from '../services/dataService';
import { DashboardMetrics, OrdemServico } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await DataService.getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral das suas operações</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">OS em Andamento</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.osEmAndamento}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Faturamento do Mês</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics.faturamentoMes)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Novos Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.novosClientes}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de OS</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.osRecentes.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent OS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Ordens de Serviço Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.osRecentes.slice(0, 5).map((os) => (
                <div key={os.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {os.numeroOS} - {os.cliente.nome}
                    </p>
                    <p className="text-xs text-gray-500">
                      {os.moto.modelo} • {formatDate(os.createdAt)}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(os.valor)}
                    </span>
                    {getStatusBadge(os.status)}
                  </div>
                </div>
              ))}
              {metrics.osRecentes.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Nenhuma ordem de serviço encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Top Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topClientes.map((item, index) => (
                <div key={item.cliente.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.cliente.nome}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.totalServicos} serviços • {formatCurrency(item.totalGasto)}
                    </p>
                  </div>
                </div>
              ))}
              {metrics.topClientes.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Nenhum cliente encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
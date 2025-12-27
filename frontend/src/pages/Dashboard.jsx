import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Bell,
  Clock,
  TrendingUp,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { dashboardApi, projectsApi } from '../lib/api';
import { formatDate, getStatusColor, getStatusLabel, calculateDaysRemaining } from '../lib/utils';

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, projectsRes] = await Promise.all([
        dashboardApi.getStats(),
        projectsApi.getAll()
      ]);
      setStats(statsRes.data);
      setRecentProjects(projectsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Dashboard yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Aktif Projeler', 
      value: stats?.projects?.active || 0, 
      total: stats?.projects?.total || 0,
      icon: FolderKanban, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    { 
      title: 'Üretimdeki Parçalar', 
      value: stats?.parts?.in_production || 0, 
      total: stats?.parts?.total || 0,
      icon: Package, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    { 
      title: 'Bekleyen Siparişler', 
      value: stats?.orders?.pending || 0, 
      total: stats?.orders?.total || 0,
      icon: ShoppingCart, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    { 
      title: 'Tedarikçiler', 
      value: stats?.suppliers?.total || 0, 
      total: null,
      icon: Users, 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      {/* Welcome Banner */}
      <div 
        className="relative rounded-sm overflow-hidden bg-primary text-primary-foreground p-8"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.7)), url(https://images.unsplash.com/photo-1764115424769-ebdd2683d5a8?w=1200)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <h1 className="font-heading text-3xl font-bold mb-2">Hoş Geldiniz!</h1>
        <p className="text-primary-foreground/80 max-w-xl">
          ProManufakt ile üretim planlama ve tedarik zinciri süreçlerinizi kolayca yönetin.
        </p>
        <Button 
          className="mt-4 bg-orange-500 hover:bg-orange-600"
          onClick={() => navigate('/projects')}
          data-testid="create-project-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Proje Oluştur
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="stat-card" data-testid={`stat-card-${index}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold font-heading mt-1">{stat.value}</p>
                  {stat.total !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Toplam: {stat.total}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-sm ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <Card className="lg:col-span-2" data-testid="recent-projects-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading">Son Projeler</CardTitle>
              <CardDescription>En son oluşturulan projeler</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
              Tümünü Gör
            </Button>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Henüz proje oluşturulmamış</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div 
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-sm hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    data-testid={`project-item-${project.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 rounded-sm">
                        <FolderKanban className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{project.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Teslim</p>
                        <p className="font-medium">{formatDate(project.end_date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Pending Quotes */}
          <Card data-testid="pending-quotes-card">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Bekleyen Teklifler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-4xl font-bold font-heading text-orange-500">
                  {stats?.pending_quotes || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">teklif yanıt bekliyor</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => navigate('/quotes')}
              >
                Teklifleri Görüntüle
              </Button>
            </CardContent>
          </Card>

          {/* Unread Notifications */}
          <Card data-testid="notifications-card">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                Bildirimler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-4xl font-bold font-heading text-blue-500">
                  {stats?.unread_notifications || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">okunmamış bildirim</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => navigate('/notifications')}
              >
                Bildirimleri Görüntüle
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          {stats?.upcoming_orders?.length > 0 && (
            <Card data-testid="upcoming-deadlines-card">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Yaklaşan Terminler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.upcoming_orders.slice(0, 3).map((order) => {
                  const days = calculateDaysRemaining(order.expected_delivery);
                  return (
                    <div 
                      key={order.id}
                      className="flex items-center justify-between p-2 rounded-sm bg-amber-50"
                    >
                      <span className="text-sm font-medium">{order.code}</span>
                      <Badge variant={days <= 2 ? 'destructive' : 'secondary'}>
                        {days} gün
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, FolderKanban, Calendar, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { projectsApi } from '../lib/api';
import { formatDate, getStatusColor, getStatusLabel, cn } from '../lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    customer_name: '',
    start_date: new Date(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    notes: ''
  });

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  const loadProjects = async () => {
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const response = await projectsApi.getAll(status);
      setProjects(response.data);
    } catch (error) {
      toast.error('Projeler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name) {
      toast.error('Proje adı zorunludur');
      return;
    }

    try {
      await projectsApi.create({
        name: formData.name,
        customer_name: formData.customer_name || null,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString(),
        notes: formData.notes || null
      });
      toast.success('Proje başarıyla oluşturuldu');
      setShowCreateDialog(false);
      setFormData({
        name: '',
        customer_name: '',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: ''
      });
      loadProjects();
    } catch (error) {
      toast.error('Proje oluşturulurken hata oluştu');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;
    
    try {
      await projectsApi.delete(projectId);
      toast.success('Proje silindi');
      loadProjects();
    } catch (error) {
      toast.error('Proje silinirken hata oluştu');
    }
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.customer_name && project.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="projects-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Projeler</h1>
          <p className="text-muted-foreground">Tüm projeleri görüntüle ve yönet</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="create-project-btn">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Proje
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Proje ara..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="planning">Planlama</SelectItem>
            <SelectItem value="in_progress">Devam Ediyor</SelectItem>
            <SelectItem value="completed">Tamamlandı</SelectItem>
            <SelectItem value="on_hold">Beklemede</SelectItem>
            <SelectItem value="cancelled">İptal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-heading text-lg font-semibold mb-2">Proje Bulunamadı</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {searchQuery ? 'Arama kriterlerine uygun proje bulunamadı.' : 'Henüz proje oluşturulmamış. Yeni bir proje oluşturarak başlayın.'}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                İlk Projeyi Oluştur
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-md transition-shadow cursor-pointer group"
              data-testid={`project-card-${project.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div onClick={() => navigate(`/projects/${project.id}`)} className="flex-1">
                    <p className="text-xs font-mono text-muted-foreground">{project.code}</p>
                    <CardTitle className="font-heading text-lg mt-1 group-hover:text-orange-500 transition-colors">
                      {project.name}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent onClick={() => navigate(`/projects/${project.id}`)}>
                {project.customer_name && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Müşteri: {project.customer_name}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(project.end_date)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg" data-testid="create-project-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Yeni Proje Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Proje Adı *</Label>
              <Input 
                id="name"
                placeholder="Örn: Hidrolik Ünitesi İmalatı"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                data-testid="project-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">Müşteri</Label>
              <Input 
                id="customer"
                placeholder="Müşteri adı (opsiyonel)"
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                data-testid="customer-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Başlangıç Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(formData.start_date, 'dd MMM yyyy', { locale: tr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => date && setFormData({...formData, start_date: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Teslim Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(formData.end_date, 'dd MMM yyyy', { locale: tr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => date && setFormData({...formData, end_date: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea 
                id="notes"
                placeholder="Proje hakkında notlar (opsiyonel)"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                data-testid="project-notes-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleCreateProject} data-testid="submit-project-btn">
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProjectsPage;

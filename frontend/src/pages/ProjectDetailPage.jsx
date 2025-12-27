import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Package, Clock, BarChart3, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { projectsApi, partsApi, staticDataApi, dashboardApi } from '../lib/api';
import { formatDate, getStatusColor, getStatusLabel, getGanttBarClass, cn } from '../lib/utils';
import { toast } from 'sonner';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [parts, setParts] = useState([]);
  const [ganttData, setGanttData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPartDialog, setShowPartDialog] = useState(false);
  const [materials, setMaterials] = useState({});
  const [formTypes, setFormTypes] = useState({});
  const [methods, setMethods] = useState({});
  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({});
  
  const [partForm, setPartForm] = useState({
    name: '',
    code: '',
    quantity: 1,
    material: '',
    form_type: '',
    dimensions: {},
    manufacturing_methods: [],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const [projectRes, partsRes, materialsRes, formTypesRes, methodsRes, ganttRes] = await Promise.all([
        projectsApi.getOne(projectId),
        partsApi.getAll(projectId),
        staticDataApi.getMaterials(),
        staticDataApi.getFormTypes(),
        staticDataApi.getManufacturingMethods(),
        dashboardApi.getGantt(projectId)
      ]);
      
      setProject(projectRes.data);
      setProjectForm(projectRes.data);
      setParts(partsRes.data);
      setMaterials(materialsRes.data);
      setFormTypes(formTypesRes.data);
      setMethods(methodsRes.data);
      setGanttData(ganttRes.data);
    } catch (error) {
      toast.error('Proje yüklenirken hata oluştu');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    try {
      await projectsApi.update(projectId, {
        name: projectForm.name,
        customer_name: projectForm.customer_name,
        status: projectForm.status,
        notes: projectForm.notes
      });
      setProject(projectForm);
      setEditingProject(false);
      toast.success('Proje güncellendi');
    } catch (error) {
      toast.error('Proje güncellenirken hata oluştu');
    }
  };

  const handleCreatePart = async () => {
    if (!partForm.name || !partForm.code || !partForm.quantity) {
      toast.error('Parça adı, kodu ve adet zorunludur');
      return;
    }

    try {
      await partsApi.create({
        project_id: projectId,
        ...partForm
      });
      toast.success('Parça eklendi');
      setShowPartDialog(false);
      setPartForm({
        name: '',
        code: '',
        quantity: 1,
        material: '',
        form_type: '',
        dimensions: {},
        manufacturing_methods: [],
        notes: ''
      });
      loadData();
    } catch (error) {
      toast.error('Parça eklenirken hata oluştu');
    }
  };

  const handleDeletePart = async (partId) => {
    if (!window.confirm('Bu parçayı silmek istediğinize emin misiniz?')) return;
    
    try {
      await partsApi.delete(partId);
      toast.success('Parça silindi');
      loadData();
    } catch (error) {
      toast.error('Parça silinirken hata oluştu');
    }
  };

  const toggleMethod = (code) => {
    const current = partForm.manufacturing_methods;
    if (current.includes(code)) {
      setPartForm({...partForm, manufacturing_methods: current.filter(c => c !== code)});
    } else {
      setPartForm({...partForm, manufacturing_methods: [...current, code]});
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) return null;

  // Group methods by category
  const methodsByCategory = Object.values(methods).reduce((acc, method) => {
    if (!acc[method.category]) acc[method.category] = [];
    acc[method.category].push(method);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in" data-testid="project-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          {editingProject ? (
            <Input 
              value={projectForm.name}
              onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
              className="text-2xl font-bold font-heading h-auto py-1"
            />
          ) : (
            <h1 className="font-heading text-2xl font-bold">{project.name}</h1>
          )}
          <p className="text-muted-foreground font-mono">{project.code}</p>
        </div>
        <Badge className={getStatusColor(project.status)}>
          {getStatusLabel(project.status)}
        </Badge>
        {editingProject ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditingProject(false)}>İptal</Button>
            <Button onClick={handleUpdateProject}>
              <Save className="h-4 w-4 mr-2" />
              Kaydet
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditingProject(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
        )}
      </div>

      {/* Project Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Müşteri</p>
              {editingProject ? (
                <Input 
                  value={projectForm.customer_name || ''}
                  onChange={(e) => setProjectForm({...projectForm, customer_name: e.target.value})}
                  placeholder="Müşteri adı"
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{project.customer_name || '-'}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Başlangıç</p>
              <p className="font-medium">{formatDate(project.start_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teslim Tarihi</p>
              <p className="font-medium">{formatDate(project.end_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Durum</p>
              {editingProject ? (
                <Select 
                  value={projectForm.status} 
                  onValueChange={(v) => setProjectForm({...projectForm, status: v})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planlama</SelectItem>
                    <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="on_hold">Beklemede</SelectItem>
                    <SelectItem value="cancelled">İptal</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              )}
            </div>
          </div>
          {project.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Notlar</p>
              <p className="mt-1">{project.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="parts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="parts" className="gap-2">
            <Package className="h-4 w-4" />
            Parçalar ({parts.length})
          </TabsTrigger>
          <TabsTrigger value="gantt" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Gantt Chart
          </TabsTrigger>
        </TabsList>

        {/* Parts Tab */}
        <TabsContent value="parts" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowPartDialog(true)} data-testid="add-part-btn">
              <Plus className="h-4 w-4 mr-2" />
              Parça Ekle
            </Button>
          </div>

          {parts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Parça Bulunamadı</h3>
                <p className="text-muted-foreground text-center">
                  Bu projeye henüz parça eklenmemiş.
                </p>
                <Button className="mt-4" onClick={() => setShowPartDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Parçayı Ekle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-sm overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Parça Kodu</th>
                    <th>Parça Adı</th>
                    <th>Adet</th>
                    <th>Malzeme</th>
                    <th>İmalat Yöntemleri</th>
                    <th>Durum</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((part) => (
                    <tr key={part.id} data-testid={`part-row-${part.id}`}>
                      <td className="font-mono">{part.code}</td>
                      <td className="font-medium">{part.name}</td>
                      <td>{part.quantity}</td>
                      <td>{materials[part.material]?.name || part.material || '-'}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {part.manufacturing_methods?.map(code => (
                            <Badge key={code} variant="outline" className="text-xs">
                              {methods[code]?.name || code}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <Badge className={getStatusColor(part.status)}>
                          {getStatusLabel(part.status)}
                        </Badge>
                      </td>
                      <td>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeletePart(part.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Gantt Chart Tab */}
        <TabsContent value="gantt">
          <Card>
            <CardHeader>
              <CardTitle>Üretim Planı</CardTitle>
              <CardDescription>Parçaların imalat süreçleri ve zaman planlaması</CardDescription>
            </CardHeader>
            <CardContent>
              {ganttData?.tasks?.length > 0 ? (
                <div className="space-y-2">
                  {ganttData.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-mono truncate">{task.part_code}</div>
                      <div className={cn('gantt-bar flex-1', getGanttBarClass(task.category))}>
                        {task.method_name} ({task.duration_days} gün)
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz planlama yapılmamış</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Part Dialog */}
      <Dialog open={showPartDialog} onOpenChange={setShowPartDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="add-part-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Yeni Parça Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Parça Adı *</Label>
                <Input 
                  placeholder="Örn: Mil"
                  value={partForm.name}
                  onChange={(e) => setPartForm({...partForm, name: e.target.value})}
                  data-testid="part-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Parça Kodu *</Label>
                <Input 
                  placeholder="Örn: MIL-001"
                  value={partForm.code}
                  onChange={(e) => setPartForm({...partForm, code: e.target.value})}
                  className="font-mono"
                  data-testid="part-code-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Adet *</Label>
                <Input 
                  type="number"
                  min="1"
                  value={partForm.quantity}
                  onChange={(e) => setPartForm({...partForm, quantity: parseInt(e.target.value) || 1})}
                  data-testid="part-quantity-input"
                />
              </div>
            </div>

            {/* Material & Form */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ham Malzeme</Label>
                <Select 
                  value={partForm.material} 
                  onValueChange={(v) => setPartForm({...partForm, material: v})}
                >
                  <SelectTrigger data-testid="material-select">
                    <SelectValue placeholder="Malzeme seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(materials).map(([key, mat]) => (
                      <SelectItem key={key} value={key}>
                        {mat.name} - {mat.group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Form Tipi</Label>
                <Select 
                  value={partForm.form_type} 
                  onValueChange={(v) => setPartForm({...partForm, form_type: v})}
                >
                  <SelectTrigger data-testid="form-type-select">
                    <SelectValue placeholder="Form tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(formTypes).map(([key, form]) => (
                      <SelectItem key={key} value={key}>
                        {form.name} - {form.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dimensions based on form type */}
            {partForm.form_type && formTypes[partForm.form_type] && (
              <div className="space-y-2">
                <Label>Ölçüler</Label>
                <div className="grid grid-cols-3 gap-4">
                  {formTypes[partForm.form_type].dimensions.map((dim) => (
                    <div key={dim} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {formTypes[partForm.form_type].dimension_labels[dim]}
                      </Label>
                      <Input 
                        type="number"
                        placeholder="0"
                        value={partForm.dimensions[dim] || ''}
                        onChange={(e) => setPartForm({
                          ...partForm, 
                          dimensions: {...partForm.dimensions, [dim]: parseFloat(e.target.value) || 0}
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manufacturing Methods */}
            <div className="space-y-2">
              <Label>İmalat Yöntemleri</Label>
              <div className="border rounded-sm p-4 max-h-64 overflow-y-auto space-y-4">
                {Object.entries(methodsByCategory).map(([category, categoryMethods]) => (
                  <div key={category}>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{category}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryMethods.map((method) => (
                        <div 
                          key={method.code}
                          className="flex items-center gap-2"
                        >
                          <Checkbox 
                            id={`method-${method.code}`}
                            checked={partForm.manufacturing_methods.includes(method.code)}
                            onCheckedChange={() => toggleMethod(method.code)}
                          />
                          <Label 
                            htmlFor={`method-${method.code}`} 
                            className="text-sm cursor-pointer"
                          >
                            <span className="font-mono text-xs text-muted-foreground mr-1">
                              {method.code}
                            </span>
                            {method.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea 
                placeholder="Parça hakkında notlar"
                value={partForm.notes}
                onChange={(e) => setPartForm({...partForm, notes: e.target.value})}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartDialog(false)}>İptal</Button>
            <Button onClick={handleCreatePart} data-testid="submit-part-btn">Parça Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProjectDetailPage;

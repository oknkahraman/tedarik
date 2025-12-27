import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '../lib/utils';

const CATEGORY_COLORS = {
  'Metal Şekillendirme': { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-100' },
  'Kaynak': { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-100' },
  'Talaşlı İmalat': { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-100' },
  '3D Baskı': { bg: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-100' },
  'Yüzey İşlemi': { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-100' },
  'Hazır Malzeme': { bg: 'bg-gray-500', text: 'text-gray-500', light: 'bg-gray-100' },
};

export function GanttChart({ project, tasks, onTaskClick }) {
  const [zoom, setZoom] = useState(40); // pixels per day
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef(null);
  const [hoveredTask, setHoveredTask] = useState(null);

  if (!project || !tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mb-3 opacity-50" />
        <p>Henüz planlama yapılmamış</p>
        <p className="text-sm">Parça ekleyerek planlamayı başlatın</p>
      </div>
    );
  }

  // Calculate date range
  const startDate = new Date(project.start_date);
  const endDate = new Date(project.end_date);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 10;
  
  // Group tasks by part
  const tasksByPart = tasks.reduce((acc, task) => {
    if (!acc[task.part_id]) {
      acc[task.part_id] = { part_name: task.part_name, part_code: task.part_code, tasks: [] };
    }
    acc[task.part_id].tasks.push(task);
    return acc;
  }, {});

  // Generate date headers
  const generateDateHeaders = () => {
    const headers = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate || headers.length < totalDays) {
      headers.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        month: currentDate.toLocaleDateString('tr-TR', { month: 'short' }),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
        isToday: currentDate.toDateString() === new Date().toDateString()
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return headers;
  };

  const dateHeaders = generateDateHeaders();

  // Calculate task position
  const getTaskPosition = (task) => {
    const taskStart = new Date(task.start);
    const taskEnd = new Date(task.end);
    const daysFromStart = Math.floor((taskStart - startDate) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24));
    
    return {
      left: daysFromStart * zoom,
      width: Math.max(duration * zoom - 4, zoom - 4)
    };
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 10, 80));
  const handleZoomOut = () => setZoom(Math.max(zoom - 10, 20));
  
  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollLeft -= 200;
    }
  };
  
  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollLeft += 200;
    }
  };

  return (
    <div className="space-y-4" data-testid="gantt-chart">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Yakınlaştırma:</span>
          <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 20}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{zoom}px</span>
          <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 80}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={scrollLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={scrollRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
          <div key={category} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-sm', colors.bg)} />
            <span className="text-xs text-muted-foreground">{category}</span>
          </div>
        ))}
      </div>

      {/* Gantt Container */}
      <div className="border rounded-sm overflow-hidden">
        <div className="flex">
          {/* Part Names Column */}
          <div className="w-48 flex-shrink-0 bg-secondary/30 border-r">
            <div className="h-14 border-b bg-secondary flex items-center px-3">
              <span className="font-medium text-sm">Parça</span>
            </div>
            {Object.entries(tasksByPart).map(([partId, partData]) => (
              <div 
                key={partId} 
                className="border-b px-3 py-2 bg-white hover:bg-muted/30 transition-colors"
                style={{ height: `${partData.tasks.length * 32 + 16}px` }}
              >
                <p className="font-medium text-sm truncate">{partData.part_name}</p>
                <p className="text-xs text-muted-foreground font-mono">{partData.part_code}</p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-x-auto" ref={containerRef}>
            <div style={{ width: `${totalDays * zoom}px`, minWidth: '100%' }}>
              {/* Date Headers */}
              <div className="h-14 border-b bg-secondary flex">
                {dateHeaders.map((header, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      'flex-shrink-0 border-r flex flex-col items-center justify-center',
                      header.isWeekend && 'bg-muted/50',
                      header.isToday && 'bg-orange-100'
                    )}
                    style={{ width: `${zoom}px` }}
                  >
                    <span className="text-[10px] text-muted-foreground">{header.month}</span>
                    <span className={cn('text-sm font-medium', header.isToday && 'text-orange-600')}>
                      {header.day}
                    </span>
                  </div>
                ))}
              </div>

              {/* Task Rows */}
              <TooltipProvider>
                {Object.entries(tasksByPart).map(([partId, partData]) => (
                  <div 
                    key={partId} 
                    className="relative border-b"
                    style={{ height: `${partData.tasks.length * 32 + 16}px` }}
                  >
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {dateHeaders.map((header, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            'flex-shrink-0 border-r h-full',
                            header.isWeekend && 'bg-muted/30',
                            header.isToday && 'bg-orange-50'
                          )}
                          style={{ width: `${zoom}px` }}
                        />
                      ))}
                    </div>

                    {/* Tasks */}
                    {partData.tasks.map((task, taskIdx) => {
                      const pos = getTaskPosition(task);
                      const colors = CATEGORY_COLORS[task.category] || CATEGORY_COLORS['Hazır Malzeme'];
                      
                      return (
                        <Tooltip key={task.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute rounded-sm cursor-pointer transition-all shadow-sm hover:shadow-md',
                                colors.bg,
                                'text-white text-xs font-medium flex items-center px-2 overflow-hidden',
                                hoveredTask === task.id && 'ring-2 ring-offset-1 ring-primary'
                              )}
                              style={{
                                left: `${pos.left + 2}px`,
                                top: `${taskIdx * 32 + 8}px`,
                                width: `${pos.width}px`,
                                height: '24px'
                              }}
                              onClick={() => onTaskClick && onTaskClick(task)}
                              onMouseEnter={() => setHoveredTask(task.id)}
                              onMouseLeave={() => setHoveredTask(null)}
                              data-testid={`gantt-task-${task.id}`}
                            >
                              <span className="truncate">
                                {task.method_code} - {task.method_name}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">{task.method_name}</p>
                              <p className="text-xs text-muted-foreground">Kod: {task.method_code}</p>
                              <p className="text-xs">Süre: {task.duration_days} gün</p>
                              <p className="text-xs">
                                {new Date(task.start).toLocaleDateString('tr-TR')} - {new Date(task.end).toLocaleDateString('tr-TR')}
                              </p>
                              <Badge variant="outline" className="text-[10px]">{task.category}</Badge>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Project Timeline Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Başlangıç: {new Date(project.start_date).toLocaleDateString('tr-TR')}</span>
        <span>Toplam {totalDays} gün</span>
        <span>Bitiş: {new Date(project.end_date).toLocaleDateString('tr-TR')}</span>
      </div>
    </div>
  );
}

export default GanttChart;

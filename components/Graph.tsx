
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphFunction, Viewport, Point } from '../types';
import { evaluateExpression } from '../utils/mathEvaluator';

interface GraphProps {
  functions: GraphFunction[];
  viewport: Viewport;
  onHover: (point: Point | null) => void;
  onViewportChange: (newViewport: Viewport) => void;
}

const Graph: React.FC<GraphProps> = ({ functions, viewport, onHover }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const radX = (viewport.rotateX * Math.PI) / 180;
    const radY = (viewport.rotateY * Math.PI) / 180;
    const centerX = width / 2;
    const centerY = height / 2;

    // Função de projeção 3D simplificada
    const project = (x: number, y: number, z: number): [number, number, number] => {
      // Rotação Y
      let x1 = x * Math.cos(radY) + z * Math.sin(radY);
      let z1 = -x * Math.sin(radY) + z * Math.cos(radY);

      // Rotação X
      let y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
      let z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

      const factor = viewport.scale;
      const perspective = viewport.is3D ? 1000 / (1000 + z2 * factor) : 1;
      
      const sx = centerX + (x1 - viewport.centerX) * factor * perspective;
      const sy = centerY - (y2 - viewport.centerY) * factor * perspective;
      
      return [sx, sy, z2];
    };

    const gMain = svg.append('g');

    // Renderizar Grade
    const gridSize = 15;
    const stepGrid = 1;

    if (viewport.is3D) {
      // Desenhar grade no plano Z=0
      for (let i = -gridSize; i <= gridSize; i += stepGrid) {
        const p1 = project(i, -gridSize, 0);
        const p2 = project(i, gridSize, 0);
        const p3 = project(-gridSize, i, 0);
        const p4 = project(gridSize, i, 0);

        gMain.append('line').attr('x1', p1[0]).attr('y1', p1[1]).attr('x2', p2[0]).attr('y2', p2[1]).attr('stroke', '#222').attr('stroke-width', 1);
        gMain.append('line').attr('x1', p3[0]).attr('y1', p3[1]).attr('x2', p4[0]).attr('y2', p4[1]).attr('stroke', '#222').attr('stroke-width', 1);
      }
      
      // Eixos principais 3D
      const xAxis = [project(-gridSize, 0, 0), project(gridSize, 0, 0)];
      const yAxis = [project(0, -gridSize, 0), project(0, gridSize, 0)];
      
      gMain.append('line').attr('x1', xAxis[0][0]).attr('y1', xAxis[0][1]).attr('x2', xAxis[1][0]).attr('y2', xAxis[1][1]).attr('stroke', 'rgba(255,255,255,0.1)').attr('stroke-width', 2);
      gMain.append('line').attr('x1', yAxis[0][0]).attr('y1', yAxis[0][1]).attr('x2', yAxis[1][0]).attr('y2', yAxis[1][1]).attr('stroke', 'rgba(255,255,255,0.1)').attr('stroke-width', 2);
    } else {
      // Grade 2D Padrão
      const xScale = d3.scaleLinear().domain([viewport.centerX - (width / 2) / viewport.scale, viewport.centerX + (width / 2) / viewport.scale]).range([0, width]);
      const yScale = d3.scaleLinear().domain([viewport.centerY - (height / 2) / viewport.scale, viewport.centerY + (height / 2) / viewport.scale]).range([height, 0]);
      
      const xTicks = xScale.ticks(width / 80);
      const yTicks = yScale.ticks(height / 80);

      gMain.selectAll('.v-grid').data(xTicks).enter().append('line').attr('x1', d => xScale(d)).attr('x2', d => xScale(d)).attr('y1', 0).attr('y2', height).attr('stroke', '#1a1a1a');
      gMain.selectAll('.h-grid').data(yTicks).enter().append('line').attr('y1', d => yScale(d)).attr('y2', d => yScale(d)).attr('x1', 0).attr('x2', width).attr('stroke', '#1a1a1a');
      
      gMain.append('line').attr('x1', xScale(0)).attr('x2', xScale(0)).attr('y1', 0).attr('y2', height).attr('stroke', 'rgba(255,255,255,0.2)').attr('stroke-width', 2);
      gMain.append('line').attr('y1', yScale(0)).attr('y2', yScale(0)).attr('x1', 0).attr('x2', width).attr('stroke', 'rgba(255,255,255,0.2)').attr('stroke-width', 2);
    }

    // Renderizar Funções
    functions.forEach(fn => {
      if (!fn.visible) return;

      const points: [number, number][] = [];
      const range = viewport.is3D ? gridSize : (width / viewport.scale / 2) + 2;
      const samples = 300;
      const step = (range * 2) / samples;

      for (let x = viewport.centerX - range; x <= viewport.centerX + range; x += step) {
        const y = evaluateExpression(fn.expression, x);
        if (y !== null && isFinite(y)) {
          const [sx, sy] = project(x, y, 0);
          points.push([sx, sy]);
        } else if (points.length > 0) {
          drawPath(points, fn.color);
          points.length = 0;
        }
      }
      drawPath(points, fn.color);
    });

    function drawPath(data: [number, number][], color: string) {
      if (data.length < 2) return;
      const line = d3.line<[number, number]>().x(d => d[0]).y(d => d[1]).curve(d3.curveMonotoneX);
      gMain.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', viewport.is3D ? 2 : 3)
        .attr('d', line)
        .attr('filter', viewport.is3D ? 'none' : `drop-shadow(0 0 8px ${color}66)`);
    }

    if (!viewport.is3D) {
      svg.on('mousemove', (event) => {
        const [mx, my] = d3.pointer(event);
        const xScale = d3.scaleLinear().domain([viewport.centerX - (width / 2) / viewport.scale, viewport.centerX + (width / 2) / viewport.scale]).range([0, width]);
        const yScale = d3.scaleLinear().domain([viewport.centerY - (height / 2) / viewport.scale, viewport.centerY + (height / 2) / viewport.scale]).range([height, 0]);
        onHover({ x: xScale.invert(mx), y: yScale.invert(my) });
      });
      svg.on('mouseleave', () => onHover(null));
    }

  }, [functions, viewport]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-charcoal overflow-hidden cursor-crosshair">
      <svg ref={svgRef} className="absolute inset-0" />
    </div>
  );
};

export default Graph;

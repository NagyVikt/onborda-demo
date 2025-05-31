"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock, Unlock, MapPin, Users, Circle, Square as SquareIcon, Maximize2, Minus, Plus, Coffee, Armchair,
  DoorOpen, PersonStanding, ChefHat, GlassWater, Move, Edit3, Trash2, Save, Eye, MousePointer, Columns, AlertTriangle, Settings, CheckSquare, Eraser, LayoutDashboard, PackagePlus, Settings2, UtensilsCrossed, MinusCircle, PlusCircle, Scaling, Copy, Edit, Check, XCircle, ThumbsUp
} from 'lucide-react'; 

// --- Configuration ---
const INITIAL_GRID_COLS = 50;
const INITIAL_GRID_ROWS = 30;
const CELL_SIZE_PX = 25;

const LOCAL_STORAGE_KEY = 'restaurantLayout_v11'; // Incremented for new features

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Icon Mapping ---
const iconMap: { [key: string]: React.ElementType } = {
  DoorOpen, PersonStanding, ChefHat, GlassWater, Coffee, Armchair, UtensilsCrossed
};

// Custom cursor SVG (minus in a circle)
const removeCursorSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="black" stroke-width="1.5" fill="rgba(255,255,255,0.7)"/><line x1="7" y1="12" x2="17" y2="12" stroke="black" stroke-width="1.5"/></svg>`;
const removeCursorDataURL = `data:image/svg+xml;utf8,${encodeURIComponent(removeCursorSVG)}`;

// --- Interfaces ---
interface ChairProps {
  x: number; y: number; angle?: number; size: number; fillColor: string; strokeColor: string;
  isRound?: boolean; 
  onClick?: () => void;
  isBuilderMode?: boolean;
  isChairEditingMode?: boolean; 
  chairIndex?: number; 
}

const ChairSvg: React.FC<ChairProps> = ({ x, y, angle = 0, size, fillColor, strokeColor, isRound, onClick, isBuilderMode, isChairEditingMode, chairIndex }) => {
  const chairWidth = size * (isRound ? 0.8 : 0.7); 
  const chairHeight = size * (isRound ? 0.8 : 0.7);
  const backHeight = chairHeight * 0.35;
  const seatRadius = isRound ? chairWidth / 2 : CELL_SIZE_PX * 0.05;

  let chairGroupClass = "";
  if (isBuilderMode && onClick) {
    chairGroupClass = "cursor-pointer"; 
    if (isChairEditingMode) {
      chairGroupClass += " hover:opacity-70 transition-opacity duration-150";
    }
  }
  
  const editingHighlightStroke = isChairEditingMode ? 'rgba(74, 222, 128, 0.8)' : 'none';
  const editingHighlightStrokeWidth = isChairEditingMode ? 2 : 0;


  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`} onClick={onClick} className={chairGroupClass} data-chair-index={chairIndex}>
      <rect x={-chairWidth / 2} y={-chairHeight / 2} width={chairWidth} height={chairHeight} fill={fillColor} stroke={strokeColor} strokeWidth="0.5" rx={seatRadius} ry={seatRadius}/>
      <rect x={-chairWidth / 2} y={-chairHeight / 2 - backHeight} width={chairWidth} height={backHeight} fill={fillColor} stroke={strokeColor} strokeWidth="0.5" rx={CELL_SIZE_PX * 0.05} />
      {isRound && (<circle cx="0" cy="0" r={chairWidth * 0.35} fill="rgba(0,0,0,0.05)" />)}
      {isChairEditingMode && (
        <rect 
          x={-chairWidth / 2 - 2} 
          y={-chairHeight / 2 - backHeight - 2} 
          width={chairWidth + 4} 
          height={chairHeight + backHeight + 4} 
          fill="none" 
          stroke={editingHighlightStroke} 
          strokeWidth={editingHighlightStrokeWidth} 
          rx={seatRadius + 2} 
          ry={seatRadius + 2}
          strokeDasharray="3 2"
        />
      )}
    </g>
  );
};

interface TableProps {
  id: string; shape: 'circle' | 'square' | 'rectangle';
  gridX: number; gridY: number; gridWidth: number; gridHeight: number;
  seats: number; 
  chairVisibility?: boolean[]; 
  isBooked: boolean; isSelected?: boolean;
  onClick?: (id: string, type: 'table') => void; 
  onChairClick?: (tableId: string, chairIndex: number) => void;
  label?: string;
  tableStyle?: 'wood' | 'modern' | 'classic'; 
}

const TableSvg: React.FC<TableProps & { isBuilderMode: boolean; currentTool?: string; selectedItemId?: string | null; isEditingChairs?: boolean; }> = ({
  shape, gridWidth, gridHeight, seats, chairVisibility, isBooked, isSelected, onClick, onChairClick, id, label, isBuilderMode, currentTool, selectedItemId, tableStyle = 'wood', isEditingChairs
}) => {
  const tablePixelWidth = gridWidth * CELL_SIZE_PX;
  const tablePixelHeight = gridHeight * CELL_SIZE_PX;
  const minTableDimension = Math.min(tablePixelWidth, tablePixelHeight);
  const chairPixelSize = minTableDimension * 0.22; 
  
  const availableStroke = 'rgb(107 114 128)';
  const baseFill = tableStyle === 'wood' ? "url(#woodPattern)" : 'rgb(209 213 219)'; 
  const selectedBookingFill = 'rgb(147 197 253)'; 
  const selectedBuilderStroke = 'rgb(59 130 246)'; 
  
  const bookedOpacity = 0.45; const bookedFilter = "url(#lockedTableShadowAdvanced)";
  const chairFillColor = isSelected && !isBuilderMode ? 'rgb(219 234 254)' : 'rgb(240 240 240)'; 
  const chairStrokeColor = isSelected && !isBuilderMode ? 'rgb(96 165 250)' : 'rgb(140 140 140)';
  
  const currentStrokeColor = isSelected && !isBuilderMode ? selectedBookingFill : availableStroke;
  const currentFillColor = isSelected && !isBuilderMode ? selectedBookingFill : baseFill;
  const currentLegFill = isSelected && !isBuilderMode ? 'rgb(96 165 250)' : 'rgb(156 163 175)';
  const currentTextColor = isSelected && !isBuilderMode ? 'rgb(30 64 175)' : 'rgb(31 41 55)';
  
  const handleClick = (e: React.MouseEvent) => { 
      const target = e.target as SVGElement;
      if (isBuilderMode && (target.closest('[data-chair-index]') && isEditingChairs)) { 
          return;
      }
      if (onClick && !isEditingChairs) onClick(id, 'table'); 
  };
  const iconDisplaySize = minTableDimension * 0.3;
  
  let groupClassName = `${isBuilderMode && currentTool === 'select' && !isEditingChairs ? 'cursor-move' : (isEditingChairs ? '' : 'cursor-pointer')}`; 
  if (isBooked && !isBuilderMode) groupClassName += ' cursor-not-allowed';
  else if (!isEditingChairs) groupClassName += ' hover:brightness-105 filter hover:drop-shadow-md';
  if (isBuilderMode && selectedItemId === id && !isEditingChairs) groupClassName += ' builder-selected-item';


  const chairs: JSX.Element[] = []; 
  const chairOffsetMultiplier = 0.65; 
  // Ensure actualChairVisibility is always an array of length `seats`
  const actualChairVisibility = (chairVisibility && chairVisibility.length === seats) 
                                ? chairVisibility 
                                : Array(seats).fill(true);
  const visibleChairCount = actualChairVisibility.filter(Boolean).length;

  if (shape === 'circle') {
    const radius = tablePixelWidth / 2; const chairOffset = radius * chairOffsetMultiplier + chairPixelSize * 0.4;
    for (let i = 0; i < seats; i++) { // Iterate up to max potential seats
      if (actualChairVisibility[i] || isEditingChairs) { 
        chairs.push(
            <g key={`c-${id}-${i}`} style={{ opacity: isEditingChairs && !actualChairVisibility[i] ? 0.3 : 1 }}>
              <ChairSvg 
                  chairIndex={i}
                  x={Math.cos((i / seats) * 2 * Math.PI) * chairOffset} 
                  y={Math.sin((i / seats) * 2 * Math.PI) * chairOffset} 
                  angle={((i / seats) * 360) + 90} 
                  size={chairPixelSize} 
                  fillColor={chairFillColor} 
                  strokeColor={chairStrokeColor} 
                  isRound={true}
                  onClick={isBuilderMode && onChairClick && isEditingChairs ? () => onChairClick(id, i) : undefined}
                  isBuilderMode={isBuilderMode}
                  isChairEditingMode={isEditingChairs}
              />
            </g>);
      }
    }
  } else { 
    const halfWidth = tablePixelWidth / 2; const halfHeight = tablePixelHeight / 2;
    const chairSpacing = chairPixelSize * 1.2; 
    let placedChairSlots = 0;

    const placeChairsFn = (count: number, xOffsetFn: (j:number)=>number, yOffsetFn: (j:number)=>number, angle: number) => {
        for (let j = 0; j < count; j++) {
            if (placedChairSlots < seats) { // Only consider slots up to max seats
                if (actualChairVisibility[placedChairSlots] || isEditingChairs) {
                    chairs.push(
                        <g key={`c-${id}-${placedChairSlots}`} style={{ opacity: isEditingChairs && !actualChairVisibility[placedChairSlots] ? 0.3 : 1 }}>
                          <ChairSvg 
                              chairIndex={placedChairSlots}
                              x={xOffsetFn(j)} 
                              y={yOffsetFn(j)} 
                              angle={angle} 
                              size={chairPixelSize} 
                              fillColor={chairFillColor} 
                              strokeColor={chairStrokeColor} 
                              isRound={true}
                              onClick={isBuilderMode && onChairClick && isEditingChairs ? () => onChairClick(id, placedChairSlots) : undefined}
                              isBuilderMode={isBuilderMode}
                              isChairEditingMode={isEditingChairs}
                          />
                        </g>);
                }
                placedChairSlots++;
            }
        }
    }
    const seatsHorizontal = Math.max(0,Math.floor(tablePixelWidth / chairSpacing));
    const seatsVertical = Math.max(0,Math.floor(tablePixelHeight / chairSpacing));

    placeChairsFn(seatsHorizontal, (j) => (j - (seatsHorizontal - 1) / 2) * chairSpacing, () => -halfHeight - chairPixelSize * 0.35, 0);
    if (placedChairSlots < seats) placeChairsFn(seatsHorizontal, (j) => (j - (seatsHorizontal - 1) / 2) * chairSpacing, () => halfHeight + chairPixelSize * 0.35, 180);
    if (placedChairSlots < seats) placeChairsFn(seatsVertical, () => -halfWidth - chairPixelSize * 0.35, (j) => (j - (seatsVertical - 1) / 2) * chairSpacing, 270);
    if (placedChairSlots < seats) placeChairsFn(seatsVertical, () => halfWidth + chairPixelSize * 0.35, (j) => (j - (seatsVertical - 1) / 2) * chairSpacing, 90);
  }

  const tableStrokeWidth = isBuilderMode && selectedItemId === id && !isEditingChairs ? 2 : 1.5;
  const tableStrokeColor = isBuilderMode && selectedItemId === id && !isEditingChairs ? selectedBuilderStroke : currentStrokeColor;

  return (
    <g onClick={handleClick} className={groupClassName} data-id={id} data-type="table" style={{ opacity: isBooked && !isBuilderMode ? bookedOpacity : 1 }} filter={isBooked && !isBuilderMode ? bookedFilter : undefined}>
      <defs><filter id="lockedTableShadowAdvanced" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="1.5" dy="1.5" stdDeviation="1.5" floodColor="rgba(0,0,0,0.3)" /></filter></defs>
      {chairs}
      {shape === 'circle' && (<><circle cx={0} cy={tablePixelHeight * 0.12 * 0.6} r={tablePixelWidth / 2 * 0.95} fill={currentLegFill} opacity="0.6" /><circle cx={0} cy={0} r={tablePixelWidth / 2} fill={currentFillColor} stroke={tableStrokeColor} strokeWidth={tableStrokeWidth} /></>)}
      {(shape === 'square' || shape === 'rectangle') && (<><rect x={-tablePixelWidth / 2 + tablePixelHeight * 0.12 * 0.1} y={-tablePixelHeight / 2 + tablePixelHeight * 0.12 * 0.1} width={tablePixelWidth - tablePixelHeight * 0.12 * 0.2} height={tablePixelHeight - tablePixelHeight * 0.12 * 0.2} fill={currentLegFill} rx={minTableDimension * 0.06} opacity="0.6" /><rect x={-tablePixelWidth / 2} y={-tablePixelHeight / 2} width={tablePixelWidth} height={tablePixelHeight} fill={currentFillColor} stroke={tableStrokeColor} strokeWidth={tableStrokeWidth} rx={minTableDimension * 0.08} /></>)}
      <g className="pointer-events-none select-none">
        {label && (<text x={0} y={-minTableDimension * 0.18} textAnchor="middle" dominantBaseline="middle" fontSize={minTableDimension * 0.20} fill={isBooked && !isBuilderMode ? 'rgb(100,100,100)' : currentTextColor} fontWeight="600">{label}</text>)}
        <text x={0} y={label ? minTableDimension * 0.16 : 0} textAnchor="middle" dominantBaseline="middle" fontSize={minTableDimension * (label ? 0.17 : 0.23)} fill={isBooked && !isBuilderMode ? 'rgb(120,120,120)' : currentTextColor} fontWeight="500"><Users size={minTableDimension * 0.14} style={{ display: "inline", verticalAlign: "-0.1em", marginRight: "3px" }} />{visibleChairCount}</text>
      </g>
      {isBooked && !isBuilderMode && (<Lock x={-iconDisplaySize / 2} y={-iconDisplaySize / 2} size={iconDisplaySize} color={'rgb(55 65 81)'} className="pointer-events-none" strokeWidth="1.5" />)}
      {!isBooked && isSelected && !isBuilderMode && (<Unlock x={-iconDisplaySize / 2} y={-iconDisplaySize / 2} size={iconDisplaySize} color="rgb(22 163 74)" className="pointer-events-none" strokeWidth="1.5" />)}
    </g>
  );
};

interface RestaurantElement {
  id: string; type: 'wall' | 'bar' | 'kitchen' | 'door' | 'window' | 'decoration' | 'wc';
  gridX: number; gridY: number; gridWidth: number; gridHeight: number;
  label?: string; color?: string; strokeColor?: string; labelColor?: string;
  iconName?: string; iconColor?: string; rx?: number; depth?: number;
  texture?: 'wood' | 'tile' | 'metal'; 
}

const createInitialElements = (cols: number, rows: number): RestaurantElement[] => [
  { id: 'wall-n', type: 'wall', gridX: 0, gridY: 0, gridWidth: cols, gridHeight: 1, color: 'rgb(180 180 180)', strokeColor: 'rgb(150 150 150)' },
  { id: 'wall-s', type: 'wall', gridX: 0, gridY: rows - 1, gridWidth: cols, gridHeight: 1, color: 'rgb(180 180 180)', strokeColor: 'rgb(150 150 150)' },
  { id: 'wall-w', type: 'wall', gridX: 0, gridY: 0, gridWidth: 1, gridHeight: rows, color: 'rgb(180 180 180)', strokeColor: 'rgb(150 150 150)' },
  { id: 'wall-e', type: 'wall', gridX: cols - 1, gridY: 0, gridWidth: 1, gridHeight: rows, color: 'rgb(180 180 180)', strokeColor: 'rgb(150 150 150)' },
  { 
    id: 'door-main', type: 'door', 
    gridX: Math.floor(cols * 0.45), 
    gridY: rows - 2, 
    gridWidth: Math.max(3, Math.floor(cols * 0.12)), 
    gridHeight: 2, 
    label: 'ENTRANCE', 
    color: 'rgb(139, 92, 60)', strokeColor: 'rgb(101, 67, 33)', 
    labelColor: 'rgb(255, 240, 150)', 
    rx: 0.05, depth: 0.1 * CELL_SIZE_PX, 
    iconName: 'DoorOpen', iconColor: 'rgb(255, 240, 150)'
  },
  { id: 'bar', type: 'bar', gridX: Math.floor(cols * 0.65), gridY: Math.floor(rows * 0.4), gridWidth: Math.max(4,Math.floor(cols * 0.25)), gridHeight: Math.max(2,Math.floor(rows * 0.12)), label: 'Main Bar', color: 'rgb(104 50 30)', strokeColor: 'rgb(77 42 10)', labelColor: 'rgb(254 252 232)', rx: 0.1, depth: 0.8 * CELL_SIZE_PX, iconName: 'Coffee', iconColor: 'rgb(253 224 71)', texture: 'wood'},
  { id: 'kitchen', type: 'kitchen', gridX: Math.floor(cols * 0.03), gridY: Math.floor(rows * 0.03), gridWidth: Math.max(5,Math.floor(cols * 0.30)), gridHeight: Math.max(4,Math.floor(rows * 0.25)), label: 'Kitchen Area', color: 'rgb(225 230 235)', strokeColor: 'rgb(170 170 170)', labelColor: 'rgb(55 65 81)', rx: 0.05, depth: 0.2 * CELL_SIZE_PX, iconName: 'ChefHat', iconColor: 'rgb(55 65 81)', texture: 'tile'},
];

const initialTablesData: Omit<TableProps, 'chairVisibility' | 'onClick' | 'onChairClick'>[] = [ 
  { id: generateId(), shape: 'circle', gridX: 15, gridY: 10, gridWidth: 2, gridHeight: 2, seats: 4, isBooked: false, label: "C1", tableStyle: 'wood' },
  { id: generateId(), shape: 'square', gridX: 25, gridY: 5,  gridWidth: 2, gridHeight: 2, seats: 4, isBooked: true,  label: "S1", tableStyle: 'modern' },
  { id: generateId(), shape: 'rectangle', gridX: 10, gridY: 18, gridWidth: 3, gridHeight: 2, seats: 6, isBooked: false, label: "R1", tableStyle: 'classic' },
];

// --- Sub-Components ---

const BarVisuals: React.FC<{el: RestaurantElement, gridColsMain: number, gridRowsMain: number, allElements: RestaurantElement[]}> = ({ el, gridColsMain, gridRowsMain, allElements }) => {
    const elPixelWidth = el.gridWidth * CELL_SIZE_PX;
    const elPixelHeight = el.gridHeight * CELL_SIZE_PX;
    const bottleWidth = CELL_SIZE_PX * 0.18; 
    const bottleHeight = CELL_SIZE_PX * 0.6; 
    const glassRadius = CELL_SIZE_PX * 0.14;
    const itemsPerRow = Math.max(1, Math.floor(elPixelWidth / (bottleWidth * 1.5))); 
    const itemSpacing = elPixelWidth / (itemsPerRow + 1);

    const drinkColor = "rgba(70, 130, 180, 0.7)"; 
    const bottleFill = "rgba(220, 220, 220, 0.4)"; 

    const items = [];
    const itemTypes = ['bottle', 'glass', 'tallBottle']; 
    for (let i = 0; i < itemsPerRow; i++) {
        const xPos = itemSpacing * (i + 1);
        const itemType = itemTypes[i % itemTypes.length]; 

        if (itemType === 'bottle' || itemType === 'tallBottle') { 
            const currentBottleHeight = itemType === 'tallBottle' ? bottleHeight * 1.2 : bottleHeight;
            items.push(
              <g key={`baritem-${el.id}-${i}`} transform={`translate(${xPos - bottleWidth / 2}, ${elPixelHeight * 0.12 - currentBottleHeight})`}>
                <rect width={bottleWidth} height={currentBottleHeight} fill={bottleFill} rx={bottleWidth * 0.2} stroke="rgba(180,180,180,0.5)" strokeWidth="0.5"/>
                <rect width={bottleWidth*0.8} height={currentBottleHeight*0.65} x={bottleWidth*0.1} y={currentBottleHeight*0.3} fill={drinkColor} rx={bottleWidth * 0.15}/>
                <rect width={bottleWidth*0.4} height={currentBottleHeight*0.2} x={bottleWidth*0.3} y={-currentBottleHeight*0.1} fill={bottleFill} stroke="rgba(180,180,180,0.5)" strokeWidth="0.5" rx={bottleWidth*0.05}/>
                <circle cx={bottleWidth*0.5} cy={-currentBottleHeight*0.1} r={bottleWidth*0.22} fill="rgba(50,50,50,0.7)"/>
              </g>
            );
        } else { 
            items.push(
              <g key={`baritem-${el.id}-${i}`} transform={`translate(${xPos}, ${elPixelHeight * 0.12 - glassRadius * 1.6})`}>
                <path d={`M ${-glassRadius*0.7} 0 Q 0 ${glassRadius*0.15} ${glassRadius*0.7} 0 L ${glassRadius*0.5} ${glassRadius*1.3} Q 0 ${glassRadius*1.6} ${-glassRadius*0.5} ${glassRadius*1.3} Z`} fill={drinkColor} stroke="rgba(150,200,255,0.5)" strokeWidth="0.5" />
                <ellipse cx="0" cy={glassRadius*1.35} rx={glassRadius*0.55} ry={glassRadius*0.15} fill="none" stroke="rgba(150,200,255,0.5)" strokeWidth="0.5" />
                <path d={`M ${-glassRadius*0.7} 0 Q 0 ${glassRadius*0.1} ${glassRadius*0.7} 0`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.7" />
              </g>
            );
        }
    }
    const stools = []; 
    const stoolRadius = CELL_SIZE_PX * 0.35; const stoolOffsetY = elPixelHeight + stoolRadius * 0.7;
    const numStools = Math.floor(el.gridWidth / 1.5);
    
    let spaceBehindClear = true;
    if (el.gridY + el.gridHeight >= gridRowsMain -1) { 
        spaceBehindClear = false;
    } else {
        for(let i = el.gridX; i < el.gridX + el.gridWidth; i++) {
            if(allElements.some(e => e.id !== el.id && e.gridX <= i && e.gridX + e.gridWidth > i && e.gridY === el.gridY + el.gridHeight)) {
                spaceBehindClear = false; break;
            }
        }
    }

    if (spaceBehindClear) { for (let i = 0; i < numStools; i++) { const stoolX = (elPixelWidth / (numStools +1)) * (i+1) ; stools.push(<circle key={`stool-${el.id}-${i}`} cx={stoolX} cy={stoolOffsetY} r={stoolRadius} fill="url(#woodPatternDark)" stroke="rgb(80,40,10, 0.9)" strokeWidth="1" filter="url(#elementDepthEffect)" />);}}
    
    return ( <g> {stools} 
            <rect x={-CELL_SIZE_PX*0.05} y={-CELL_SIZE_PX*0.05} width={elPixelWidth + CELL_SIZE_PX*0.1} height={elPixelHeight * 0.2 + CELL_SIZE_PX*0.1} fill="rgba(0,0,0,0.1)" rx={(el.rx || 0) * Math.min(elPixelWidth, elPixelHeight) + 2} />
            <rect x={0} y={0} width={elPixelWidth} height={elPixelHeight * 0.2} fill={el.texture === 'wood' ? "url(#woodPatternDark)" : "rgb(80,40,20)"} rx={(el.rx || 0) * Math.min(elPixelWidth, elPixelHeight)} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5"/> 
            {items}
            <rect x={0} y={elPixelHeight * 0.15} width={elPixelWidth} height={elPixelHeight * 0.85} fill={el.color || 'rgb(104,50,30)'} stroke={el.strokeColor || 'rgb(77,42,10)'} strokeWidth="1" rx={(el.rx || 0) * Math.min(elPixelWidth, elPixelHeight)}/>
            <path d={`M0,${elPixelHeight*0.15} L${CELL_SIZE_PX*0.1},${elPixelHeight*0.15 - CELL_SIZE_PX*0.1} L${elPixelWidth - CELL_SIZE_PX*0.1},${elPixelHeight*0.15 - CELL_SIZE_PX*0.1} L${elPixelWidth},${elPixelHeight*0.15} Z`} fill="rgba(255,255,255,0.1)" /> 
            <path d={`M0,${elPixelHeight} L${CELL_SIZE_PX*0.1},${elPixelHeight + CELL_SIZE_PX*0.1} L${elPixelWidth - CELL_SIZE_PX*0.1},${elPixelHeight + CELL_SIZE_PX*0.1} L${elPixelWidth},${elPixelHeight} Z`} fill="rgba(0,0,0,0.1)" /> 
            {el.iconName && iconMap[el.iconName] && React.createElement(iconMap[el.iconName] as React.ElementType, { x: elPixelWidth * 0.05, y: elPixelHeight * 0.3, size: Math.min(elPixelWidth, elPixelHeight) * 0.35, color: el.iconColor || el.labelColor || "white", className: "pointer-events-none", strokeWidth: 1.5})}
            {el.label && (<text x={elPixelWidth / 2} y={elPixelHeight * 0.7} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(elPixelWidth, elPixelHeight) * 0.12} fill={el.labelColor || "white"} className="pointer-events-none font-semibold" filter="url(#textBg)" >{el.label}</text>)}
        </g>
    );
};

const KitchenVisuals: React.FC<{el: RestaurantElement}> = ({ el }) => { 
    const elPixelWidth = el.gridWidth * CELL_SIZE_PX;
    const elPixelHeight = el.gridHeight * CELL_SIZE_PX;
    const counterDepth = CELL_SIZE_PX * 0.8;
    const applianceSize = CELL_SIZE_PX * 0.7;
    return (
        <g>
            <rect x={0} y={0} width={elPixelWidth} height={counterDepth} fill="url(#metalPattern)" stroke="rgb(120,120,120)" strokeWidth="0.5" />
            <rect x={0} y={counterDepth} width={counterDepth} height={elPixelHeight - counterDepth} fill="url(#metalPattern)" stroke="rgb(120,120,120)" strokeWidth="0.5" />
            <rect x={counterDepth * 0.2} y={counterDepth * 0.15} width={counterDepth * 1.2} height={counterDepth * 0.6} fill="rgb(200,205,210)" rx="2" />
            <circle cx={counterDepth * 0.2 + counterDepth*1.2 - CELL_SIZE_PX*0.1} cy={counterDepth*0.45} r={CELL_SIZE_PX*0.05} fill="rgb(100,100,100)" />
            <rect x={elPixelWidth - counterDepth - applianceSize * 1.5} y={counterDepth * 0.5} width={applianceSize*1.5} height={applianceSize*1.2} fill="rgb(100,100,100)" rx="1" />
            <circle cx={elPixelWidth - counterDepth - applianceSize*1.5 + applianceSize*0.3} cy={counterDepth * 0.5 + applianceSize*0.3} r={applianceSize*0.15} fill="rgb(50,50,50)" />
            <circle cx={elPixelWidth - counterDepth - applianceSize*1.5 + applianceSize*0.7} cy={counterDepth * 0.5 + applianceSize*0.3} r={applianceSize*0.15} fill="rgb(50,50,50)" />
            <circle cx={elPixelWidth - counterDepth - applianceSize*1.5 + applianceSize*0.3} cy={counterDepth * 0.5 + applianceSize*0.7} r={applianceSize*0.15} fill="rgb(50,50,50)" />
            <circle cx={elPixelWidth - counterDepth - applianceSize*1.5 + applianceSize*0.7} cy={counterDepth * 0.5 + applianceSize*0.7} r={applianceSize*0.15} fill="rgb(50,50,50)" />
            {el.gridWidth > 3 && el.gridHeight > 3 && (<rect x={elPixelWidth * 0.3} y={elPixelHeight * 0.4} width={elPixelWidth * 0.4} height={elPixelHeight * 0.3} fill="url(#metalPatternLight)" rx="2" stroke="rgb(120,120,120)" strokeWidth="0.5"/>)}
            {el.iconName && iconMap[el.iconName] && React.createElement(iconMap[el.iconName] as React.ElementType, { x: elPixelWidth - CELL_SIZE_PX * 1.5, y: elPixelHeight - CELL_SIZE_PX * 1.5, size: CELL_SIZE_PX * 1.2, color: el.iconColor || el.labelColor || "white", className: "pointer-events-none", strokeWidth: 1.5 })}
            {el.label && (<text x={elPixelWidth / 2} y={elPixelHeight - CELL_SIZE_PX*0.5} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(elPixelWidth, elPixelHeight) * 0.08} fill={el.labelColor || "black"} className="pointer-events-none font-semibold" >{el.label}</text>)}
        </g>
    );
};

interface ToolbarGroupProps { title: string; children: React.ReactNode; }
const ToolbarGroup: React.FC<ToolbarGroupProps> = ({ title, children }) => ( 
  <div className="py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

interface ItemPropertiesPanelProps {
    selectedItem: TableProps | RestaurantElement | null;
    updateTableSeats: (tableId: string, newSeats: number) => void;
    updateTableSize: (tableId: string, newWidth: number, newHeight: number) => void;
    updateTableLabel: (tableId: string, newLabel: string) => void;
    duplicateTable: (tableId: string) => void;
    gridCols: number;
    gridRows: number;
    editingChairModeTableId: string | null;
    setEditingChairModeTableId: (id: string | null) => void;
}

const ItemPropertiesPanel: React.FC<ItemPropertiesPanelProps> = ({ 
    selectedItem, updateTableSeats, updateTableSize, updateTableLabel, duplicateTable, gridCols, gridRows,
    editingChairModeTableId, setEditingChairModeTableId
}) => {
    const [editableLabel, setEditableLabel] = useState('');
    const [isEditingLabelText, setIsEditingLabelText] = useState(false);

    useEffect(() => {
        if (selectedItem && (selectedItem as TableProps).shape !== undefined) {
            setEditableLabel((selectedItem as TableProps).label || '');
            setIsEditingLabelText(false); 
        }
         if (!selectedItem || (editingChairModeTableId && selectedItem.id !== editingChairModeTableId)) {
           if (editingChairModeTableId) setEditingChairModeTableId(null);
        }
    }, [selectedItem, editingChairModeTableId, setEditingChairModeTableId]);

    if (!selectedItem || (selectedItem as TableProps).shape === undefined) { 
        if (editingChairModeTableId) setEditingChairModeTableId(null); 
        return null; 
    }

    const table = selectedItem as TableProps;
    const isCurrentlyEditingChairs = editingChairModeTableId === table.id;

    const handleSeatsChange = (increment: number) => {
        const newSeats = Math.max(1, Math.min(table.seats + increment, 64)); 
        updateTableSeats(table.id, newSeats);
    };

    const handleSizeChange = (dimension: 'width' | 'height', increment: number) => {
        let newWidth = table.gridWidth;
        let newHeight = table.gridHeight;
        if (dimension === 'width') {
            newWidth = Math.max(1, Math.min(table.gridWidth + increment, gridCols - table.gridX));
        } else {
            newHeight = Math.max(1, Math.min(table.gridHeight + increment, gridRows - table.gridY));
        }
        updateTableSize(table.id, newWidth, newHeight);
    };

    const handleLabelSave = () => {
        updateTableLabel(table.id, editableLabel);
        setIsEditingLabelText(false);
    };

    const toggleChairEditMode = () => {
        setEditingChairModeTableId(isCurrentlyEditingChairs ? null : table.id);
    };
    
    return (
        <ToolbarGroup title={`${table.label || 'Table'} Properties`}>
            <div className="space-y-3 p-1 text-sm">
                {isCurrentlyEditingChairs ? (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md text-center">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Editing Chairs</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Click chairs on the canvas to add/remove.</p>
                        <button 
                            onClick={toggleChairEditMode} 
                            className="mt-2 w-full p-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium flex items-center justify-center"
                        >
                           <ThumbsUp size={14} className="mr-1.5"/> Done Editing Chairs
                        </button>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Label:</label>
                            {isEditingLabelText ? (
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="text" 
                                        value={editableLabel} 
                                        onChange={(e) => setEditableLabel(e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                        autoFocus
                                        onBlur={handleLabelSave}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLabelSave()}
                                    />
                                    <button onClick={handleLabelSave} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-md"><Check size={16}/></button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{table.label || '(No Label)'}</span>
                                    <button onClick={() => setIsEditingLabelText(true)} className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"><Edit size={14}/></button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Seats:</label>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleSeatsChange(-1)} className="p-1.5 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"><MinusCircle size={16}/></button>
                                <span className="font-medium w-8 text-center">{table.seats}</span>
                                <button onClick={() => handleSeatsChange(1)} className="p-1.5 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"><PlusCircle size={16}/></button>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Visible: {table.chairVisibility?.filter(Boolean).length || table.seats}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Size (Grid Units):</label>
                            <div className="flex items-center space-x-2 mb-1">
                                <span className="w-10">W:</span>
                                <button onClick={() => handleSizeChange('width', -1)} className="p-1.5 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"><Minus size={14}/></button>
                                <span className="font-medium w-6 text-center">{table.gridWidth}</span>
                                <button onClick={() => handleSizeChange('width', 1)} className="p-1.5 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"><Plus size={14}/></button>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="w-10">H:</span>
                                <button onClick={() => handleSizeChange('height', -1)} className="p-1.5 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"><Minus size={14}/></button>
                                <span className="font-medium w-6 text-center">{table.gridHeight}</span>
                                <button onClick={() => handleSizeChange('height', 1)} className="p-1.5 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"><Plus size={14}/></button>
                            </div>
                        </div>
                        <button 
                            onClick={toggleChairEditMode}
                            className="w-full mt-2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium flex items-center justify-center"
                        >
                           <Armchair size={16} className="mr-2"/> Edit Chairs
                        </button>
                        <button onClick={() => duplicateTable(table.id)} className="w-full mt-1 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm font-medium flex items-center justify-center">
                            <Copy size={16} className="mr-2"/> Duplicate Table
                        </button>
                    </>
                )}
            </div>
        </ToolbarGroup>
    );
};


interface SidebarProps {
  isBuilderMode: boolean; setIsBuilderMode: (value: boolean) => void;
  currentTool: string; setCurrentTool: (tool: 'select' | 'drawWall' | 'deleteItem') => void;
  addTable: (shape: 'circle' | 'square' | 'rectangle') => void; saveLayout: () => void;
  tempGridCols: string; setTempGridCols: (value: string) => void;
  tempGridRows: string; setTempGridRows: (value: string) => void;
  handleUpdateWorkspace: () => void; selectedTableDetails?: TableProps | null; handleBooking: () => void;
  selectedItemForProps: TableProps | RestaurantElement | null;
  updateTableSeats: (tableId: string, newSeats: number) => void;
  updateTableSize: (tableId: string, newWidth: number, newHeight: number) => void;
  updateTableLabel: (tableId: string, newLabel: string) => void;
  duplicateTable: (tableId: string) => void;
  gridCols: number; gridRows: number;
  editingChairModeTableId: string | null;
  setEditingChairModeTableId: (id: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isBuilderMode, setIsBuilderMode, currentTool, setCurrentTool, addTable, saveLayout,
  tempGridCols, setTempGridCols, tempGridRows, setTempGridRows, handleUpdateWorkspace,
  selectedTableDetails, handleBooking, selectedItemForProps, 
  updateTableSeats, updateTableSize, updateTableLabel, duplicateTable,
  gridCols, gridRows, editingChairModeTableId, setEditingChairModeTableId
}) => { 

  const handleSetCurrentTool = (tool: 'select' | 'drawWall' | 'deleteItem') => {
    setCurrentTool(tool);
    if (editingChairModeTableId) setEditingChairModeTableId(null); 
  };

  return (
    <div className="w-72 bg-white dark:bg-gray-800 p-4 space-y-0 shadow-lg overflow-y-auto flex flex-col h-full">
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Restaurant Editor</h2>
        <button onClick={() => { setIsBuilderMode(!isBuilderMode); if (isBuilderMode) setEditingChairModeTableId(null); }} className={`w-full p-2.5 rounded-md flex items-center justify-center transition-colors text-sm font-medium ${isBuilderMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
          {isBuilderMode ? <Eye size={18} className="mr-2"/> : <Edit3 size={18} className="mr-2"/>} {isBuilderMode ? "View Mode" : "Edit Mode"}
        </button>
      </div>
      <div className="flex-grow overflow-y-auto space-y-0">
        {isBuilderMode && (<>
            <ToolbarGroup title="Workspace Settings"><div className="space-y-2 text-sm p-1">
                <div><label htmlFor="gridColsInput" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Columns:</label><input type="number" id="gridColsInput" value={tempGridCols} onChange={(e) => setTempGridCols(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label htmlFor="gridRowsInput" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rows:</label><input type="number" id="gridRowsInput" value={tempGridRows} onChange={(e) => setTempGridRows(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500" /></div>
                <button onClick={handleUpdateWorkspace} className="w-full mt-1 p-2 bg-teal-500 hover:bg-teal-600 text-white rounded-md text-sm font-medium flex items-center justify-center"><LayoutDashboard size={16} className="mr-2"/> Apply Dimensions</button>
            </div></ToolbarGroup>
            <ToolbarGroup title="Editing Tools">{[{ tool: 'select', label: 'Select & Move', icon: MousePointer },{ tool: 'drawWall', label: 'Draw Wall', icon: Columns, iconProps: {style: {transform: 'rotate(90deg)'}} },{ tool: 'deleteItem', label: 'Delete Item', icon: Eraser }].map(item => (
                <button key={item.tool} onClick={() => handleSetCurrentTool(item.tool as any)} className={`w-full p-2.5 rounded-md text-sm flex items-center transition-colors font-medium ${currentTool === item.tool && !editingChairModeTableId ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'}`}><item.icon size={18} className="mr-2 flex-shrink-0" {...item.iconProps} /> {item.label}</button>))}
            </ToolbarGroup>
            {selectedItemForProps && (selectedItemForProps as TableProps).shape && (
                 <ItemPropertiesPanel 
                    selectedItem={selectedItemForProps} 
                    updateTableSeats={updateTableSeats} 
                    updateTableSize={updateTableSize}
                    updateTableLabel={updateTableLabel}
                    duplicateTable={duplicateTable}
                    gridCols={gridCols}
                    gridRows={gridRows}
                    editingChairModeTableId={editingChairModeTableId}
                    setEditingChairModeTableId={setEditingChairModeTableId}
                 />
            )}
            <ToolbarGroup title="Add Elements">{[{ shape: 'circle', label: 'Circle Table', icon: Circle },{ shape: 'square', label: 'Square Table', icon: SquareIcon },{ shape: 'rectangle', label: 'Rectangle Table', icon: Maximize2 }].map(item => (
                 <button key={item.shape} onClick={() => { addTable(item.shape as any); }} className="w-full p-2.5 rounded-md text-sm flex items-center bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"><item.icon size={18} className="mr-2 flex-shrink-0"/> Add {item.label}</button>))}
            </ToolbarGroup>
            </>)}
        {!isBuilderMode && (<ToolbarGroup title="Booking"><div className="p-2 bg-gray-50 dark:bg-gray-700/60 rounded-lg min-h-[120px] flex flex-col justify-center text-center space-y-1">
              {selectedTableDetails && !selectedTableDetails.isBooked ? (<>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Selected: <span className="text-blue-500 dark:text-blue-400">{selectedTableDetails.label || selectedTableDetails.id}</span></h4>
                  <p className="text-gray-600 dark:text-gray-300 text-xs"><Users className="inline-block mr-1 h-3.5 w-3.5 align-text-bottom" />{selectedTableDetails.chairVisibility?.filter(Boolean).length || selectedTableDetails.seats} seats</p>
                  <button onClick={handleBooking} className="mt-1 w-full p-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm text-xs">Book Table</button></>) 
              : selectedTableDetails && selectedTableDetails.isBooked ? (<p className="text-red-500 dark:text-red-400 font-semibold text-xs">Table ({selectedTableDetails.label || selectedTableDetails.id}) is booked!</p>) 
              : (<p className="text-gray-500 dark:text-gray-400 text-xs"><MapPin className="inline-block mr-1 h-3.5 w-3.5 align-text-bottom" />Click table to select.</p>)}
            </div><div className="mt-3"><h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1 text-center">Legend</h4><div className="space-y-1.5 text-xs px-1">
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-gray-300 border border-gray-500 dark:bg-gray-600 dark:border-gray-400 mr-2"></div><span className="text-gray-600 dark:text-gray-300">Available</span></div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-300 border border-blue-600 mr-2"></div><span className="text-gray-600 dark:text-gray-300">Selected</span></div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-gray-300 border border-gray-500 dark:bg-gray-600 dark:border-gray-400 relative mr-2 opacity-60"><Lock size={7} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-800 dark:text-gray-200"/></div><span className="text-gray-600 dark:text-gray-300">Booked</span></div>
            </div></div></ToolbarGroup>)}
      </div>
      {isBuilderMode && (<div className="pt-4 mt-auto border-t border-gray-200 dark:border-gray-700">
          <button onClick={saveLayout} className="w-full p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium flex items-center justify-center"><Save size={18} className="mr-2"/> Save Layout</button>
      </div>)}
    </div>
  );
};

// --- Main Page Component ---
export default function RestaurantLayoutEditorPage() {
  const [gridCols, setGridCols] = useState(INITIAL_GRID_COLS);
  const [gridRows, setGridRows] = useState(INITIAL_GRID_ROWS);
  const [tempGridCols, setTempGridCols] = useState(INITIAL_GRID_COLS.toString());
  const [tempGridRows, setTempGridRows] = useState(INITIAL_GRID_ROWS.toString());

  const [restaurantElements, setRestaurantElements] = useState<RestaurantElement[]>(() => createInitialElements(INITIAL_GRID_COLS, INITIAL_GRID_ROWS));
  const [tables, setTables] = useState<TableProps[]>(() => 
    initialTablesData.map(t => ({ 
        ...t, 
        isSelected: false,
        chairVisibility: Array(t.seats).fill(true) 
    }))
  );

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null); 
  const [selectedItemType, setSelectedItemType] = useState<'table' | 'element' | null>(null); 
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null); // For booking mode
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const [viewBox, setViewBox] = useState(`0 0 ${INITIAL_GRID_COLS * CELL_SIZE_PX} ${INITIAL_GRID_ROWS * CELL_SIZE_PX}`);

  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingInfo, setDraggingInfo] = useState<{ id: string; type: 'table' | 'element'; initialSvgX: number; initialSvgY: number; elementInitialGridX: number; elementInitialGridY: number; } | null>(null);
  
  const [isBuilderMode, setIsBuilderMode] = useState(true);
  const [currentTool, setCurrentTool] = useState<'select' | 'drawWall' | 'deleteItem'>('select');
  const [editingChairModeTableId, setEditingChairModeTableId] = useState<string | null>(null);

  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [wallStartCell, setWallStartCell] = useState<{ x: number, y: number } | null>(null);
  const [wallPreview, setWallPreview] = useState<RestaurantElement | null>(null);

  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');


  const showNotification = (message: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), duration);
  };


  const saveLayoutToLocalStorage = useCallback((
    currentTablesData?: TableProps[], 
    currentElementsData?: RestaurantElement[],
    currentGridColsData?: number,
    currentGridRowsData?: number,
    doShowNotification = true
  ) => {
    const layoutToSave = {
      gridCols: currentGridColsData || gridCols,
      gridRows: currentGridRowsData || gridRows,
      tables: (currentTablesData || tables).map(({ onClick, onChairClick, isSelected, ...rest }) => rest), 
      elements: currentElementsData || restaurantElements,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(layoutToSave));
      if (doShowNotification) {
        showNotification("Layout saved successfully!");
      }
    } catch (error) {
      showNotification(`Error saving: ${error instanceof Error ? error.message : 'Unknown'}`, 'error');
    }
  }, [tables, restaurantElements, gridCols, gridRows]);

  const resetLayoutToDimensions = useCallback((newCols: number, newRows: number) => {
    setGridCols(newCols); setGridRows(newRows);
    setTempGridCols(newCols.toString()); setTempGridRows(newRows.toString());
    const newElements = createInitialElements(newCols, newRows);
    setRestaurantElements(newElements); 
    
    const defaultInitialTables = initialTablesData.map(t => ({
        ...t,
        isSelected: false,
        chairVisibility: Array(t.seats).fill(true)
    }));

    const keptTables = defaultInitialTables.filter(t => {
        const tableEndX = t.gridX + t.gridWidth;
        const tableEndY = t.gridY + t.gridHeight;
        return tableEndX <= newCols && tableEndY <= newRows;
    });
    setTables(keptTables.length > 0 ? keptTables : []); 

    setSelectedItemId(null); setSelectedItemType(null); setSelectedTableId(null); setEditingChairModeTableId(null);
    saveLayoutToLocalStorage(keptTables.length > 0 ? keptTables : [], newElements, newCols, newRows, false);
    showNotification(`Workspace updated to ${newCols}x${newRows}. Layout reset.`);
  }, [saveLayoutToLocalStorage]); 


  const handleUpdateWorkspace = () => {
    const newCols = parseInt(tempGridCols, 10); const newRows = parseInt(tempGridRows, 10);
    if (isNaN(newCols) || isNaN(newRows) || newCols <=5 || newRows <=5 || newCols > 200 || newRows > 200) {
        showNotification("Invalid dimensions. Cols/Rows must be between 5 and 200.", 'error'); return;
    }
    if (newCols === gridCols && newRows === gridRows) {
        showNotification("Dimensions are already set to these values.", "success"); return;
    }
    resetLayoutToDimensions(newCols, newRows);
  };

  useEffect(() => {
    const savedLayoutJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
    let loadedCols = INITIAL_GRID_COLS; let loadedRows = INITIAL_GRID_ROWS;
    if (savedLayoutJSON) {
      try {
        const savedLayout = JSON.parse(savedLayoutJSON);
        loadedCols = savedLayout.gridCols || INITIAL_GRID_COLS; 
        loadedRows = savedLayout.gridRows || INITIAL_GRID_ROWS;
        
        setGridCols(loadedCols); 
        setGridRows(loadedRows);
        setTempGridCols(loadedCols.toString()); 
        setTempGridRows(loadedRows.toString());
        
        const loadedTables = savedLayout.tables?.map((t: TableProps) => ({ 
            ...t, 
            isSelected: false,
            // Ensure chairVisibility is correctly sized and initialized
            chairVisibility: (t.chairVisibility && t.chairVisibility.length === t.seats) 
                             ? t.chairVisibility 
                             : Array(t.seats || 0).fill(true) // Use t.seats || 0 to prevent NaN length
        })) || initialTablesData.map(t => ({...t, isSelected: false, chairVisibility: Array(t.seats).fill(true)}));
        setTables(loadedTables);
        
        setRestaurantElements(savedLayout.elements || createInitialElements(loadedCols, loadedRows));
      } catch (error) { 
        console.error("Error loading layout from local storage:", error);
        setGridCols(INITIAL_GRID_COLS); setGridRows(INITIAL_GRID_ROWS);
        setTempGridCols(INITIAL_GRID_COLS.toString()); setTempGridRows(INITIAL_GRID_ROWS.toString());
        setRestaurantElements(createInitialElements(INITIAL_GRID_COLS, INITIAL_GRID_ROWS));
        setTables(initialTablesData.map(t => ({ ...t, isSelected: false, chairVisibility: Array(t.seats).fill(true) })));
        saveLayoutToLocalStorage( 
            initialTablesData.map(t => ({ ...t, isSelected: false, chairVisibility: Array(t.seats).fill(true) })),
            createInitialElements(INITIAL_GRID_COLS, INITIAL_GRID_ROWS),
            INITIAL_GRID_COLS, INITIAL_GRID_ROWS,
            false
        );
      }
    } else { 
        setGridCols(INITIAL_GRID_COLS); setGridRows(INITIAL_GRID_ROWS);
        setTempGridCols(INITIAL_GRID_COLS.toString()); setTempGridRows(INITIAL_GRID_ROWS.toString());
        const defaultElements = createInitialElements(INITIAL_GRID_COLS, INITIAL_GRID_ROWS);
        const defaultTables = initialTablesData.map(t => ({ ...t, isSelected: false, chairVisibility: Array(t.seats).fill(true) }));
        setRestaurantElements(defaultElements);
        setTables(defaultTables);
        saveLayoutToLocalStorage(defaultTables, defaultElements, INITIAL_GRID_COLS, INITIAL_GRID_ROWS, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    const currentSvgBaseWidth = gridCols * CELL_SIZE_PX; const currentSvgBaseHeight = gridRows * CELL_SIZE_PX;
    const newViewBoxWidth = currentSvgBaseWidth / zoomLevel; const newViewBoxHeight = currentSvgBaseHeight / zoomLevel;
    const newX = (currentSvgBaseWidth - newViewBoxWidth) / 2; const newY = (currentSvgBaseHeight - newViewBoxHeight) / 2;
    setViewBox(`${newX} ${newY} ${newViewBoxWidth} ${newViewBoxHeight}`);
  }, [zoomLevel, gridCols, gridRows]);

  const getSVGCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0, gridX: 0, gridY: 0 };
    const pt = svgRef.current.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    return { x: svgP.x, y: svgP.y, gridX: Math.max(0, Math.min(Math.floor(svgP.x / CELL_SIZE_PX), gridCols -1)), gridY: Math.max(0, Math.min(Math.floor(svgP.y / CELL_SIZE_PX), gridRows -1))};
  }, [svgRef, gridCols, gridRows]);

  const handleItemClick = (id: string, itemType: 'table' | 'element') => {
    if (editingChairModeTableId && editingChairModeTableId !== id && itemType === 'table') {
        setEditingChairModeTableId(null); 
    } else if (editingChairModeTableId && itemType === 'element') {
        setEditingChairModeTableId(null);
    }

    if (isBuilderMode) {
        if (currentTool === 'deleteItem' && !editingChairModeTableId) { 
            deleteItemById(id, itemType); 
        } else if (!editingChairModeTableId) { 
            setSelectedItemId(id); 
            setSelectedItemType(itemType); 
        }
    } else { 
        if (itemType === 'table') {
            setTables(prev => prev.map(t => t.id === id && !t.isBooked ? { ...t, isSelected: !t.isSelected } : { ...t, isSelected: false }));
            const clickedTable = tables.find(t => t.id === id);
            if (clickedTable && !clickedTable.isBooked) setSelectedTableId(prevId => (prevId === id ? null : id));
            else if (clickedTable && clickedTable.isBooked) setSelectedTableId(null);
        }
    }
  };

  const handleTableChairClick = (tableId: string, chairIndex: number) => {
    if (!isBuilderMode || editingChairModeTableId !== tableId) return; 
    
    setTables(prevTables => 
        prevTables.map(t => {
            if (t.id === tableId) {
                // Ensure chairVisibility array is correctly sized based on current t.seats
                let currentVisibility = t.chairVisibility ? [...t.chairVisibility] : [];

                // If chairVisibility is shorter than t.seats, expand it, defaulting new slots to true
                if (currentVisibility.length < t.seats) {
                    const expandedVisibility = Array(t.seats).fill(true);
                    for (let i = 0; i < currentVisibility.length; i++) {
                        expandedVisibility[i] = currentVisibility[i];
                    }
                    currentVisibility = expandedVisibility;
                } else if (currentVisibility.length > t.seats) {
                    // If it's somehow longer (e.g. seats was reduced), truncate it
                    currentVisibility = currentVisibility.slice(0, t.seats);
                }
                
                if (chairIndex < 0 || chairIndex >= t.seats) { 
                    console.error(`Chair index ${chairIndex} is out of bounds for table seats ${t.seats}.`);
                    return t; 
                }

                currentVisibility[chairIndex] = !currentVisibility[chairIndex];
                return { ...t, chairVisibility: currentVisibility };
            }
            return t;
        })
    );
    // Defer saving to local storage to avoid too frequent updates during rapid clicks
    // saveLayoutToLocalStorage(updatedTables, restaurantElements, undefined, undefined, false); 
  };

  const handleBooking = () => { 
    if (isBuilderMode || !selectedTableId) return;
    const tableToBook = tables.find(t => t.id === selectedTableId);
    if (tableToBook && !tableToBook.isBooked) {
      const updatedTables = tables.map(table => table.id === selectedTableId ? { ...table, isBooked: true, isSelected: false } : table);
      setTables(updatedTables); setSelectedTableId(null);
      showNotification(`Table (${tableToBook.label || selectedTableId}) booked!`);
      saveLayoutToLocalStorage(updatedTables, restaurantElements);
    } else {
      showNotification("Table already booked or not selectable.", 'error');
    }
  };
  
  const deleteItemById = (id: string, itemType: 'table' | 'element') => { 
    if (editingChairModeTableId) return; 

    let itemDeletedMessage = "";
    let finalTables = [...tables];
    let finalElements = [...restaurantElements];

    if (itemType === 'table') {
        finalTables = tables.filter(t => t.id !== id); 
        setTables(finalTables);
        itemDeletedMessage = "Table deleted.";
    } else if (itemType === 'element') {
        const elToDelete = restaurantElements.find(el => el.id === id);
        if (elToDelete && ['wall-n', 'wall-s', 'wall-w', 'wall-e'].includes(elToDelete.id)) {
             showNotification("Boundary walls cannot be deleted.", 'error'); return;
        }
        finalElements = restaurantElements.filter(el => el.id !== id); 
        setRestaurantElements(finalElements);
        itemDeletedMessage = `${elToDelete?.type || 'Element'} deleted.`;
    }

    saveLayoutToLocalStorage(finalTables, finalElements, undefined, undefined, false);

    if (itemDeletedMessage) {
        showNotification(itemDeletedMessage); 
        if (selectedItemId === id) {
            setSelectedItemId(null); 
            setSelectedItemType(null);
        }
    }
  };

  const handleMouseDownSVG = (e: React.MouseEvent<SVGSVGElement>) => { 
    if (!isBuilderMode) return;
    const target = e.target as SVGElement;
    
    if (editingChairModeTableId && target.closest(`g[data-id="${editingChairModeTableId}"] g[data-chair-index]`)) {
        return; 
    }

    const gElement = target.closest('g[data-id]'); 
    const dataId = gElement?.getAttribute('data-id');
    const dataType = gElement?.getAttribute('data-type') as 'table' | 'element' | undefined;
    const { x: svgMouseX, y: svgMouseY, gridX: currentGridX, gridY: currentGridY } = getSVGCoordinates(e.clientX, e.clientY);

    if (editingChairModeTableId && (!dataId || dataId !== editingChairModeTableId)) {
        setEditingChairModeTableId(null);
    }
    
    if (currentTool === 'select' && dataId && dataType && !editingChairModeTableId) { 
        setSelectedItemId(dataId); setSelectedItemType(dataType);
        if (dataType === 'table') {
          const table = tables.find(t => t.id === dataId);
          if (table) setDraggingInfo({ id: dataId, type: 'table', initialSvgX: svgMouseX, initialSvgY: svgMouseY, elementInitialGridX: table.gridX, elementInitialGridY: table.gridY });
        } else if (dataType === 'element') {
          const element = restaurantElements.find(el => el.id === dataId);
          if (element && element.type !== 'wall') { 
             setDraggingInfo({ id: dataId, type: 'element', initialSvgX: svgMouseX, initialSvgY: svgMouseY, elementInitialGridX: element.gridX, elementInitialGridY: element.gridY });
          }
        }
    } else if (currentTool === 'drawWall' && !editingChairModeTableId) {
        setIsDrawingWall(true); setWallStartCell({ x: currentGridX, y: currentGridY });
        setWallPreview({ id: 'wall-preview', type: 'wall', gridX: currentGridX, gridY: currentGridY, gridWidth: 1, gridHeight: 1, color: 'rgba(100, 100, 255, 0.5)', strokeColor: 'blue' });
        setSelectedItemId(null); 
        setSelectedItemType(null);
    } else if (!dataId && !editingChairModeTableId) { 
        setSelectedItemId(null);
        setSelectedItemType(null);
    }
  };

  const handleMouseMoveSVG = (e: React.MouseEvent<SVGSVGElement>) => { 
    if (!isBuilderMode || editingChairModeTableId) return; 
    const { gridX: currentGridX, gridY: currentGridY, x: svgMouseX, y: svgMouseY } = getSVGCoordinates(e.clientX, e.clientY);
    if (draggingInfo) {
      const deltaGridX = Math.round((svgMouseX - draggingInfo.initialSvgX) / CELL_SIZE_PX);
      const deltaGridY = Math.round((svgMouseY - draggingInfo.initialSvgY) / CELL_SIZE_PX);
      let newElementGridX = draggingInfo.elementInitialGridX + deltaGridX;
      let newElementGridY = draggingInfo.elementInitialGridY + deltaGridY;
      if (draggingInfo.type === 'table') {
        const table = tables.find(t=>t.id === draggingInfo.id); if (!table) return;
        newElementGridX = Math.max(0, Math.min(newElementGridX, gridCols - table.gridWidth ));
        newElementGridY = Math.max(0, Math.min(newElementGridY, gridRows - table.gridHeight ));
        setTables(prev => prev.map(t => t.id === draggingInfo.id ? { ...t, gridX: newElementGridX, gridY: newElementGridY } : t));
      } else if (draggingInfo.type === 'element') {
        const element = restaurantElements.find(el=>el.id === draggingInfo.id); if (!element) return;
        newElementGridX = Math.max(0, Math.min(newElementGridX, gridCols - element.gridWidth ));
        newElementGridY = Math.max(0, Math.min(newElementGridY, gridRows - element.gridHeight ));
        setRestaurantElements(prev => prev.map(el => el.id === draggingInfo.id ? { ...el, gridX: newElementGridX, gridY: newElementGridY } : el));
      }
    } else if (isDrawingWall && wallStartCell) {
        const x1 = wallStartCell.x; const y1 = wallStartCell.y; const x2 = currentGridX; const y2 = currentGridY;
        let newWall: RestaurantElement;
        if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) { newWall = { id: 'wall-preview', type: 'wall', gridX: Math.min(x1, x2), gridY: y1, gridWidth: Math.abs(x2 - x1) + 1, gridHeight: 1, color: 'rgba(100,100,255,0.5)', strokeColor: 'blue' };
        } else { newWall = { id: 'wall-preview', type: 'wall', gridX: x1, gridY: Math.min(y1, y2), gridWidth: 1, gridHeight: Math.abs(y2 - y1) + 1, color: 'rgba(100,100,255,0.5)', strokeColor: 'blue' }; }
        setWallPreview(newWall);
    }
  };
  const handleMouseUpSVG = () => { 
    if (!isBuilderMode) return;
    if (draggingInfo) { 
        setDraggingInfo(null); 
        saveLayoutToLocalStorage(undefined, undefined, undefined, undefined, false); 
    }
    if (isDrawingWall && wallPreview && wallStartCell) {
        const finalWall: RestaurantElement = { ...wallPreview, id: generateId(), color: 'rgb(180 180 180)', strokeColor: 'rgb(150 150 150)' }; 
        const updatedElements = [...restaurantElements, finalWall];
        setRestaurantElements(updatedElements); 
        saveLayoutToLocalStorage(tables, updatedElements, undefined, undefined, false); 
    }
    setIsDrawingWall(false); setWallStartCell(null); setWallPreview(null);
  };

  const calculateVisualMaxSeats = (table: Pick<TableProps, 'shape' | 'gridWidth' | 'gridHeight'>): number => {
    const tablePixelWidth = table.gridWidth * CELL_SIZE_PX;
    const tablePixelHeight = table.gridHeight * CELL_SIZE_PX;
    const minTableDimension = Math.min(tablePixelWidth, tablePixelHeight);
    if (minTableDimension === 0) return 0; 
    const chairPixelSize = minTableDimension * 0.22; 
    if (chairPixelSize <= 1) return 0; 
    const chairSpacing = chairPixelSize * 1.2; 

    if (table.shape === 'circle') {
        const radius = tablePixelWidth / 2;
        const effectiveRadius = radius - chairPixelSize * 0.5; 
        if (effectiveRadius <= chairPixelSize * 0.2) return 0; 
        const circumference = 2 * Math.PI * effectiveRadius;
        return Math.max(0, Math.floor(circumference / chairSpacing));
    } else { 
        const seatsHorizontal = Math.max(0,Math.floor(tablePixelWidth / chairSpacing));
        const seatsVertical = Math.max(0,Math.floor(tablePixelHeight / chairSpacing));
        
        if (table.gridWidth === 1 && table.gridHeight === 1) { 
             // For a 1x1 grid cell, it can typically fit 1 chair per side if space allows, up to 4.
             // However, with chairPixelSize being 0.22 * CELL_SIZE and spacing 1.2x that,
             // a single cell (25px) might only fit 1-2 chairs total realistically.
             // Let's be conservative: Max 2 for a 1x1 cell.
             return Math.min(2, seatsHorizontal + seatsVertical); // Simplified
        }
        if (table.gridWidth === 1) return seatsVertical * 2; 
        if (table.gridHeight === 1) return seatsHorizontal * 2; 
        
        return (seatsHorizontal * 2) + (seatsVertical * 2); 
    }
};


  const addTable = (shape: 'circle' | 'square' | 'rectangle') => { 
    if (!isBuilderMode) return;
    if (editingChairModeTableId) setEditingChairModeTableId(null); 
    
    let newTableBase = { shape, seats: 4, label: `T${tables.length + 1}`, tableStyle: 'wood' as 'wood'}; 
    let gridWidth = 2, gridHeight = 2; 
    
    if (shape === 'rectangle') { gridWidth = 3; gridHeight = 2; newTableBase.seats = 6;}
    else if (shape === 'square') { gridWidth = 2; gridHeight = 2; newTableBase.seats = 4;}
    else if (shape === 'circle') { gridWidth = 2; gridHeight = 2; newTableBase.seats = 4;}

    const defaultGridX = Math.max(1, Math.floor((gridCols - gridWidth) / 2)); 
    const defaultGridY = Math.max(1, Math.floor((gridRows - gridHeight) / 2));

    const newTable: TableProps = { 
        ...newTableBase, 
        id: generateId(), 
        gridX: defaultGridX, 
        gridY: defaultGridY, 
        gridWidth, 
        gridHeight, 
        isBooked: false,
        chairVisibility: Array(newTableBase.seats).fill(true)
    };
    
    const updatedTables = [...tables, newTable]; 
    setTables(updatedTables); 
    saveLayoutToLocalStorage(updatedTables, restaurantElements, undefined, undefined, false);
    setSelectedItemId(newTable.id); 
    setSelectedItemType('table');
  };

  const updateTableSeats = (tableId: string, newSeatsCount: number) => {
    const tableToUpdate = tables.find(t => t.id === tableId);
    if (!tableToUpdate) return;

    const visualMax = calculateVisualMaxSeats(tableToUpdate);
    let finalSeats = newSeatsCount;

    if (newSeatsCount > visualMax) {
        showNotification(`Max ${visualMax} seats for this table size. Adjusted.`, 'error');
        finalSeats = visualMax;
    }
    finalSeats = Math.max(0, finalSeats); 

    setTables(prevTables => 
        prevTables.map(t =>
          t.id === tableId
            ? { ...t, seats: finalSeats, chairVisibility: Array(finalSeats).fill(true) } 
            : t
        )
    );
    // Defer save to avoid race conditions if this is called rapidly
    // saveLayoutToLocalStorage will be called by useEffect watching `tables`
  };

  const updateTableSize = (tableId: string, newWidth: number, newHeight: number) => {
    setTables(prevTables => {
        const tableToUpdate = prevTables.find(t => t.id === tableId);
        if (!tableToUpdate) return prevTables;

        const clampedWidth = Math.max(1, Math.min(newWidth, gridCols - tableToUpdate.gridX));
        const clampedHeight = Math.max(1, Math.min(newHeight, gridRows - tableToUpdate.gridY));

        const tempUpdatedTableForCalc = { ...tableToUpdate, gridWidth: clampedWidth, gridHeight: clampedHeight };
        const visualMaxSeats = calculateVisualMaxSeats(tempUpdatedTableForCalc);
        
        let newSeats = tableToUpdate.seats;
        let newChairVisibilityArray = [...(tableToUpdate.chairVisibility || Array(tableToUpdate.seats).fill(true))];

        if (newSeats > visualMaxSeats) {
            newSeats = visualMaxSeats;
            showNotification(`Resized. Max seats adjusted to ${visualMaxSeats}.`, 'error');
            newChairVisibilityArray = Array(newSeats).fill(true); 
        } else {
            // Ensure chairVisibility length matches newSeats, preserving existing values
            const correctlySizedVisibility = Array(newSeats).fill(true);
            for(let i = 0; i < Math.min(newSeats, newChairVisibilityArray.length); i++) {
                correctlySizedVisibility[i] = newChairVisibilityArray[i];
            }
            newChairVisibilityArray = correctlySizedVisibility;
        }
        
        return prevTables.map(t => {
            if (t.id === tableId) {
                return {...t, gridWidth: clampedWidth, gridHeight: clampedHeight, seats: newSeats, chairVisibility: newChairVisibilityArray};
            }
            return t;
        });
    });
  };
  
  // Effect to save layout when tables or elements change (debounced or direct)
  useEffect(() => {
    // console.log("Tables or elements changed, saving layout.");
    saveLayoutToLocalStorage(tables, restaurantElements, gridCols, gridRows, false);
  }, [tables, restaurantElements, gridCols, gridRows, saveLayoutToLocalStorage]);


  const updateTableLabel = (tableId: string, newLabel: string) => {
    setTables(prevTables => 
        prevTables.map(t =>
          t.id === tableId ? { ...t, label: newLabel } : t
        )
    );
  };

  const duplicateTable = (tableId: string) => {
    if (editingChairModeTableId) setEditingChairModeTableId(null); 
    const tableToDuplicate = tables.find(t => t.id === tableId);
    if (tableToDuplicate) {
        const newTable: TableProps = {
            ...tableToDuplicate,
            id: generateId(),
            label: `${tableToDuplicate.label || 'Table'}-copy`,
            gridX: Math.min(tableToDuplicate.gridX + 1, gridCols - tableToDuplicate.gridWidth), 
            gridY: Math.min(tableToDuplicate.gridY + 1, gridRows - tableToDuplicate.gridHeight),
            isBooked: false, 
            isSelected: false,
            chairVisibility: [...(tableToDuplicate.chairVisibility || Array(tableToDuplicate.seats).fill(true))] 
        };
        setTables(prevTables => [...prevTables, newTable]);
        showNotification(`Table "${tableToDuplicate.label}" duplicated.`);
        setSelectedItemId(newTable.id); 
        setSelectedItemType('table');
    }
  };


  const GridBackground = () => { 
    const lines = [];
    for (let i = 0; i <= gridCols; i++) lines.push(<line key={`v-${i}`} x1={i * CELL_SIZE_PX} y1={0} x2={i * CELL_SIZE_PX} y2={gridRows * CELL_SIZE_PX} stroke="rgba(200,200,200,0.2)" strokeWidth="0.5" />);
    for (let i = 0; i <= gridRows; i++) lines.push(<line key={`h-${i}`} x1={0} y1={i * CELL_SIZE_PX} x2={gridCols * CELL_SIZE_PX} y2={i * CELL_SIZE_PX} stroke="rgba(200,200,200,0.2)" strokeWidth="0.5" />);
    return <g>{lines}</g>;
  };
  
  const selectedItemForProps = selectedItemId ? 
    (selectedItemType === 'table' ? tables.find(t => t.id === selectedItemId) : restaurantElements.find(el => el.id === selectedItemId)) 
    : null;

  const svgCanvasStyle: React.CSSProperties = editingChairModeTableId 
    ? { cursor: `url('${removeCursorDataURL}') 12 12, auto` } 
    : {};

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200">
      <Sidebar
        isBuilderMode={isBuilderMode} setIsBuilderMode={setIsBuilderMode}
        currentTool={currentTool} setCurrentTool={setCurrentTool}
        addTable={addTable} saveLayout={() => saveLayoutToLocalStorage(undefined, undefined, undefined, undefined, true)} // Explicit save with notification
        tempGridCols={tempGridCols} setTempGridCols={setTempGridCols}
        tempGridRows={tempGridRows} setTempGridRows={setTempGridRows}
        handleUpdateWorkspace={handleUpdateWorkspace}
        selectedTableDetails={tables.find(table => table.id === selectedTableId)}
        handleBooking={handleBooking}
        selectedItemForProps={selectedItemForProps as TableProps | RestaurantElement | null} 
        updateTableSeats={updateTableSeats}
        updateTableSize={updateTableSize}
        updateTableLabel={updateTableLabel}
        duplicateTable={duplicateTable} 
        gridCols={gridCols}
        gridRows={gridRows}
        editingChairModeTableId={editingChairModeTableId}
        setEditingChairModeTableId={setEditingChairModeTableId}
      />
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 overflow-hidden relative">
        {showSaveNotification && ( 
             <div className={`fixed top-6 right-6 p-3.5 rounded-lg shadow-xl text-white text-sm z-50 transition-all duration-300 ease-out ${notificationType === 'error' ? 'bg-red-500' : 'bg-green-500'}`} role="alert">
                <div className="flex items-center">
                  {notificationType === 'error' ? <XCircle size={20} className="mr-2.5" /> : <CheckSquare size={20} className="mr-2.5" />}
                  <span>{notificationMessage}</span>
                </div>
            </div>
        )}
        <div className={`relative w-full h-full border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800/80 
            ${isBuilderMode && currentTool === 'drawWall' && !editingChairModeTableId ? 'cursor-crosshair' : ''} 
            ${isBuilderMode && currentTool === 'deleteItem' && !editingChairModeTableId ? 'cursor-pointer' : ''}
        `}>
          <svg ref={svgRef} 
            preserveAspectRatio="xMidYMid meet" 
            viewBox={viewBox} 
            className="w-full h-full select-none"
            style={svgCanvasStyle} 
            onMouseDown={handleMouseDownSVG}
            onMouseMove={isBuilderMode && (draggingInfo || isDrawingWall) ? handleMouseMoveSVG : undefined}
            onMouseUp={isBuilderMode && (draggingInfo || isDrawingWall) ? handleMouseUpSVG : undefined}
            onMouseLeave={isBuilderMode && (draggingInfo || isDrawingWall) ? handleMouseUpSVG : undefined} 
          >
            <defs>
                <filter id="elementDepthEffect" x="-20%" y="-20%" width="140%" height="140%"><feOffset result="offOut" in="SourceAlpha" dx="0.8" dy="0.8" /><feGaussianBlur result="blurOut" in="offOut" stdDeviation="0.5" /><feBlend in="SourceGraphic" in2="blurOut" mode="normal" /><feComponentTransfer in="blurOut" result="alphaBlurred"><feFuncA type="linear" slope="0.5"/></feComponentTransfer><feMerge><feMergeNode in="alphaBlurred"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <linearGradient id="windowGlassGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor: "rgba(220, 230, 240, 0.7)", stopOpacity:1}} /><stop offset="100%" style={{stopColor: "rgba(180, 200, 220, 0.5)", stopOpacity:1}} /></linearGradient>
                <pattern id="woodPattern" patternUnits="userSpaceOnUse" width="60" height="60" patternTransform="rotate(45)"><rect width="60" height="60" fill="rgb(210, 180, 140)" /><line x1="0" y1="10" x2="60" y2="10" stroke="rgb(139, 115, 85)" strokeWidth="3" opacity="0.4"/><line x1="0" y1="30" x2="60" y2="30" stroke="rgb(160, 120, 90)" strokeWidth="4" opacity="0.3"/><line x1="0" y1="50" x2="60" y2="50" stroke="rgb(139, 115, 85)" strokeWidth="2.5" opacity="0.4"/></pattern>
                <pattern id="woodPatternDark" patternUnits="userSpaceOnUse" width="50" height="50" patternTransform="rotate(30)"><rect width="50" height="50" fill="rgb(139, 69, 19)" /><line x1="0" y1="10" x2="50" y2="10" stroke="rgb(80, 40, 10)" strokeWidth="4" opacity="0.5"/><line x1="0" y1="30" x2="50" y2="30" stroke="rgb(100, 50, 15)" strokeWidth="3" opacity="0.4"/></pattern>
                <pattern id="tilePattern" patternUnits="userSpaceOnUse" width={CELL_SIZE_PX*2} height={CELL_SIZE_PX*2}><rect width={CELL_SIZE_PX*2} height={CELL_SIZE_PX*2} fill="rgb(235, 235, 225)" /><path d={`M ${CELL_SIZE_PX} 0 L ${CELL_SIZE_PX} ${CELL_SIZE_PX*2} M 0 ${CELL_SIZE_PX} L ${CELL_SIZE_PX*2} ${CELL_SIZE_PX}`} stroke="rgb(200,200,190)" strokeWidth="0.5"/></pattern>
                <pattern id="metalPattern" patternUnits="userSpaceOnUse" width="20" height="20"><rect width="20" height="20" fill="rgb(192,192,192)" /><line x1="0" y1="0" x2="20" y2="20" stroke="rgb(160,160,160)" strokeWidth="1" /><line x1="0" y1="20" x2="20" y2="0" stroke="rgb(170,170,170)" strokeWidth="0.5" /></pattern>
                 <pattern id="metalPatternLight" patternUnits="userSpaceOnUse" width="20" height="20"><rect width="20" height="20" fill="rgb(211,211,211)" /><line x1="0" y1="0" x2="20" y2="20" stroke="rgb(180,180,180)" strokeWidth="0.5" /></pattern>
                <filter id="textBg"><feFlood floodColor="rgba(0,0,0,0.4)" result="flood" /><feComposite in="flood" in2="SourceAlpha" operator="in" result="blackSource" /><feMorphology operator="dilate" radius="0.8" in="blackSource" result="dilated"/><feOffset dx="0.5" dy="0.5" in="dilated" result="offsetbackground"/><feMerge><feMergeNode in="offsetbackground"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                 <style>
                    {`.builder-selected-item > rect:first-of-type, .builder-selected-item > circle:first-of-type { 
                        stroke: rgb(59 130 246) !important; 
                        stroke-width: 2.5px !important; 
                        stroke-dasharray: 5 2.5 !important; 
                    }`}
                 </style>
            </defs>
            <GridBackground />
            {restaurantElements.map(el => {
              const elPixelWidth = el.gridWidth * CELL_SIZE_PX; const elPixelHeight = el.gridHeight * CELL_SIZE_PX;
              const depthPx = el.depth || 0; 
              let iconSize = Math.min(elPixelWidth, elPixelHeight) * 0.5;
              const IconComponent = el.iconName ? iconMap[el.iconName] : null;
              const isSelectedBuilder = isBuilderMode && selectedItemId === el.id && !editingChairModeTableId;
              let fillOverride = el.color || 'rgb(200,200,200)';
              if(el.type === 'kitchen' && el.texture === 'tile') fillOverride = "url(#tilePattern)";
              if(el.type === 'door') fillOverride = "url(#woodPatternDark)"; 

              let labelFontSize = Math.min(elPixelWidth, elPixelHeight) * 0.15;
              if (el.type === 'door') {
                labelFontSize = Math.min(elPixelWidth * 0.2, elPixelHeight * 0.15); 
                iconSize = Math.min(elPixelWidth * 0.25, elPixelHeight * 0.25);
              }


              return (
                <g key={el.id} transform={`translate(${el.gridX * CELL_SIZE_PX}, ${el.gridY * CELL_SIZE_PX})`}
                   filter={el.type !== 'wall' && el.type !== 'decoration' ? "url(#elementDepthEffect)" : undefined}
                   data-id={el.id} data-type="element"
                   onClick={() => { if (!editingChairModeTableId) handleItemClick(el.id, 'element');}}
                   className={`${isBuilderMode && currentTool === 'select' && el.type !== 'wall' && !editingChairModeTableId ? 'cursor-move' : ''} ${isBuilderMode && currentTool === 'deleteItem' && (!['wall-n', 'wall-s', 'wall-w', 'wall-e'].includes(el.id)) && !editingChairModeTableId ? 'hover:opacity-60 cursor-pointer' : ''} ${isSelectedBuilder ? 'builder-selected-item' : ''}`}
                   >
                  {el.type !== 'wall' && el.type !== 'decoration' && depthPx > 0 && (<rect width={elPixelWidth} height={elPixelHeight} fill={el.strokeColor || 'rgba(0,0,0,0.2)'} rx={ (el.rx || 0) * Math.min(elPixelWidth, elPixelHeight) + depthPx * 0.5 } transform={`translate(${depthPx * 0.25}, ${depthPx * 0.25})`}/>)}
                  
                  {el.type === 'door' ? (
                    <>
                      <rect width={elPixelWidth} height={elPixelHeight} fill={el.strokeColor || 'rgb(101, 67, 33)'} rx={(el.rx || 0) * Math.min(elPixelWidth, elPixelHeight)} />
                      <rect 
                        x={elPixelWidth * 0.07} y={elPixelHeight * 0.05} 
                        width={elPixelWidth * 0.86} height={elPixelHeight * 0.9} 
                        fill={fillOverride} 
                        stroke="rgba(0,0,0,0.2)" strokeWidth="0.5"
                        rx={((el.rx || 0) * Math.min(elPixelWidth, elPixelHeight)) * 0.8} 
                      />
                      <circle cx={elPixelWidth * (el.gridWidth > 1 ? 0.15 : 0.8)} cy={elPixelHeight / 2} r={Math.min(elPixelWidth, elPixelHeight) * 0.06} fill="rgb(212, 175, 55)" />
                      <circle cx={elPixelWidth * (el.gridWidth > 1 ? 0.15 : 0.8)} cy={elPixelHeight / 2} r={Math.min(elPixelWidth, elPixelHeight) * 0.04} fill="rgb(184, 134, 11)" />
                    </>
                  ) : (
                     <rect width={elPixelWidth} height={elPixelHeight} fill={fillOverride} stroke={el.strokeColor || 'rgb(150,150,150)'} strokeWidth={"0.5"} rx={ (el.rx || 0) * Math.min(elPixelWidth, elPixelHeight) }/>
                  )}

                  {el.type === 'bar' && <BarVisuals el={el} gridColsMain={gridCols} gridRowsMain={gridRows} allElements={restaurantElements} /> }
                  {el.type === 'kitchen' && <KitchenVisuals el={el} />}
                  {el.type === 'window' && (<><rect width={elPixelWidth} height={elPixelHeight} fill="none" stroke={el.strokeColor || 'rgb(100,100,100)'} strokeWidth={elPixelWidth * 0.1} rx={(el.rx || 0) * Math.min(elPixelWidth, elPixelHeight)}/><rect x={elPixelWidth * 0.08} y={elPixelHeight * 0.08} width={elPixelWidth * 0.84} height={elPixelHeight * 0.84} fill="url(#windowGlassGradient)" rx={((el.rx || 0) * Math.min(elPixelWidth, elPixelHeight)) * 0.8} opacity="0.8"/><line x1={elPixelWidth*0.15} y1={elPixelHeight*0.15} x2={elPixelWidth*0.85} y2={elPixelHeight*0.85} stroke="rgba(255,255,255,0.3)" strokeWidth="0.7"/><line x1={elPixelWidth*0.15} y1={elPixelHeight*0.85} x2={elPixelWidth*0.85} y2={elPixelHeight*0.15} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/></>)}
                  
                  {IconComponent && !['bar', 'kitchen', 'door'].includes(el.type) && React.createElement(IconComponent, { x: elPixelWidth * (el.label && el.label.length > 0 ? 0.15 : 0.5) - (el.label && el.label.length > 0 ? 0 : iconSize/2), y: elPixelHeight * 0.5 - iconSize/2, size: iconSize, color: el.iconColor || el.labelColor || "white", className: "pointer-events-none", strokeWidth: 1.5})}
                  
                  {el.label && !['bar', 'kitchen'].includes(el.type) && (
                    <text 
                        x={elPixelWidth / 2} 
                        y={el.type === 'door' ? elPixelHeight * 0.25 : (IconComponent ? elPixelHeight / 1.7 : elPixelHeight / 2)} 
                        textAnchor="middle" 
                        dominantBaseline={el.type === 'door' ? "middle" : (IconComponent ? "auto" : "middle")} 
                        fontSize={labelFontSize} 
                        fill={el.labelColor || "white"} 
                        className="pointer-events-none font-semibold tracking-wide" 
                        dy={el.type !== 'door' && IconComponent ? iconSize * 0.6 : 0} 
                        filter="url(#textBg)"
                    >
                        {el.label}
                    </text>
                  )}
                  {el.type === 'door' && IconComponent && <IconComponent x={elPixelWidth * 0.5 - iconSize/2} y={elPixelHeight * 0.6} size={iconSize} color={el.iconColor || "white"} className="pointer-events-none" />}
                </g>
              );
            })}
            {tables.map(table => (
              <g key={table.id}
                 transform={`translate(${(table.gridX * CELL_SIZE_PX) + (table.gridWidth * CELL_SIZE_PX / 2)}, ${(table.gridY * CELL_SIZE_PX) + (table.gridHeight * CELL_SIZE_PX / 2)})`}
                 data-id={table.id} data-type="table"
                 >
                 <TableSvg 
                    {...table} 
                    isBuilderMode={isBuilderMode} 
                    currentTool={currentTool} 
                    selectedItemId={selectedItemId}
                    onClick={handleItemClick} 
                    onChairClick={handleTableChairClick} 
                    isEditingChairs={editingChairModeTableId === table.id}
                />
              </g>
            ))}
            {isDrawingWall && wallPreview && (<rect x={wallPreview.gridX * CELL_SIZE_PX} y={wallPreview.gridY * CELL_SIZE_PX} width={wallPreview.gridWidth * CELL_SIZE_PX} height={wallPreview.gridHeight * CELL_SIZE_PX} fill={wallPreview.color || 'rgba(100,100,255,0.5)'} stroke={wallPreview.strokeColor || 'blue'} strokeWidth="1" strokeDasharray="3 3"/>)}
          </svg>
        </div>
        <div className="flex justify-center items-center space-x-3 mt-3">
            <button onClick={() => setZoomLevel(prev => Math.max(0.2, prev - 0.1))} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" aria-label="Zoom Out"><Minus className="h-5 w-5 text-gray-700 dark:text-gray-300" /></button>
            <span className="text-gray-700 dark:text-gray-300 w-24 text-center text-sm">Zoom: {zoomLevel.toFixed(1)}x</span>
            <button onClick={() => setZoomLevel(prev => Math.min(3.0, prev + 0.1))} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" aria-label="Zoom In"><Plus className="h-5 w-5 text-gray-700 dark:text-gray-300" /></button>
        </div>
      </div>
    </div>
  );
}

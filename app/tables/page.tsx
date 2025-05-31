"use client";

import React, { useState, useEffect, useRef } from 'react'; // Added useRef for potential drag-drop
import {
  Lock, Unlock, MapPin, Users, Circle, Square as SquareIcon, Maximize2, Minus, Plus, Coffee, Armchair,
  DoorOpen, PersonStanding, ChefHat, GlassWater, Move // New icons
} from 'lucide-react';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

interface ChairProps {
  x: number;
  y: number;
  angle?: number; // For rotation
  size: number;
  fillColor: string;
  strokeColor: string;
}

const ChairSvg: React.FC<ChairProps> = ({ x, y, angle = 0, size, fillColor, strokeColor }) => {
  const chairWidth = size * 0.7;
  const chairHeight = size * 0.7;
  const backHeight = chairHeight * 0.4;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <rect
        x={-chairWidth / 2}
        y={-chairHeight / 2}
        width={chairWidth}
        height={chairHeight}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="0.5"
        rx="1"
      />
      <rect
        x={-chairWidth / 2}
        y={-chairHeight / 2 - backHeight}
        width={chairWidth}
        height={backHeight}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="0.5"
        rx="1"
      />
    </g>
  );
};

interface TableProps {
  id: string;
  shape: 'circle' | 'square' | 'rectangle';
  x: number; // percentage (center x)
  y: number; // percentage (center y)
  size: number;
  seats: number;
  isBooked: boolean;
  isSelected?: boolean;
  onClick: (id: string) => void;
  label?: string;
  // Properties for drag-and-drop (conceptual)
  isDragging?: boolean;
}

const TableSvg: React.FC<TableProps> = ({ shape, size, seats, isBooked, isSelected, onClick, id, label }) => {
  const basePixelSize = 50;
  const tableTopSize = basePixelSize * size;
  const tableLegHeight = tableTopSize * 0.12;
  const chairSizeUnit = basePixelSize * size * 0.2;

  const availableStroke = 'rgb(107 114 128)';
  const availableFill = 'rgb(209 213 219)';
  const availableLegFill = 'rgb(156 163 175)';
  const availableTextColor = 'rgb(31 41 55)';

  const selectedStroke = 'rgb(37 99 235)';
  const selectedFill = 'rgb(147 197 253)';
  const selectedLegFill = 'rgb(96 165 250)';
  const selectedTextColor = 'rgb(30 64 175)';

  const bookedOpacity = 0.45;
  const bookedFilter = "url(#lockedTableShadowAdvanced)";
  const bookedIconColor = 'rgb(55 65 81)';

  const chairFillColor = isSelected ? 'rgb(219 234 254)' : 'rgb(249 250 251)';
  const chairStrokeColor = isSelected ? 'rgb(96 165 250)' : 'rgb(156 163 175)';

  const currentStroke = isSelected ? selectedStroke : availableStroke;
  const currentFill = isSelected ? selectedFill : availableFill;
  const currentLegFill = isSelected ? selectedLegFill : availableLegFill;
  const currentTextColor = isSelected ? selectedTextColor : availableTextColor;

  const handleClick = () => {
    if (!isBooked) onClick(id);
  };

  const iconDisplaySize = tableTopSize * 0.3;
  // Added 'draggable-element' class for potential drag-and-drop identification
  const groupClassName = `cursor-pointer draggable-element ${isBooked ? 'cursor-not-allowed' : 'hover:brightness-105 filter hover:drop-shadow-md'}`;

  const chairs: JSX.Element[] = [];
  const chairOffsetMultiplier = 0.6;
  const chairOffset = tableTopSize * chairOffsetMultiplier;

  // Chair placement logic (remains the same)
  if (shape === 'circle') {
    for (let i = 0; i < seats; i++) {
      const angle = (i / seats) * 360;
      const rad = (angle * Math.PI) / 180;
      chairs.push(
        <ChairSvg key={`c-${id}-${i}`} x={Math.cos(rad) * chairOffset} y={Math.sin(rad) * chairOffset} angle={angle + 90} size={chairSizeUnit} fillColor={chairFillColor} strokeColor={chairStrokeColor}/>
      );
    }
  } else if (shape === 'square') {
    const seatsPerSide = Math.floor(seats / 4);
    const extraSeats = seats % 4;
    const sideOffsets = [-chairOffset, chairOffset];
    let chairCount = 0;
    for (let sideIndex = 0; sideIndex < 2; sideIndex++) { // Top & Bottom
        const numChairsThisSide = seatsPerSide + (extraSeats > sideIndex ? 1 : 0);
        for (let i = 0; i < numChairsThisSide; i++) {
            if (chairCount >= seats) break;
            const xPos = (i - (numChairsThisSide - 1) / 2) * (chairSizeUnit * 1.3);
            chairs.push(<ChairSvg key={`c-${id}-tb-${chairCount}`} x={xPos} y={sideOffsets[sideIndex]} angle={sideIndex === 0 ? 0 : 180} size={chairSizeUnit} fillColor={chairFillColor} strokeColor={chairStrokeColor}/>);
            chairCount++;
        }
    }
    const remainingSeatsForSides = seats - chairCount;
    const seatsPerVerticalSide = Math.floor(remainingSeatsForSides / 2);
    const extraVerticalSeats = remainingSeatsForSides % 2;
    for (let sideIndex = 0; sideIndex < 2; sideIndex++) { // Left & Right
        const numChairsThisSide = seatsPerVerticalSide + (extraVerticalSeats > sideIndex ? 1 : 0);
        for (let i = 0; i < numChairsThisSide; i++) {
            if (chairCount >= seats) break;
            const yPos = (i - (numChairsThisSide - 1) / 2) * (chairSizeUnit * 1.3);
            chairs.push(<ChairSvg key={`c-${id}-lr-${chairCount}`} x={sideOffsets[sideIndex]} y={yPos} angle={sideIndex === 0 ? 270 : 90} size={chairSizeUnit} fillColor={chairFillColor} strokeColor={chairStrokeColor}/>);
            chairCount++;
        }
    }
  } else if (shape === 'rectangle') {
    const longSideLength = tableTopSize * 1.5;
    const shortSideLength = tableTopSize;
    const longSideChairOffset = longSideLength * 0.5 + chairSizeUnit * 0.15; // Adjusted offset
    const shortSideChairOffset = shortSideLength * 0.5 + chairSizeUnit * 0.15; // Adjusted offset

    let seatsPlaced = 0;
    const seatsOnLongSides = Math.floor(seats / 2); // Prioritize long sides
    const seatsOnShortSides = Math.ceil((seats - seatsOnLongSides * 2) / 2); // Remaining for short sides

    // Long sides (Right and Left)
    for (let i = 0; i < seatsOnLongSides && seatsPlaced < seats; i++) {
        const yPos = (i - (seatsOnLongSides - 1) / 2) * (chairSizeUnit * 1.3);
        chairs.push(<ChairSvg key={`c-${id}-r${i}`} x={longSideChairOffset} y={yPos} angle={90} size={chairSizeUnit} fillColor={chairFillColor} strokeColor={chairStrokeColor} />);
        seatsPlaced++;
        if (seatsPlaced >= seats) break;
        chairs.push(<ChairSvg key={`c-${id}-l${i}`} x={-longSideChairOffset} y={yPos} angle={270} size={chairSizeUnit} fillColor={chairFillColor} strokeColor={chairStrokeColor} />);
        seatsPlaced++;
    }
    // Short sides (Top and Bottom)
    for (let i = 0; i < seatsOnShortSides && seatsPlaced < seats; i++) {
        const xPos = (i - (seatsOnShortSides - 1) / 2) * (chairSizeUnit * 1.3);
        chairs.push(<ChairSvg key={`c-${id}-t${i}`} x={xPos} y={-shortSideChairOffset} angle={0} size={chairSizeUnit} fillColor={chairFillColor} strokeColor={chairStrokeColor} />);
        seatsPlaced++;
        if (seatsPlaced >= seats) break;
        chairs.push(<ChairSvg key={`c-${id}-b${i}`} x={xPos} y={shortSideChairOffset} angle={180} size={chairSizeUnit} fillColor={chairFillColor} strokeColor={chairStrokeColor} />);
        seatsPlaced++;
    }
  }

  return (
    <g
      onClick={handleClick}
      className={groupClassName}
      data-id={id} // For drag-and-drop identification
      data-type="table" // For drag-and-drop identification
      style={{ opacity: isBooked ? bookedOpacity : 1 }}
      filter={isBooked ? bookedFilter : undefined}
    >
      <defs>
        <filter id="lockedTableShadowAdvanced" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1.5" dy="1.5" stdDeviation="1.5" floodColor="rgba(0,0,0,0.3)" />
        </filter>
        <linearGradient id={`tableGrad-${id}-${isSelected}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: currentFill, stopOpacity:1}} />
            <stop offset="80%" style={{stopColor: currentFill, stopOpacity:0.9}} />
            <stop offset="100%" style={{stopColor: currentLegFill, stopOpacity:0.8}} />
        </linearGradient>
         <filter id="element3D" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
            <feOffset dx="1" dy="1" result="offsetblur"/>
            <feFlood floodColor="rgba(0,0,0,0.2)"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
      </defs>
      {chairs}
      {shape === 'circle' && (<><circle cx={0} cy={tableLegHeight * 0.6} r={tableTopSize / 2 * 0.95} fill={currentLegFill} opacity="0.6" /><circle cx={0} cy={0} r={tableTopSize / 2} fill={`url(#tableGrad-${id}-${isSelected})`} stroke={currentStroke} strokeWidth="1.5" /></>)}
      {shape === 'square' && (<><rect x={-tableTopSize/2 + tableLegHeight*0.1} y={-tableTopSize/2 + tableLegHeight*0.1} width={tableTopSize - tableLegHeight*0.2} height={tableTopSize - tableLegHeight*0.2} fill={currentLegFill} rx={tableTopSize * 0.06} opacity="0.6"/><rect x={-tableTopSize/2} y={-tableTopSize/2} width={tableTopSize} height={tableTopSize} fill={`url(#tableGrad-${id}-${isSelected})`} stroke={currentStroke} strokeWidth="1.5" rx={tableTopSize * 0.08} /></>)}
      {shape === 'rectangle' && (<><rect x={-(tableTopSize * 1.5)/2 + tableLegHeight*0.1} y={-tableTopSize/2 + tableLegHeight*0.1} width={tableTopSize*1.5 - tableLegHeight*0.2} height={tableTopSize - tableLegHeight*0.2} fill={currentLegFill} rx={tableTopSize * 0.06} opacity="0.6"/><rect x={-(tableTopSize * 1.5)/2} y={-tableTopSize/2} width={tableTopSize*1.5} height={tableTopSize} fill={`url(#tableGrad-${id}-${isSelected})`} stroke={currentStroke} strokeWidth="1.5" rx={tableTopSize * 0.08} /></>)}
      <g className="pointer-events-none select-none">
        {label && (<text x={0} y={-tableTopSize * 0.18} textAnchor="middle" dominantBaseline="middle" fontSize={tableTopSize * 0.20} fill={isBooked ? 'rgb(100,100,100)' : currentTextColor} fontWeight="600">{label}</text>)}
        <text x={0} y={label ? tableTopSize * 0.16 : 0} textAnchor="middle" dominantBaseline="middle" fontSize={tableTopSize * (label ? 0.17 : 0.23)} fill={isBooked ? 'rgb(120,120,120)' : currentTextColor} fontWeight="500">
          <Users size={tableTopSize * 0.14} style={{display:"inline", verticalAlign:"-0.1em", marginRight:"3px"}} />{seats}
        </text>
      </g>
      {isBooked && (<Lock x={-iconDisplaySize/2} y={-iconDisplaySize/2} size={iconDisplaySize} color={bookedIconColor} className="pointer-events-none" strokeWidth="1.5"/>)}
      {!isBooked && isSelected && (<Unlock x={-iconDisplaySize/2} y={-iconDisplaySize/2} size={iconDisplaySize} color="rgb(22 163 74)" className="pointer-events-none" strokeWidth="1.5"/>)}
    </g>
  );
};

interface RestaurantElement {
  id: string;
  type: 'wall' | 'bar' | 'kitchen' | 'door' | 'window' | 'decoration' | 'wc';
  x: number; y: number;
  width: number; height: number;
  label?: string;
  color?: string;
  strokeColor?: string;
  labelColor?: string;
  icon?: React.ElementType;
  iconColor?: string;
  rx?: number;
  depth?: number;
  // For drag-and-drop (conceptual)
  isDragging?: boolean;
}

// --- Adjusted Initial Layout Data ---
const KITCHEN_X = 3;
const KITCHEN_Y = 3;
const KITCHEN_WIDTH = 28;
const KITCHEN_HEIGHT = 22;

const BAR_X = 65;
const BAR_Y = 40;
const BAR_WIDTH = 30;
const BAR_HEIGHT = 12;

const initialRestaurantElements: RestaurantElement[] = [
  { id: 'wall-n', type: 'wall', x: 0, y: 0, width: 100, height: 2, color: 'rgb(156 163 175)', strokeColor: 'rgb(107 114 128)' },
  { id: 'wall-s', type: 'wall', x: 0, y: 98, width: 100, height: 2, color: 'rgb(156 163 175)', strokeColor: 'rgb(107 114 128)' },
  { id: 'wall-w', type: 'wall', x: 0, y: 0, width: 2, height: 100, color: 'rgb(156 163 175)', strokeColor: 'rgb(107 114 128)' },
  { id: 'wall-e', type: 'wall', x: 98, y: 0, width: 2, height: 100, color: 'rgb(156 163 175)', strokeColor: 'rgb(107 114 128)' },
  { id: 'door-main', type: 'door', x: 45, y: 97.5, width: 10, height: 3, label: 'Bejárat', color: 'rgb(161 98 7)', strokeColor: 'rgb(120 53 15)', labelColor: 'rgb(253 224 71)', rx:1, depth: 0.5, icon: DoorOpen, iconColor: 'rgb(253 224 71)'},
  { id: 'bar', type: 'bar', x: BAR_X, y: BAR_Y, width: BAR_WIDTH, height: BAR_HEIGHT, label: 'Pult', color: 'rgb(120 53 15)', strokeColor: 'rgb(77 42 10)', labelColor: 'rgb(254 252 232)', rx:2, depth: 2, icon: Coffee, iconColor: 'rgb(253 224 71)'},
  { id: 'kitchen', type: 'kitchen', x: KITCHEN_X, y: KITCHEN_Y, width: KITCHEN_WIDTH, height: KITCHEN_HEIGHT, label: 'Konyha', color: 'rgb(209 213 219)', strokeColor: 'rgb(107 114 128)', labelColor: 'rgb(55 65 81)', rx:2, depth: 1, icon: ChefHat, iconColor: 'rgb(55 65 81)'},
  { id: 'window-1', type: 'window', x: 2, y: 30, width: 2, height: 20, color: 'rgb(173 216 230)', strokeColor: 'rgb(107 114 128)', rx:1, depth: 0.3, label: '', icon: GlassWater, iconColor: 'rgba(255,255,255,0.5)'},
  { id: 'window-2', type: 'window', x: 2, y: 60, width: 2, height: 20, color: 'rgb(173 216 230)', strokeColor: 'rgb(107 114 128)', rx:1, depth: 0.3, label: '', icon: GlassWater, iconColor: 'rgba(255,255,255,0.5)'},
  { id: 'plant-1', type: 'decoration', x: 92, y: 5, width: 4, height: 8, color: 'rgb(22 101 52)', label:'🪴', labelColor: 'rgb(34 197 94)', rx:20},
  { id: 'wc-area', type: 'wc', x: 85, y: 85, width: 12, height: 12, label: 'WC', color: 'rgb(224 231 255)', strokeColor: 'rgb(129 140 248)', labelColor: 'rgb(67 56 202)', rx:2, depth: 1, icon: PersonStanding, iconColor: 'rgb(67 56 202)'},
];

// Adjusted initialTables to avoid overlap with Kitchen and Bar
const initialTablesData: TableProps[] = [
  // Tables further away from kitchen/bar
  { id: generateId(), shape: 'circle',    x: 40, y: 30, size: 1,    seats: 4, isBooked: false, label: "A1" } as TableProps,
  { id: generateId(), shape: 'square',    x: 55, y: 15, size: 1.2,  seats: 6, isBooked: true,  label: "A2" } as TableProps,
  { id: generateId(), shape: 'rectangle', x: 35, y: 50, size: 1,    seats: 8, isBooked: false, label: "B1" } as TableProps,
  { id: generateId(), shape: 'circle',    x: 85, y: 25, size: 0.9,  seats: 2, isBooked: false, label: "A3" } as TableProps,
  { id: generateId(), shape: 'square',    x: 15, y: 60, size: 1,    seats: 4, isBooked: false, label: "C1" } as TableProps, // Moved from kitchen area
  { id: generateId(), shape: 'rectangle', x: 45, y: 75, size: 1.1,  seats: 6, isBooked: true,  label: "B2" } as TableProps,
  { id: generateId(), shape: 'circle',    x: 70, y: 65, size: 1,    seats: 4, isBooked: false, label: "C2" } as TableProps, // Moved from bar area
  { id: generateId(), shape: 'square',    x: 10, y: 85, size: 0.8,  seats: 2, isBooked: false, label: "D1" } as TableProps,
  { id: generateId(), shape: 'circle',    x: 30, y: 90, size: 1.2,  seats: 6, isBooked: true,  label: "C3" } as TableProps,
];


export default function RestaurantBookingPage() {
  // State for layout elements (conceptual for future drag-and-drop)
  const [restaurantElements, setRestaurantElements] = useState<RestaurantElement[]>(initialRestaurantElements);
  const [tables, setTables] = useState<TableProps[]>(initialTablesData.map(t => ({...t, isSelected: false, onClick: handleTableClick})));

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewBox, setViewBox] = useState("0 0 1000 600");

  // For drag-and-drop (conceptual)
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingElement, setDraggingElement] = useState<{id: string; type: 'table' | 'element'; offsetX: number; offsetY: number} | null>(null);


  const svgWidth = 1000;
  const svgHeight = 600;

  useEffect(() => {
    const newWidth = svgWidth / zoomLevel;
    const newHeight = svgHeight / zoomLevel;
    const newX = (svgWidth - newWidth) / 2;
    const newY = (svgHeight - newHeight) / 2;
    setViewBox(`${newX} ${newY} ${newWidth} ${newHeight}`);
  }, [zoomLevel, svgWidth, svgHeight]);

  function handleTableClick(id: string) {
    setTables(prevTables =>
      prevTables.map(table =>
        table.id === id && !table.isBooked
          ? { ...table, isSelected: !table.isSelected }
          : { ...table, isSelected: false }
      )
    );
    const clickedTable = tables.find(t => t.id === id);
    if (clickedTable && !clickedTable.isBooked) {
        setSelectedTableId(prevId => (prevId === id ? null : id));
    } else if (clickedTable && clickedTable.isBooked) {
        setSelectedTableId(null);
    }
  }

  const handleBooking = () => {
    if (selectedTableId) {
      const tableToBook = tables.find(t => t.id === selectedTableId);
      if (tableToBook && !tableToBook.isBooked) {
        setTables(prevTables =>
          prevTables.map(table =>
            table.id === selectedTableId ? { ...table, isBooked: true, isSelected: false } : table
          )
        );
        setSelectedTableId(null);
        alert(`Asztal (${tableToBook.label || selectedTableId}) sikeresen lefoglalva!`);
      } else {
        alert("Ez az asztal már foglalt vagy nem választható.");
      }
    } else {
      alert("Kérjük, válasszon egy asztalt a foglaláshoz.");
    }
  };

    // --- Conceptual Drag and Drop Handlers ---
    // These are placeholders and would need significant fleshing out with
    // proper coordinate calculations, SVG transformations, and state updates.
    // A library like react-dnd or interact.js would be recommended for a robust solution.

    const handleMouseDown = (e: React.MouseEvent<SVGGElement>, id: string, type: 'table' | 'element') => {
        // console.log(`Mouse down on ${type} ${id}`);
        // This is where you'd initiate drag:
        // 1. Get mouse position relative to SVG and element.
        // 2. Set `draggingElement` state.
        // 3. Add mousemove and mouseup listeners to the window.
        // alert(`Drag-and-drop builder functionality is conceptual and not fully implemented in this version.`);
    };

    // const handleMouseMove = (e: MouseEvent) => {
    //     if (!draggingElement || !svgRef.current) return;
    //     // This is where you'd update element position during drag:
    //     // 1. Calculate new SVG coordinates.
    //     // 2. Update the x, y of the table/element in state.
    // };

    // const handleMouseUp = () => {
    //     if (!draggingElement) return;
    //     // This is where you'd finalize drag:
    //     // 1. Clear `draggingElement` state.
    //     // 2. Remove mousemove/mouseup listeners from window.
    //     // 3. Potentially save new layout (e.g., to localStorage or backend).
    //     setDraggingElement(null);
    // };

    // useEffect(() => {
    //     // Add/remove global mouse listeners for drag operation
    //     if (draggingElement) {
    //         window.addEventListener('mousemove', handleMouseMove);
    //         window.addEventListener('mouseup', handleMouseUp);
    //     } else {
    //         window.removeEventListener('mousemove', handleMouseMove);
    //         window.removeEventListener('mouseup', handleMouseUp);
    //     }
    //     return () => {
    //         window.removeEventListener('mousemove', handleMouseMove);
    //         window.removeEventListener('mouseup', handleMouseUp);
    //     };
    // }, [draggingElement]);
    // --- End Conceptual Drag and Drop ---


  const selectedTableDetails = tables.find(table => table.id === selectedTableId);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-2 sm:p-4 font-sans">
      <div className="w-full max-w-6xl bg-white dark:bg-gray-800 shadow-2xl rounded-lg p-4 sm:p-6">
        {/* Builder Mode Toggle - Conceptual */}
        {/* <div className="text-right mb-2">
            <label className="inline-flex items-center cursor-pointer">
                <span className="mr-2 text-sm text-gray-600 dark:text-gray-300">Builder Mode</span>
                <input type="checkbox" className="sr-only peer" />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
        </div> */}
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-white mb-1 sm:mb-2">Étterem Asztalfoglalás</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Válasszon egy szabad asztalt a tervrajzról.</p>

        <div className="relative w-full aspect-[10/6] border-2 border-gray-300 dark:border-gray-600 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-800/30">
          <svg ref={svgRef} preserveAspectRatio="xMidYMid meet" viewBox={viewBox} className="w-full h-full select-none">
            <defs>
                <filter id="elementDepthEffect" x="-20%" y="-20%" width="140%" height="140%">
                    <feOffset result="offOut" in="SourceAlpha" dx="0.8" dy="0.8" />
                    <feGaussianBlur result="blurOut" in="offOut" stdDeviation="0.5" />
                    <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                     <feComponentTransfer in="blurOut" result="alphaBlurred"><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
                    <feMerge><feMergeNode in="alphaBlurred"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <linearGradient id="windowGlassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: "rgba(220, 230, 240, 0.7)", stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor: "rgba(180, 200, 220, 0.5)", stopOpacity:1}} />
                </linearGradient>
            </defs>

            {restaurantElements.map(el => {
              const elWidth = el.width / 100 * svgWidth;
              const elHeight = el.height / 100 * svgHeight;
              const depthEffect = el.depth || 0;
              return (
                <g key={el.id}
                   transform={`translate(${el.x / 100 * svgWidth}, ${el.y / 100 * svgHeight})`}
                   filter={el.type !== 'wall' && el.type !== 'decoration' ? "url(#elementDepthEffect)" : undefined}
                   className="draggable-element" // For drag-and-drop identification
                   data-id={el.id}
                   data-type="element"
                   // onMouseDown={(e) => handleMouseDown(e as any, el.id, 'element')} // Conceptual
                   >
                  {el.type !== 'wall' && el.type !== 'decoration' && depthEffect > 0 && (<rect width={elWidth} height={elHeight} fill={el.strokeColor || 'rgba(0,0,0,0.2)'} rx={el.rx !== undefined ? el.rx + depthEffect * 0.5 : 0} transform={`translate(${depthEffect * 0.5}, ${depthEffect * 0.5})`}/>)}
                  <rect width={elWidth} height={elHeight} fill={el.color || 'rgb(200,200,200)'} stroke={el.strokeColor || 'rgb(150,150,150)'} strokeWidth="0.5" rx={el.rx !== undefined ? el.rx : 0}/>
                  {el.type === 'window' && (<><rect width={elWidth} height={elHeight} fill="none" stroke={el.strokeColor || 'rgb(100,100,100)'} strokeWidth={elWidth * 0.1} rx={el.rx}/><rect x={elWidth * 0.08} y={elHeight * 0.08} width={elWidth * 0.84} height={elHeight * 0.84} fill="url(#windowGlassGradient)" rx={(el.rx || 0) * 0.8} opacity="0.8"/><line x1={elWidth*0.15} y1={elHeight*0.15} x2={elWidth*0.85} y2={elHeight*0.85} stroke="rgba(255,255,255,0.3)" strokeWidth="0.7"/><line x1={elWidth*0.15} y1={elHeight*0.85} x2={elWidth*0.85} y2={elHeight*0.15} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/></>)}
                  {el.icon && React.createElement(el.icon, {x: elWidth * (el.label && el.label.length > 0 ? 0.15 : 0.5 - (elHeight * 0.25 / elWidth)), y: elHeight * 0.5 - (elHeight * 0.25), size: elHeight * 0.5, color: el.iconColor || el.labelColor || "white", className: "pointer-events-none", strokeWidth: 1.5})}
                  {el.label && (<text x={elWidth / 2} y={elHeight / (el.icon ? 1.8 : 2)} textAnchor="middle" dominantBaseline={el.icon ? "auto" : "middle"} fontSize={Math.min(elWidth, elHeight) * (el.type === 'door' ? 0.18 : 0.22)} fill={el.labelColor || "white"} className="pointer-events-none font-semibold" dy={el.icon ? elHeight * 0.25 : 0}>{el.label}</text>)}
                </g>
              );
            })}

            {tables.map(table => (
              <g key={table.id}
                 transform={`translate(${table.x / 100 * svgWidth}, ${table.y / 100 * svgHeight})`}
                //  onMouseDown={(e) => handleMouseDown(e as any, table.id, 'table')} // Conceptual
                 >
                 <TableSvg {...table} />
              </g>
            ))}
          </svg>
        </div>

        <div className="flex justify-center items-center space-x-3 mt-4">
            <button onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" aria-label="Kicsinyítés"><Minus className="h-5 w-5 text-gray-700 dark:text-gray-300" /></button>
            <span className="text-gray-700 dark:text-gray-300 w-24 text-center text-sm">Nagyítás: {zoomLevel.toFixed(1)}x</span>
            <button onClick={() => setZoomLevel(prev => Math.min(3.0, prev + 0.1))} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" aria-label="Nagyítás"><Plus className="h-5 w-5 text-gray-700 dark:text-gray-300" /></button>
        </div>

        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-100 dark:bg-gray-700/60 rounded-lg min-h-[110px] flex flex-col justify-center">
          {selectedTableDetails && !selectedTableDetails.isBooked ? (
            <div className="text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">Kiválasztva: <span className="text-blue-600 dark:text-blue-400">{selectedTableDetails.label || selectedTableDetails.id}</span></h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base"><Users className="inline-block mr-1.5 h-5 w-5 align-text-bottom" />{selectedTableDetails.seats} férőhelyes {selectedTableDetails.shape === 'circle' && <Circle className="inline-block ml-1.5 h-4 w-4 align-text-bottom opacity-70" />}{selectedTableDetails.shape === 'square' && <SquareIcon className="inline-block ml-1.5 h-4 w-4 align-text-bottom opacity-70" />}{selectedTableDetails.shape === 'rectangle' && <Maximize2 className="inline-block ml-1.5 h-4 w-4 align-text-bottom transform rotate-45 opacity-70" />}</p>
              <button onClick={handleBooking} className="mt-3 sm:mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-150 text-sm sm:text-base">Asztal Foglalása</button>
            </div>
          ) : selectedTableDetails && selectedTableDetails.isBooked ? (
             <p className="text-center text-red-500 dark:text-red-400 font-semibold text-sm sm:text-base">Az asztal ({selectedTableDetails.label || selectedTableDetails.id}) már foglalt! Válasszon másikat.</p>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base"><MapPin className="inline-block mr-1.5 h-5 w-5 align-text-bottom" />Kattintson egy szabad asztalra a kiválasztáshoz.</p>
          )}
        </div>

        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-600">
            <h4 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3 text-center">Jelmagyarázat</h4>
            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center items-center sm:gap-x-6 gap-y-2 text-xs sm:text-sm">
                <div className="flex items-center"><div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gray-200 border-2 border-gray-500 mr-1.5 sm:mr-2"></div><span className="text-gray-600 dark:text-gray-300">Szabad asztal</span></div>
                <div className="flex items-center"><div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-blue-300 border-2 border-blue-600 mr-1.5 sm:mr-2"></div><span className="text-gray-600 dark:text-gray-300">Kiválasztott</span></div>
                <div className="flex items-center"><div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gray-200 border-2 border-gray-500 relative mr-1.5 sm:mr-2 opacity-50"><Lock size={9} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-800"/></div><span className="text-gray-600 dark:text-gray-300">Foglalt asztal</span></div>
            </div>
        </div>
      </div>
    </div>
  );
}

interface FarmDecorationsProps {
  gridWidth: number;
  gridHeight: number;
}

interface Decoration {
  type: string;
  src: string;
  col: number;
  row?: number;
  side?: 'left' | 'right';
}

export function FarmDecorations({ gridWidth, gridHeight }: FarmDecorationsProps) {
  const tileSize = 64;
  const gridWidthPx = gridWidth * tileSize;
  
  const decorations: Decoration[] = [];
  
  for (let col = 0; col < gridWidth + 2; col++) {
    decorations.push({
      type: Math.random() > 0.5 ? 'tree_small' : 'tree_medium',
      src: Math.random() > 0.5 
        ? '/farm-assets/objects/tree_small.png'
        : '/farm-assets/objects/tree_medium.png',
      col: col - 1,
    });
  }
  
  for (let row = 1; row < gridHeight - 1; row++) {
    if (row % 2 === 0) {
      decorations.push({
        type: 'tree_small',
        src: '/farm-assets/objects/tree_small.png',
        col: -1,
        row,
        side: 'left',
      });
      decorations.push({
        type: 'tree_small',
        src: '/farm-assets/objects/tree_small.png',
        col: gridWidth,
        row,
        side: 'right',
      });
    }
  }
  
  for (let col = 0; col < gridWidth + 2; col++) {
    const decType = Math.random();
    let src: string;
    let type: string;
    
    if (decType > 0.7) {
      src = '/farm-assets/objects/flower.png';
      type = 'flower';
    } else if (decType > 0.4) {
      src = '/farm-assets/objects/bush.png';
      type = 'bush';
    } else {
      src = '/farm-assets/objects/tree_small.png';
      type = 'tree_small';
    }
    
    decorations.push({
      type,
      src,
      col: col - 1,
    });
  }

  return (
    <div className="farm-decorations">
      {decorations.map((dec, idx) => {
        const isTop = dec.row === undefined && idx < gridWidth + 2;
        const isBottom = dec.row === undefined && idx >= decorations.length - (gridWidth + 2);
        const isSide = dec.side !== undefined;
        
        let style: React.CSSProperties = {};
        
        if (isTop) {
          style = {
            position: 'absolute',
            top: -48,
            left: dec.col * tileSize,
            zIndex: 1,
          };
        } else if (isBottom) {
          style = {
            position: 'absolute',
            bottom: -48,
            left: dec.col * tileSize,
            zIndex: 1,
          };
        } else if (isSide) {
          style = {
            position: 'absolute',
            top: (dec.row || 0) * tileSize,
            left: dec.side === 'left' ? -48 : gridWidthPx,
            zIndex: 1,
          };
        }

        if (!isTop && !isBottom && !isSide) return null;

        return (
          <img
            key={idx}
            src={dec.src}
            alt={dec.type}
            className="decoration-sprite pixelated"
            style={style}
          />
        );
      })}
    </div>
  );
}

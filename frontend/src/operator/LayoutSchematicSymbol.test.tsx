import {render,screen} from '@testing-library/react';
import {describe,expect,it} from 'vitest';
import type {LayoutMode} from '../shared/simulator-contract';
import {LayoutSchematicSymbol} from './LayoutSchematicSymbol';

const base:LayoutMode={id:'1015_4_base',title:'10×15',shotCount:4,selectCount:4,countdownSeconds:5,printSizeLabel:'10×15',printAspectRatio:2/3,photoAspectRatio:3/2};

describe('operator layout schematic',()=>{
  it('shows four equal slots as an exact two-by-two postcard grid',()=>{
    const {container}=render(<LayoutSchematicSymbol layout={base}/>);
    const slots=[...container.querySelectorAll('svg g rect')];
    expect(screen.getByRole('img',{name:/2 cột, 4 ô ảnh/})).toHaveAttribute('viewBox','0 0 100 150');
    expect(slots).toHaveLength(4);
    expect(slots.map(slot=>slot.getAttribute('x'))).toEqual([slots[0].getAttribute('x'),slots[1].getAttribute('x'),slots[0].getAttribute('x'),slots[1].getAttribute('x')]);
    expect(slots[0].getAttribute('y')).toBe(slots[1].getAttribute('y'));
    expect(slots[2].getAttribute('y')).toBe(slots[3].getAttribute('y'));
    expect(Number(slots[2].getAttribute('y'))).toBeGreaterThan(Number(slots[0].getAttribute('y')));
  });

  it('shows a one-column 5×15 strip and honors valid backend slot positions',()=>{
    const strip={...base,id:'515_4_anh',printAspectRatio:1/3};
    const {container,rerender}=render(<LayoutSchematicSymbol layout={strip}/>);
    expect(screen.getByRole('img',{name:/1 cột, 4 ô ảnh/})).toHaveAttribute('viewBox','0 0 50 150');
    const slots=[...container.querySelectorAll('svg g rect')];
    expect(new Set(slots.map(slot=>slot.getAttribute('x'))).size).toBe(1);
    rerender(<LayoutSchematicSymbol layout={{...strip,absoluteSlots:[
      {index:0,x:.1,y:.1,width:.8,height:.15},{index:1,x:.1,y:.3,width:.8,height:.15},
      {index:2,x:.1,y:.5,width:.8,height:.15},{index:3,x:.1,y:.7,width:.8,height:.15},
    ]}}/>);
    expect(container.querySelector('svg g rect')).toHaveAttribute('x','5');
    expect(container.querySelector('svg g rect')).toHaveAttribute('y','15');
  });
});

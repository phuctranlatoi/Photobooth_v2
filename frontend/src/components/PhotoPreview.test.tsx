import {fireEvent,render,screen} from '@testing-library/react';
import {describe,it,expect,vi} from 'vitest';
import {PhotoPreview} from './PhotoPreview';

describe('original photo inspection',()=>{
  it('contains the original image without changing selection and closes once',()=>{
    const close=vi.fn();
    render(<PhotoPreview src="data:image/png;base64,AA==" label="Original portrait" onClose={close}/>);
    expect(screen.getByRole('img')).toHaveAttribute('src','data:image/png;base64,AA==');
    expect(screen.getByRole('img').parentElement).toHaveClass('photo-preview-media');
    expect(screen.getByRole('dialog')).toHaveClass('photo-preview-dialog');
    expect(screen.getByRole('button',{name:'Close preview'})).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('dialog'),{key:'Tab'});
    expect(screen.getByRole('button')).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});
    expect(close).toHaveBeenCalledTimes(1);
  });
  it('restores focus to the original touch control after closing',()=>{
    const trigger=document.createElement('button');document.body.append(trigger);trigger.focus();
    const view=render(<PhotoPreview src="fixture.png" label="Original landscape" onClose={()=>{}}/>);
    view.unmount();expect(trigger).toHaveFocus();trigger.remove();
  });
});

import React from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';
import {AppShell} from './screens/KioskUI';
import {StudioModeScreen} from './screens/StudioModeScreen';
import type {LayoutMode} from './shared/simulator-contract';

const base:Omit<LayoutMode,'id'>={title:'',printSizeLabel:'10x15',shotCount:4,selectCount:4,countdownSeconds:5,gridColumns:2,printAspectRatio:2/3,photoAspectRatio:3/2,paddingLeftRatio:.055,paddingRightRatio:.055,paddingTopRatio:.055,gapHorizontalRatio:.035,gapVerticalRatio:.035};
const layouts:LayoutMode[]=[
 {...base,id:'515_4_anh',title:'515_4_anh',printSizeLabel:'5x15',printAspectRatio:1/3,gridColumns:1},
 {...base,id:'1015_4_base',title:'1015_4_base'},
 {...base,id:'1015_4_ILCL',title:'1015_4_ILCL'},
];
createRoot(document.getElementById('root')!).render(<React.StrictMode><AppShell><StudioModeScreen layout={layouts[1]} layouts={layouts} busy={false} action={()=>{}} preview=""/></AppShell></React.StrictMode>);
